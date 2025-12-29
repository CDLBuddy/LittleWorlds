/**
 * Task System - toddler-friendly task chains
 */

import type { Task } from '@game/content/tasks';
import type { AppEvent } from '@game/shared/events';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

export class TaskSystem {
  private currentTask: Task | null = null;
  private currentStepIndex = 0;
  private inventory = new Set<string>();
  private eventBusSub: (() => void) | null = null;

  constructor(private eventBus: EventBus) {
    // Listen for inventory requests from UI
    this.eventBusSub = this.eventBus.on((evt) => {
      if (evt.type === 'ui/getInventory') {
        this.broadcastInventory();
      }
    });
  }

  addItem(itemId: string): void {
    this.inventory.add(itemId);
    this.broadcastInventory();
  }

  startTask(task: Task): void {
    this.currentTask = task;
    this.currentStepIndex = 0;
    this.emitTaskEvent();
  }

  getCurrentTargetId(): string | null {
    if (!this.currentTask || this.currentStepIndex >= this.currentTask.steps.length) {
      return null;
    }
    return this.currentTask.steps[this.currentStepIndex].targetId;
  }

  getCurrentStep() {
    if (!this.currentTask || this.currentStepIndex >= this.currentTask.steps.length) {
      return null;
    }
    return this.currentTask.steps[this.currentStepIndex];
  }

  canInteract(targetId: string): boolean {
    if (!this.currentTask) return false;
    
    const step = this.currentTask.steps[this.currentStepIndex];
    if (step.targetId !== targetId) return false;
    
    // Check all required items are in inventory
    if (step.requiresItems) {
      for (const itemId of step.requiresItems) {
        if (!this.inventory.has(itemId)) {
          return false;
        }
      }
    }
    
    return true;
  }

  completeCurrentStep(): void {
    if (!this.currentTask) return;
    
    const step = this.currentTask.steps[this.currentStepIndex];
    
    // Grant items (data-driven)
    if (step.grantsItems) {
      for (const itemId of step.grantsItems) {
        this.addItem(itemId);
      }
      
      // Emit toast for item gains
      if (step.grantsItems.length > 0) {
        const itemNames = step.grantsItems.map(id => this.formatItemName(id));
        const message = itemNames.length === 1
          ? `You found: ${itemNames[0]}!`
          : `You found: ${itemNames.slice(0, 2).join(' + ')}!`; // Show max 2 items
        
        // Emit toast notification (cast to any as ui/toast is not in GameToUi union)
        (this.eventBus as any).emit({
          type: 'ui/toast',
          level: 'info',
          message,
        });
      }
    }
    
    // Consume items (data-driven)
    if (step.consumesItems) {
      for (const itemId of step.consumesItems) {
        this.inventory.delete(itemId);
      }
      this.broadcastInventory(); // Update UI after consuming items
    }
    
    this.currentStepIndex++;
    
    // Check if task complete
    if (this.currentStepIndex >= this.currentTask.steps.length) {
      this.eventBus.emit({
        type: 'game/task',
        taskId: this.currentTask.id,
        stepIndex: this.currentStepIndex,
        complete: true,
      });
      // Don't set currentTask to null - ProgressionSystem will start next task
      console.log('[TaskSystem] Task complete - inventory preserved');
    } else {
      this.emitTaskEvent();
    }
  }
  
  /**
   * Format item ID into display name (slingshot -> Slingshot, steel_balls -> Steel Balls)
   */
  private formatItemName(itemId: string): string {
    return itemId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get current inventory as array
   */
  getInventory(): string[] {
    return Array.from(this.inventory);
  }

  private broadcastInventory(): void {
    const items = Array.from(this.inventory);
    this.eventBus.emit({ type: 'game/inventoryUpdate', items });
  }

  private emitTaskEvent(): void {
    if (!this.currentTask) return;
    
    this.eventBus.emit({
      type: 'game/task',
      taskId: this.currentTask.id,
      stepIndex: this.currentStepIndex,
    });
  }

  dispose(): void {
    this.currentTask = null;
    this.inventory.clear();
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }
  }
}
