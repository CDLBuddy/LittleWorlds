/**
 * Wake Radius System - Hysteresis-based proximity detection
 * R_IN = 6, R_OUT = 8
 * Task-aware: keeps current task target awake at larger radius
 */

import { Scene, AbstractMesh, Vector3, Animation } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import type { TaskSystem } from '../tasks/TaskSystem';

export interface Wakeable {
  id: string;
  mesh: AbstractMesh;
  asleep: boolean;
  wake(): void;
  sleep(): void;
}

interface EventBus {
  emit(event: AppEvent): void;
}

export class WakeRadiusSystem {
  private readonly R_IN = 6;
  private readonly R_OUT = 8;
  private readonly TASK_R_IN = 14; // Larger radius for task targets
  private wakeables: Wakeable[] = [];
  private taskSystem: TaskSystem | null = null;

  constructor(private scene: Scene, _eventBus: EventBus) {}

  setTaskSystem(taskSystem: TaskSystem) {
    this.taskSystem = taskSystem;
  }

  addWakeable(wakeable: Wakeable) {
    // Force initial world matrix computation to ensure correct absolute position
    wakeable.mesh.computeWorldMatrix(true);
    this.wakeables.push(wakeable);
  }

  removeWakeable(id: string) {
    this.wakeables = this.wakeables.filter((w) => w.id !== id);
  }

  update(playerPosition: Vector3) {
    const taskTargetId = this.taskSystem?.getCurrentTargetId();
    
    for (const wakeable of this.wakeables) {
      const wakeablePos = wakeable.mesh.getAbsolutePosition();
      const distance = Vector3.Distance(playerPosition, wakeablePos);
      const isTaskTarget = taskTargetId === wakeable.id;
      const rIn = isTaskTarget ? this.TASK_R_IN : this.R_IN;
      const rOut = isTaskTarget ? this.TASK_R_IN + 2 : this.R_OUT;

      if (wakeable.asleep && distance < rIn) {
        // Wake up
        wakeable.wake();
        this.animateWake(wakeable.mesh);
      } else if (!wakeable.asleep && distance > rOut && !isTaskTarget) {
        // Go to sleep (but never sleep current task target)
        wakeable.sleep();
      }
    }
  }

  private animateWake(mesh: AbstractMesh) {
    // Small "pop" animation: scale from 0.85 to 1.0 over 0.2s
    const originalScale = mesh.scaling.clone();
    mesh.scaling.scaleInPlace(0.85);

    const animationScale = new Animation(
      'wakeScale',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: mesh.scaling.clone() },
      { frame: 12, value: originalScale },
    ];

    animationScale.setKeys(keys);
    mesh.animations = [animationScale];
    this.scene.beginAnimation(mesh, 0, 12, false);
  }

  dispose() {
    this.wakeables = [];
  }
}
