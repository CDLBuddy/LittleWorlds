/**
 * Companion entity - dog/cat guide with FSM
 */

import { Scene, Vector3, AbstractMesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { seek } from './steering';
import type { CompanionState } from '@game/shared/events';

interface EventBus {
  emit(event: { type: 'game/companion/state'; state: CompanionState; targetId?: string }): void;
}

export class Companion {
  id: string;
  mesh: AbstractMesh;
  private state: CompanionState = 'FollowPlayer';
  private stateTime = 0;
  private target: Vector3 | null = null;
  private targetId: string | null = null;
  private followDistance = 2.5;
  private moveSpeed = 4.0;

  constructor(
    scene: Scene,
    position: Vector3,
    private eventBus: EventBus
  ) {
    this.id = 'companion_001';
    
    // Create placeholder mesh (sphere with cute color)
    this.mesh = MeshBuilder.CreateSphere(
      'companion',
      { diameter: 0.8, segments: 16 },
      scene
    );
    this.mesh.position = position.clone();
    
    const mat = new StandardMaterial('companionMat', scene);
    mat.diffuseColor = new Color3(0.9, 0.7, 0.3); // Golden/tan color
    mat.emissiveColor = new Color3(0.3, 0.2, 0.1);
    this.mesh.material = mat;
  }

  update(dt: number, playerPosition: Vector3): void {
    this.stateTime += dt;
    
    switch (this.state) {
      case 'FollowPlayer':
        this.updateFollow(dt, playerPosition);
        break;
      case 'LeadToTarget':
        this.updateLead(dt, playerPosition);
        break;
      case 'InvestigateTarget':
        this.updateInvestigate(dt);
        break;
      case 'Celebrate':
        this.updateCelebrate(dt);
        break;
    }
  }

  private updateFollow(dt: number, playerPosition: Vector3): void {
    // Stay behind player at followDistance
    const targetPos = playerPosition.clone();
    targetPos.z -= this.followDistance; // Behind player
    
    const result = seek(this.mesh.position, targetPos, this.moveSpeed, dt, 0.5);
    this.mesh.position.addInPlace(result.velocity.scale(dt));
    this.mesh.position.y = 0.4; // Keep at ground level
  }

  private updateLead(dt: number, _playerPosition: Vector3): void {
    if (!this.target) {
      this.transitionTo('FollowPlayer');
      return;
    }
    
    const result = seek(this.mesh.position, this.target, this.moveSpeed, dt, 1.0);
    this.mesh.position.addInPlace(result.velocity.scale(dt));
    this.mesh.position.y = 0.4;
    
    if (result.arrived) {
      this.transitionTo('InvestigateTarget');
    }
  }

  private updateInvestigate(_dt: number): void {
    // Idle near target for 1.5s
    if (this.stateTime >= 1.5) {
      this.transitionTo('FollowPlayer');
    }
  }

  private updateCelebrate(_dt: number): void {
    // Quick bounce animation for 1.0s
    const bounceHeight = Math.sin(this.stateTime * 10) * 0.3;
    this.mesh.position.y = 0.4 + Math.max(0, bounceHeight);
    
    if (this.stateTime >= 1.0) {
      this.mesh.position.y = 0.4;
      this.transitionTo('FollowPlayer');
    }
  }

  transitionTo(newState: CompanionState, targetPos?: Vector3, targetId?: string): void {
    if (this.state === newState) return;
    
    this.state = newState;
    this.stateTime = 0;
    this.target = targetPos || null;
    this.targetId = targetId || null;
    
    // Emit state change event
    this.eventBus.emit({
      type: 'game/companion/state',
      state: newState,
      targetId: this.targetId || undefined,
    });
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
