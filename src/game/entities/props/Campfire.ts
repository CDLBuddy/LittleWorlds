/**
 * Campfire interactable with particles + flickering light
 */

import { 
  Scene, 
  Vector3, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  AbstractMesh,
  ParticleSystem,
  Texture,
  Color4,
  PointLight,
} from '@babylonjs/core';

export class Campfire {
  id: string;
  mesh: AbstractMesh;
  private onInteractCallback: (() => void) | null = null;
  private isLit = false;
  private particleSystem: ParticleSystem | null = null;
  private light: PointLight | null = null;
  private flickerTime = 0;
  private scene: Scene;

  constructor(scene: Scene, position: Vector3, id: string) {
    this.id = id;
    this.scene = scene;
    
    // Reuse existing campfire mesh or create new one
    const existing = scene.getMeshByName(id);
    if (existing) {
      this.mesh = existing;
      this.mesh.position = position.clone();
    } else {
      this.mesh = MeshBuilder.CreateCylinder(
        id, // Use id as mesh name
        { height: 0.5, diameter: 1.2 },
        scene
      );
      this.mesh.position = position.clone();
      this.mesh.position.y = 0.25;
      
      const mat = new StandardMaterial('campfireMat', scene);
      mat.diffuseColor = new Color3(0.8, 0.3, 0.1);
      mat.emissiveColor = new Color3(0.4, 0.15, 0.05);
      this.mesh.material = mat;
    }
  }

  onInteract(callback: () => void): void {
    this.onInteractCallback = callback;
  }

  interact(): void {
    if (!this.isLit) {
      this.isLit = true;
      
      // Brighten emissive when lit
      const mat = this.mesh.material as StandardMaterial;
      if (mat) {
        mat.emissiveColor = new Color3(1.0, 0.4, 0.1);
      }
      
      // Start fire VFX
      this.startFireVFX();
    }
    this.onInteractCallback?.();
  }
  
  private startFireVFX(): void {
    // Create particle system for fire
    this.particleSystem = new ParticleSystem('campfireParticles', 250, this.scene);
    
    // Create a basic texture (can be replaced with actual fire texture)
    try {
      this.particleSystem.particleTexture = new Texture('', this.scene);
    } catch {
      // Fallback if no texture available
    }
    
    // Position above campfire
    this.particleSystem.emitter = this.mesh.position.add(new Vector3(0, 0.5, 0));
    
    // Emission
    this.particleSystem.minEmitBox = new Vector3(-0.3, 0, -0.3);
    this.particleSystem.maxEmitBox = new Vector3(0.3, 0, 0.3);
    this.particleSystem.emitRate = 50;
    
    // Particle appearance
    this.particleSystem.minSize = 0.1;
    this.particleSystem.maxSize = 0.3;
    this.particleSystem.minLifeTime = 0.5;
    this.particleSystem.maxLifeTime = 1.2;
    
    // Colors - fire gradient (orange → yellow → fade)
    this.particleSystem.color1 = new Color4(1.0, 0.4, 0.1, 1.0); // Orange
    this.particleSystem.color2 = new Color4(1.0, 0.7, 0.2, 1.0); // Yellow-orange
    this.particleSystem.colorDead = new Color4(0.5, 0.1, 0.0, 0.0); // Fade to dark red
    
    // Movement - upward drift with slight randomness
    this.particleSystem.direction1 = new Vector3(-0.3, 1.5, -0.3);
    this.particleSystem.direction2 = new Vector3(0.3, 2.5, 0.3);
    this.particleSystem.minEmitPower = 0.5;
    this.particleSystem.maxEmitPower = 1.0;
    this.particleSystem.gravity = new Vector3(0, -0.5, 0);
    
    // Start particles
    this.particleSystem.start();
    
    // Create flickering point light
    this.light = new PointLight(
      'campfireLight',
      this.mesh.position.add(new Vector3(0, 1, 0)),
      this.scene
    );
    this.light.diffuse = new Color3(1.0, 0.5, 0.1); // Orange glow
    this.light.specular = new Color3(1.0, 0.6, 0.2);
    this.light.intensity = 2.0;
    this.light.range = 10;
    
    console.log('[Campfire] Fire VFX started');
  }
  
  update(dt: number): void {
    if (!this.isLit || !this.light) return;
    
    this.flickerTime += dt;
    
    // Flicker intensity with sin + noise
    const flicker = Math.sin(this.flickerTime * 10) * 0.1 + Math.sin(this.flickerTime * 23) * 0.05;
    const noise = (Math.random() - 0.5) * 0.1;
    this.light.intensity = 2.0 + flicker + noise;
  }

  dispose(): void {
    // Stop and dispose particles
    if (this.particleSystem) {
      this.particleSystem.stop();
      this.particleSystem.dispose();
      this.particleSystem = null;
    }
    
    // Dispose light
    if (this.light) {
      this.light.dispose();
      this.light = null;
    }
    
    // Don't dispose mesh if it's a shared one
  }
}
