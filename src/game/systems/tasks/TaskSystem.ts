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
    
    // Check inventory requirement
    if (step.requiresItem && !this.inventory.has(step.requiresItem)) {
      return false;
    }
    
    return true;
  }

  completeCurrentStep(): void {
    if (!this.currentTask) return;
    
    const step = this.currentTask.steps[this.currentStepIndex];
    
    // Grant item based on step (simple mapping)
    if (step.id === 'pickup_axe') {
      this.inventory.add('axe');
    } else if (step.id === 'chop_log') {
      this.inventory.add('log');
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
      // Reset to beginning for testing (in production, would load next task)
      this.currentStepIndex = 0;
      this.inventory.clear();
      console.log('[TaskSystem] Task complete - reset to step 0');
    } else {
      this.emitTaskEvent();
    }
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
