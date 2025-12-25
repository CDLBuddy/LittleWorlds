/**
 * Wake Radius System - Hysteresis-based proximity detection
 * R_IN = 6, R_OUT = 8
 */

import { Scene, AbstractMesh, Vector3, Animation } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';

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
  private wakeables: Wakeable[] = [];

  constructor(private scene: Scene, private eventBus: EventBus) {}

  addWakeable(wakeable: Wakeable) {
    this.wakeables.push(wakeable);
  }

  removeWakeable(id: string) {
    this.wakeables = this.wakeables.filter((w) => w.id !== id);
  }

  update(playerPosition: Vector3) {
    for (const wakeable of this.wakeables) {
      const distance = Vector3.Distance(playerPosition, wakeable.mesh.position);

      if (wakeable.asleep && distance < this.R_IN) {
        // Wake up
        wakeable.wake();
        this.animateWake(wakeable.mesh);
        this.eventBus.emit({
          type: 'game/prompt',
          id: wakeable.id,
          icon: 'hand',
        });
      } else if (!wakeable.asleep && distance > this.R_OUT) {
        // Go to sleep
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
