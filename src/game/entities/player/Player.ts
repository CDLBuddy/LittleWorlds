/**
 * Player entity - main character with async Boy.fbx model loading
 */

import { 
  Scene, 
  Mesh, 
  Vector3, 
  TransformNode, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  AnimationGroup 
} from '@babylonjs/core';
import { loadGlb } from '@game/assets/loaders/gltf';
import { MODELS } from '@game/assets/manifest';
import type { RoleId } from '@game/content/areas';

export class Player {
  public mesh: TransformNode;
  private animations = new Map<string, AnimationGroup>();
  private currentAnimation: AnimationGroup | null = null;
  private modelLoaded = false;
  private scene: Scene;
  private roleId: RoleId;

  constructor(scene: Scene, position: Vector3, roleId: RoleId = 'boy') {
    this.scene = scene;
    this.roleId = roleId;
    
    // Create root transform immediately
    this.mesh = new TransformNode('player', scene);
    this.mesh.position = position;
    
    // Create placeholder capsule for instant visibility
    const placeholder = MeshBuilder.CreateCapsule(
      'player-placeholder',
      { height: 1.8, radius: 0.4, tessellation: 16 },
      scene
    );
    placeholder.position.y = 0.9; // Raise capsule so bottom sits on ground
    placeholder.parent = this.mesh;
    
    const mat = new StandardMaterial('playerPlaceholderMat', scene);
    // Role-specific colors: Boy = blue, Girl = pink
    if (roleId === 'girl') {
      mat.diffuseColor = new Color3(1.0, 0.4, 0.7); // Pink
    } else {
      mat.diffuseColor = new Color3(0.2, 0.5, 0.9); // Blue
    }
    mat.specularColor = new Color3(0.3, 0.3, 0.3);
    placeholder.material = mat;
    
    // Load role-specific model asynchronously
    void this.loadPlayerModel(placeholder, mat);
  }

  private async loadPlayerModel(placeholder: Mesh, placeholderMat: StandardMaterial): Promise<void> {
    try {
      // Check if scene is still valid
      if (this.scene.isDisposed) {
        console.warn('[Player] Scene disposed before model load');
        return;
      }
      
      // Get model key based on role
      const modelKey = this.roleId === 'girl' ? 'girl' : 'boy';
      const modelUrl = MODELS[modelKey];
      
      // If girl model doesn't exist yet, keep placeholder
      if (!modelUrl) {
        console.warn(`[Player] No model found for role '${this.roleId}', keeping placeholder`);
        return;
      }
      
      console.log(`[Player] Loading ${this.roleId} model:`, modelUrl);
      
      const result = await loadGlb(this.scene, modelUrl, {
        name: `${this.roleId}_${Date.now()}`,
        isPickable: false,
        receiveShadows: true,
      });
      
      // Check if scene/mesh still valid after async load
      if (this.scene.isDisposed || this.mesh.isDisposed()) {
        console.warn('[Player] Scene/mesh disposed during model load');
        result.root.dispose();
        return;
      }
      
      // Parent model to our root
      result.root.parent = this.mesh;
      
      // Offset model vertically so feet sit on ground (adjust based on model's pivot point)
      result.root.position.y = 0.45;
      
      // Set default scale and rotation
      result.root.scaling.set(1.0, 1.0, 1.0);
      result.root.rotation.y = 0;
      
      // Dispose placeholder
      placeholder.dispose();
      placeholderMat.dispose();
      
      // Setup animations
      this.setupAnimations(result.animationGroups);
      
      this.modelLoaded = true;
      console.log(`[Player] ${this.roleId} model loaded successfully`);
    } catch (error) {
      console.error(`[Player] Failed to load ${this.roleId} model:`, error);
      // Keep placeholder on error
    }
  }

  private setupAnimations(groups: AnimationGroup[]): void {
    console.log('[Player] Animation groups found:', groups.length);
    
    if (groups.length === 0) {
      console.warn(`[Player] ⚠️ No animations found in ${this.roleId}.glb`);
      console.warn('[Player] 💡 Tip: When exporting from Blender:');
      console.warn('[Player]   1. Select your armature + mesh');
      console.warn('[Player]   2. File > Export > glTF 2.0');
      console.warn('[Player]   3. Check "Include > Animations"');
      console.warn('[Player]   4. Set "Animation" to "Actions" or "NLA Tracks"');
      return;
    }
    
    for (const group of groups) {
      const name = group.name.toLowerCase();
      
      // Map animations based on name heuristics
      if (name.includes('idle') || name.includes('wait')) {
        this.animations.set('idle', group);
      } else if (name.includes('walk') || name.includes('run')) {
        this.animations.set('walk', group);
      } else if (name.includes('celebrate') || name.includes('jump') || name.includes('victory')) {
        this.animations.set('celebrate', group);
      }
    }
    
    const mappedAnims = Array.from(this.animations.keys());
    console.log('[Player] Mapped animations:', mappedAnims.join(', '));
    
    // Start with idle if available
    this.playAnimation('idle', true);
  }

  public playAnimation(name: string, loop: boolean): void {
    if (!this.modelLoaded) return;
    
    const anim = this.animations.get(name);
    if (!anim) return;
    
    // Stop current animation
    if (this.currentAnimation && this.currentAnimation !== anim) {
      this.currentAnimation.stop();
    }
    
    // Start new animation
    this.currentAnimation = anim;
    anim.loopAnimation = loop;
    anim.start();
  }

  public isMoving(speed: number): void {
    if (speed > 0.5) {
      this.playAnimation('walk', true);
    } else {
      this.playAnimation('idle', true);
    }
  }

  public celebrate(): void {
    const celebrateAnim = this.animations.get('celebrate');
    if (celebrateAnim) {
      celebrateAnim.loopAnimation = false;
      celebrateAnim.onAnimationGroupEndObservable.addOnce(() => {
        this.playAnimation('idle', true);
      });
      this.playAnimation('celebrate', false);
    }
  }

  dispose(): void {
    // Stop all animations
    this.animations.forEach(anim => anim.stop());
    this.animations.clear();
    
    // Dispose transform node (which disposes all children)
    this.mesh.dispose();
  }
}
