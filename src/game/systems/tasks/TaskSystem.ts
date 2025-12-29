/**
 * Task System - toddler-friendly task chains
 */

import type { Task } from '@game/content/tasks';
import type { GameToUi } from '@game/shared/events';

interface EventBus {
  emit(event: GameToUi): void;
}

export class TaskSystem {
  private currentTask: Task | null = null;
  private currentStepIndex = 0;
  private inventory = new Set<string>();

  constructor(private eventBus: EventBus) {}

  addItem(itemId: string): void {
    this.inventory.add(itemId);
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
        this.inventory.add(itemId);
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
        this.inventory.delete(itemId); // Safe if item doesn't exist
      }
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
  }
}
