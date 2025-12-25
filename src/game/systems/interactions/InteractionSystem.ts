/**
 * Interaction System - proximity prompts + auto-interact on dwell
 */

import { Vector3 } from '@babylonjs/core';
import type { TaskSystem } from '../tasks/TaskSystem';
import type { GameToUi } from '@game/shared/events';

interface Interactable {
  id: string;
  mesh: { position: Vector3 };
  interact: () => void;
}

interface EventBus {
  emit(event: GameToUi): void;
}

const DWELL_DURATION = 500; // ms

export class InteractionSystem {
  private interactables: Interactable[] = [];
  private dwellTarget: string | null = null;
  private dwellTime = 0;
  private lastPromptId: string | null = null;

  constructor(
    private taskSystem: TaskSystem,
    private eventBus: EventBus
  ) {}

  registerInteractable(interactable: Interactable): void {
    this.interactables.push(interactable);
  }

  update(playerPos: Vector3, dt: number): void {
    const targetId = this.taskSystem.getCurrentTargetId();
    if (!targetId) {
      this.clearDwell();
      return;
    }

    const target = this.interactables.find((i) => i.id === targetId);
    if (!target) {
      this.clearDwell();
      return;
    }

    const distance = Vector3.Distance(playerPos, target.mesh.position);
    const interactRadius = 3.0;

    if (distance < interactRadius) {
      // Player near target - accumulate dwell time
      if (this.dwellTarget !== targetId) {
        this.dwellTarget = targetId;
        this.dwellTime = 0;
      }
      
      this.dwellTime += dt * 1000; // Convert to ms

      // Show prompt if not shown yet
      if (!this.lastPromptId || this.lastPromptId !== targetId) {
        const step = this.taskSystem.getCurrentStep();
        if (step) {
          this.eventBus.emit({
            type: 'game/prompt',
            id: targetId,
            icon: step.promptIcon,
            worldPos: { 
              x: target.mesh.position.x, 
              y: target.mesh.position.y + 1.5, 
              z: target.mesh.position.z 
            },
          });
          this.lastPromptId = targetId;
        }
      }

      // Auto-interact on dwell complete
      if (this.dwellTime >= DWELL_DURATION && this.taskSystem.canInteract(targetId)) {
        target.interact();
        this.taskSystem.completeCurrentStep();
        this.clearDwell();
      }
    } else {
      this.clearDwell();
    }
  }

  private clearDwell(): void {
    if (this.lastPromptId) {
      this.eventBus.emit({ type: 'game/promptClear', id: this.lastPromptId });
      this.lastPromptId = null;
    }
    this.dwellTarget = null;
    this.dwellTime = 0;
  }

  dispose(): void {
    this.clearDwell();
    this.interactables = [];
  }
}
