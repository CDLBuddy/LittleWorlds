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
  alwaysActive?: boolean; // If true, can be interacted with even without an active task
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
  private interactionCooldown = 0; // Cooldown timer to prevent rapid re-triggering
  private readonly COOLDOWN_DURATION = 1000; // 1 second cooldown after interaction

  constructor(
    private taskSystem: TaskSystem,
    private eventBus: EventBus
  ) {}

  registerInteractable(interactable: Interactable): void {
    this.interactables.push(interactable);
  }

  update(playerPos: Vector3, dt: number): void {
    // Update cooldown timer
    if (this.interactionCooldown > 0) {
      this.interactionCooldown -= dt * 1000;
      if (this.interactionCooldown <= 0) {
        this.interactionCooldown = 0;
      }
      // Still clear prompts/dwell during cooldown
      this.clearDwell();
      return;
    }
    
    const targetId = this.taskSystem.getCurrentTargetId();
    
    // First, try to interact with the current task target
    if (targetId) {
      const target = this.interactables.find((i) => i.id === targetId);
      if (target) {
        this.handleInteraction(target, targetId, playerPos, dt, true);
        return;
      }
    }
    
    // If no task target or task target not found, check for always-active interactables
    const nearbyAlwaysActive = this.interactables.find((i) => {
      if (!i.alwaysActive) return false;
      const distance = Vector3.Distance(playerPos, i.mesh.position);
      return distance < 3.0; // Same radius as task targets
    });
    
    if (nearbyAlwaysActive) {
      this.handleInteraction(nearbyAlwaysActive, nearbyAlwaysActive.id, playerPos, dt, false);
    } else {
      this.clearDwell();
    }
  }

  private handleInteraction(
    target: Interactable,
    targetId: string,
    playerPos: Vector3,
    dt: number,
    isTaskTarget: boolean
  ): void {
    const distance = Vector3.Distance(playerPos, target.mesh.position);
    const interactRadius = 3.0;

    if (distance < interactRadius) {
      // Player near target - accumulate dwell time
      if (this.dwellTarget !== targetId) {
        this.dwellTarget = targetId;
        this.dwellTime = 0;
      }
      
      this.dwellTime += dt * 1000; // Convert to ms
      
      // Emit dwell progress
      const progress = Math.min(this.dwellTime / DWELL_DURATION, 1.0);
      this.eventBus.emit({
        type: 'game/dwell',
        id: targetId,
        progress,
      });

      // Show prompt if not shown yet
      if (!this.lastPromptId || this.lastPromptId !== targetId) {
        // For task targets, show task-specific prompt
        if (isTaskTarget) {
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
        } else {
          // For always-active interactables (like gates), show generic prompt
          this.eventBus.emit({
            type: 'game/prompt',
            id: targetId,
            icon: 'hand', // Generic icon for non-task interactions
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
      if (this.dwellTime >= DWELL_DURATION) {
        // For task targets, check if interaction is allowed
        if (isTaskTarget && !this.taskSystem.canInteract(targetId)) {
          return;
        }
        
        target.interact();
        
        // Only complete task step if this is a task target
        if (isTaskTarget) {
          this.taskSystem.completeCurrentStep();
        }
        
        // Emit interact event for SFX
        this.eventBus.emit({ type: 'game/interact', targetId });
        
        this.clearDwell();
        // Start cooldown to prevent immediate re-triggering
        // Longer cooldown for always-active interactables (gates, etc)
        this.interactionCooldown = isTaskTarget ? this.COOLDOWN_DURATION : 3000;
      }
    } else {
      this.clearDwell();
    }
  }

  private clearDwell(): void {
    if (this.dwellTarget) {
      this.eventBus.emit({ type: 'game/dwellClear', id: this.dwellTarget });
    }
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
