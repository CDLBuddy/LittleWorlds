/**
 * Touch-to-move player controller
 * Raycast to ground, smooth movement to target position
 */

import { Scene, AbstractMesh, Vector3, Observer, PointerInfo, PointerEventTypes } from '@babylonjs/core';

export class PlayerController {
  private targetPosition: Vector3 | null = null;
  private moveSpeed = 3.5;
  private stopDistance = 0.1;
  private pointerObserver: Observer<PointerInfo> | null = null;

  constructor(
    private scene: Scene,
    private player: AbstractMesh
  ) {
    this.setupPointerObserver();
  }

  private setupPointerObserver() {
    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (
        pointerInfo.type === PointerEventTypes.POINTERDOWN ||
        pointerInfo.type === PointerEventTypes.POINTERMOVE
      ) {
        // Only process if it's a primary button (left click or touch)
        if (pointerInfo.event.button !== 0) return;

        // Raycast from pointer to ground
        const ray = this.scene.createPickingRay(
          this.scene.pointerX,
          this.scene.pointerY,
          null,
          null
        );

        const hit = this.scene.pickWithRay(ray, (mesh) => {
          return mesh.name === 'ground';
        });

        if (hit?.hit && hit.pickedPoint) {
          this.targetPosition = hit.pickedPoint.clone();
        }
      }
    });
  }

  update(dt: number) {
    if (!this.targetPosition) return;

    const playerPos = this.player.position;
    const direction = this.targetPosition.subtract(playerPos);
    
    // Keep Y locked to ground level (player height)
    direction.y = 0;
    
    const distance = direction.length();

    if (distance < this.stopDistance) {
      // Reached target
      this.targetPosition = null;
      return;
    }

    // Move toward target with smooth interpolation
    const moveDistance = Math.min(this.moveSpeed * dt, distance);
    direction.normalize();
    playerPos.addInPlace(direction.scale(moveDistance));

    // Rotate player to face movement direction
    if (distance > 0.01) {
      const angle = Math.atan2(direction.x, direction.z);
      this.player.rotation.y = angle;
    }

    // Update camera target (if camera reference exists)
    const camera = (this.player as any)._camera;
    if (camera) {
      camera.target = playerPos.clone();
    }
  }

  dispose() {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
    }
  }
}
