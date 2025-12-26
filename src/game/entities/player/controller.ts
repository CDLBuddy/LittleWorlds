/**
 * Touch-to-move player controller
 * Velocity-based movement with acceleration, deceleration, and smooth turning
 */

import { Scene, Vector3, Observer, PointerInfo, PointerEventTypes, TransformNode } from '@babylonjs/core';
import { lerpAngle } from '@game/shared/math';
import { Player } from './Player';

export class PlayerController {
  private playerEntity: Player | null = null;
  private targetPosition: Vector3 | null = null;
  private velocity = Vector3.Zero();
  private currentYaw = 0;
  
  // Movement parameters
  private maxSpeed = 6.0;
  private acceleration = 18.0;
  private deceleration = 22.0;
  private stopDistance = 0.25;
  private arriveRadius = 2.0; // Start slowing down when within this distance
  private turnSmoothness = 12.0; // Higher = faster turning
  
  private pointerObserver: Observer<PointerInfo> | null = null;

  constructor(
    private scene: Scene,
    private player: TransformNode
  ) {
    this.currentYaw = this.player.rotation.y;
    this.setupPointerObserver();
  }

  public setPlayerEntity(player: Player): void {
    this.playerEntity = player;
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
    const playerPos = this.player.position;
    
    if (this.targetPosition) {
      // Calculate direction to target (2D only)
      const toTarget = this.targetPosition.subtract(playerPos);
      toTarget.y = 0;
      const distance = toTarget.length();

      if (distance < this.stopDistance) {
        // Reached target - stop
        this.targetPosition = null;
        this.velocity.scaleInPlace(0);
      } else {
        // Calculate desired velocity with arrive behavior
        const direction = toTarget.normalize();
        let desiredSpeed = this.maxSpeed;
        
        // Arrive behavior: slow down as we approach
        if (distance < this.arriveRadius) {
          desiredSpeed *= (distance / this.arriveRadius);
        }
        
        const desiredVelocity = direction.scale(desiredSpeed);
        
        // Accelerate toward desired velocity
        const velocityDiff = desiredVelocity.subtract(this.velocity);
        const accelRate = this.acceleration * dt;
        
        if (velocityDiff.length() > accelRate) {
          this.velocity.addInPlace(velocityDiff.normalize().scale(accelRate));
        } else {
          this.velocity = desiredVelocity;
        }
      }
    } else {
      // No target - decelerate to stop
      const speed = this.velocity.length();
      if (speed > 0.01) {
        const decelAmount = this.deceleration * dt;
        if (speed < decelAmount) {
          this.velocity.scaleInPlace(0);
        } else {
          this.velocity.addInPlace(this.velocity.normalize().scale(-decelAmount));
        }
      }
    }
    
    // Apply velocity to position
    playerPos.addInPlace(this.velocity.scale(dt));
    playerPos.y = 0.5; // Keep at ground level (player height)
    
    // Smooth rotation to face movement direction
    const speed = this.velocity.length();
    if (speed > 0.5) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      this.currentYaw = lerpAngle(this.currentYaw, targetYaw, 1 - Math.exp(-this.turnSmoothness * dt));
      this.player.rotation.y = this.currentYaw;
    }
    
    // Trigger animations based on speed
    if (this.playerEntity) {
      this.playerEntity.isMoving(speed);
    }
  }

  dispose() {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
    }
  }
}
