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
      // Set currentTask to null to stop prompts
      this.currentTask = null;
      console.log('[TaskSystem] Task complete - inventory preserved');
    } else {
      this.emitTaskEvent();
    }
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
