/**
 * Companion entity - dog/cat guide with FSM
 */

import { 
  Scene, 
  Vector3, 
  AbstractMesh, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  TransformNode,
  AnimationGroup 
} from '@babylonjs/core';
import { seek } from './steering';
import type { CompanionState } from '@game/shared/events';
import { loadGlb } from '@game/assets/loaders/gltf';
import { MODELS } from '@game/assets/manifest';

interface EventBus {
  emit(event: { type: 'game/companion/state'; state: CompanionState; targetId?: string }): void;
}

export class Companion {
  id: string;
  mesh: TransformNode; // Now a TransformNode that can hold imported model
  private state: CompanionState = 'FollowPlayer';
  private stateTime = 0;
  private target: Vector3 | null = null;
  private targetId: string | null = null;
  private followDistance = 2.5;
  private moveSpeed = 4.0;
  
  // Personality behavior timers
  private nextSniffTime = 0;
  private isSniffing = false;
  private sniffDuration = 0.4;
  
  // Circle behavior
  private circleCenter: Vector3 | null = null;
  private circleAngle = 0;
  private circleRadius = 1.5;
  
  // Model and animation
  private placeholder: AbstractMesh | null = null;
  private modelRoot: TransformNode | null = null;
  private animations: Map<string, AnimationGroup> = new Map();
  private currentAnimation: AnimationGroup | null = null;

  constructor(
    scene: Scene,
    position: Vector3,
    private eventBus: EventBus
  ) {
    this.id = 'companion_001';
    
    // Create a visual root that we'll move around
    this.mesh = new TransformNode('companionVisualRoot', scene);
    this.mesh.position = position.clone();
    
    // Create placeholder sphere (visible immediately)
    this.placeholder = MeshBuilder.CreateSphere(
      'companionPlaceholder',
      { diameter: 1.2, segments: 16 },
      scene
    );
    this.placeholder.parent = this.mesh;
    
    const mat = new StandardMaterial('companionMat', scene);
    mat.diffuseColor = new Color3(1.0, 0.8, 0.2);
    mat.emissiveColor = new Color3(0.6, 0.4, 0.1);
    this.placeholder.material = mat;
    
    // Initialize random sniff time
    this.nextSniffTime = this.randomSniffInterval();
    
    // Start async model load
    this.loadDogModel(scene).catch(err => {
      console.error('[Companion] Failed to load dog model:', err);
    });
    
    console.log('[Companion] Spawned at:', position);
  }
  
  private async loadDogModel(scene: Scene): Promise<void> {
    try {
      // Check if scene is still valid
      if (scene.isDisposed) {
        console.warn('[Companion] Scene disposed before model load');
        return;
      }
      
      const result = await loadGlb(scene, MODELS.dog, {
        name: 'companion',
        isPickable: false,
        receiveShadows: true
      });
      
      // Check if scene still valid after async load
      if (scene.isDisposed || this.mesh.isDisposed()) {
        console.warn('[Companion] Scene/mesh disposed during model load');
        result.root.dispose();
        return;
      }
      
      this.modelRoot = result.root;
      this.modelRoot.parent = this.mesh;
      
      // Apply scale and rotation fixes
      // Start with scale 1, adjust based on model size
      this.modelRoot.scaling.setAll(1.0);
      
      // If model is sideways, fix rotation
      this.modelRoot.rotationQuaternion = null;
      // this.modelRoot.rotation.y = Math.PI; // Uncomment if facing wrong direction
      
      // Hide/dispose placeholder
      if (this.placeholder) {
        this.placeholder.setEnabled(false);
        this.placeholder.dispose();
        this.placeholder = null;
      }
      
      // Setup animations if they exist
      this.setupAnimations(result.animationGroups);
      
      console.log('[Companion] Dog model loaded successfully');
    } catch (error) {
      console.error('[Companion] Model load failed, keeping placeholder:', error);
    }
  }
  
  private setupAnimations(animationGroups: AnimationGroup[]): void {
    if (animationGroups.length === 0) {
      console.warn('[Companion] ⚠️ No animations found in Dog.glb');
      console.warn('[Companion] 💡 Tip: When exporting from Blender:');
      console.warn('[Companion]   1. Select your armature + mesh');
      console.warn('[Companion]   2. File > Export > glTF 2.0');
      console.warn('[Companion]   3. Check "Include > Animations"');
      console.warn('[Companion]   4. Set "Animation" to "Actions" or "NLA Tracks"');
      return;
    }
    
    // Map animations by name heuristics
    animationGroups.forEach(group => {
      const nameLower = group.name.toLowerCase();
      
      if (nameLower.includes('idle')) {
        this.animations.set('idle', group);
      } else if (nameLower.includes('walk') || nameLower.includes('run')) {
        this.animations.set('walk', group);
      } else if (nameLower.includes('celebrate') || nameLower.includes('jump') || nameLower.includes('hop')) {
        this.animations.set('celebrate', group);
      }
    });
    
    // Fallback: use first animation as idle if no idle found
    if (!this.animations.has('idle') && animationGroups.length > 0) {
      this.animations.set('idle', animationGroups[0]);
    }
    
    console.log('[Companion] Animations mapped:', Array.from(this.animations.keys()));
    
    // Start with idle
    this.playAnimation('idle', true);
  }
  
  private playAnimation(name: string, loop: boolean = true): void {
    const anim = this.animations.get(name);
    if (!anim) return;
    
    // Stop current animation
    if (this.currentAnimation && this.currentAnimation !== anim) {
      this.currentAnimation.stop();
    }
    
    this.currentAnimation = anim;
    this.currentAnimation.start(loop);
  }
  
  private randomSniffInterval(): number {
    // Random interval between 8-14 seconds
    return 8 + Math.random() * 6;
  }

  update(dt: number, playerPosition: Vector3): void {
    this.stateTime += dt;
    
    // Safety check: reset if position becomes invalid
    if (isNaN(this.mesh.position.x) || isNaN(this.mesh.position.z)) {
      console.warn('[Companion] Position became NaN, resetting to start position');
      this.mesh.position = new Vector3(3, 0.4, 2);
    }
    
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
    // Validate player position
    if (!playerPosition || isNaN(playerPosition.x) || isNaN(playerPosition.z)) {
      console.warn('[Companion] Invalid player position in follow:', playerPosition);
      return;
    }
    
    // Check for sniff behavior
    if (!this.isSniffing && this.stateTime >= this.nextSniffTime) {
      this.startSniff();
    }
    
    // Handle sniffing
    if (this.isSniffing) {
      if (this.stateTime < this.nextSniffTime + this.sniffDuration) {
        // Small head bob animation during sniff
        const bobSpeed = 15;
        const bobAmount = 0.15;
        this.mesh.position.y = 0.4 + Math.abs(Math.sin(this.stateTime * bobSpeed)) * bobAmount;
        return; // Don't move while sniffing
      } else {
        // Sniff complete
        this.isSniffing = false;
        this.mesh.position.y = 0.4;
        this.nextSniffTime = this.stateTime + this.randomSniffInterval();
      }
    }
    
    // Stay behind player at followDistance
    const targetPos = playerPosition.clone();
    targetPos.z -= this.followDistance; // Behind player
    
    const result = seek(this.mesh.position, targetPos, this.moveSpeed, dt, 0.5);
    this.mesh.position.addInPlace(result.velocity.scale(dt));
    this.mesh.position.y = 0.4; // Keep at ground level
  }
  
  private startSniff(): void {
    this.isSniffing = true;
    console.log('[Companion] *sniff*');
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

  private updateInvestigate(dt: number): void {
    // Circle around target once, then idle
    if (!this.circleCenter && this.target) {
      this.circleCenter = this.target.clone();
      this.circleAngle = 0;
    }
    
    if (this.circleCenter && this.stateTime < 2.0) {
      // Complete one circle in 2 seconds
      this.circleAngle += dt * Math.PI; // Half circle per second
      
      const x = this.circleCenter.x + Math.cos(this.circleAngle) * this.circleRadius;
      const z = this.circleCenter.z + Math.sin(this.circleAngle) * this.circleRadius;
      
      this.mesh.position.x = x;
      this.mesh.position.z = z;
      this.mesh.position.y = 0.4;
    } else if (this.stateTime >= 2.5) {
      // Done investigating
      this.circleCenter = null;
      this.transitionTo('FollowPlayer');
    }
  }

  private updateCelebrate(_dt: number): void {
    // Two hops with lateral wiggle
    const hopDuration = 0.25; // Each hop lasts 0.25s
    const hop1Start = 0;
    const hop2Start = 0.4;
    
    let bounceHeight = 0;
    
    // First hop
    if (this.stateTime < hop1Start + hopDuration) {
      const t = (this.stateTime - hop1Start) / hopDuration;
      bounceHeight = Math.sin(t * Math.PI) * 0.5; // Peak at 0.5 units
    }
    // Second hop
    else if (this.stateTime >= hop2Start && this.stateTime < hop2Start + hopDuration) {
      const t = (this.stateTime - hop2Start) / hopDuration;
      bounceHeight = Math.sin(t * Math.PI) * 0.5;
    }
    
    this.mesh.position.y = 0.4 + Math.max(0, bounceHeight);
    
    if (this.stateTime >= 1.0) {
      this.mesh.position.y = 0.4;
      this.transitionTo('FollowPlayer');
    }
  }

  transitionTo(newState: CompanionState, targetPos?: Vector3, targetId?: string): void {
    if (this.state === newState) return;
    
    console.log(`[Companion] State transition: ${this.state} -> ${newState}`, { targetId, targetPos });
    
    this.state = newState;
    this.stateTime = 0;
    this.target = targetPos || null;
    this.targetId = targetId || null;
    
    // Trigger appropriate animation
    switch (newState) {
      case 'FollowPlayer':
      case 'InvestigateTarget':
        this.playAnimation('idle', true);
        break;
      case 'LeadToTarget':
        this.playAnimation('walk', true);
        break;
      case 'Celebrate': {
        // Play celebrate once, then idle
        const celebrateAnim = this.animations.get('celebrate');
        if (celebrateAnim) {
          this.playAnimation('celebrate', false);
          // After celebrate finishes, return to idle
          celebrateAnim.onAnimationGroupEndObservable.addOnce(() => {
            this.playAnimation('idle', true);
          });
        } else {
          this.playAnimation('idle', true);
        }
        break;
      }
    }
    
    // Emit state change event
    this.eventBus.emit({
      type: 'game/companion/state',
      state: newState,
      targetId: this.targetId || undefined,
    });
  }

  dispose(): void {
    // Stop all animations
    this.animations.forEach(anim => anim.stop());
    this.animations.clear();
    
    // Dispose model root
    if (this.modelRoot) {
      this.modelRoot.dispose();
    }
    
    // Dispose placeholder if still exists
    if (this.placeholder) {
      this.placeholder.dispose();
    }
    
    // Dispose main mesh
    this.mesh.dispose();
  }
}
