/**
 * FX System - particles, sparkles, fireflies
 */

import { Scene, ParticleSystem, Vector3, Color4, Texture } from '@babylonjs/core';

export class FxSystem {
  private activeFx = new Map<string, ParticleSystem>();

  constructor(private scene: Scene) {
  }

  spawnConfetti(position: Vector3): string {
    const id = `confetti_${Date.now()}`;
    
    // Create particle system
    const particleSystem = new ParticleSystem('confetti', 250, this.scene);
    
    // Emitter position
    particleSystem.emitter = position.clone();
    particleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
    particleSystem.maxEmitBox = new Vector3(0.5, 0, 0.5);
    
    // Particle appearance (use simple colored quads)
    particleSystem.particleTexture = new Texture('', this.scene); // Empty texture for colored squares
    particleSystem.minSize = 0.15;
    particleSystem.maxSize = 0.3;
    
    // Colors - rainbow confetti
    particleSystem.color1 = new Color4(1, 0.2, 0.2, 1.0); // Red
    particleSystem.color2 = new Color4(0.2, 0.8, 1, 1.0); // Blue
    particleSystem.colorDead = new Color4(1, 1, 0.2, 0.0); // Yellow fade out
    
    // Lifetime
    particleSystem.minLifeTime = 0.7;
    particleSystem.maxLifeTime = 1.3;
    particleSystem.emitRate = 1000; // Burst
    
    // Velocity - burst upward and outward
    particleSystem.direction1 = new Vector3(-1, 2, -1);
    particleSystem.direction2 = new Vector3(1, 4, 1);
    particleSystem.minEmitPower = 4;
    particleSystem.maxEmitPower = 8;
    
    // Gravity
    particleSystem.gravity = new Vector3(0, -9.8, 0);
    
    // Animation
    particleSystem.minAngularSpeed = -2;
    particleSystem.maxAngularSpeed = 2;
    
    // Start and auto-dispose after burst\n    particleSystem.targetStopDuration = 0.2; // Stop emitting after 0.2s
    particleSystem.disposeOnStop = true;
    particleSystem.start();
    
    this.activeFx.set(id, particleSystem);
    
    // Clean up reference after particles die
    setTimeout(() => {
      this.activeFx.delete(id);
    }, 2000);
    
    return id;
  }

  createSparkles(position: Vector3, duration = 2): string {
    const id = `sparkles_${Date.now()}`;
    // TODO: Create particle system
    console.log(`Creating sparkles at ${position.toString()}`);
    
    setTimeout(() => {
      this.stopFx(id);
    }, duration * 1000);
    
    return id;
  }

  createFireflies(position: Vector3, count = 10): string {
    const id = `fireflies_${Date.now()}`;
    // TODO: Create firefly particle system
    console.log(`Creating ${count} fireflies at ${position.toString()}`);
    return id;
  }

  stopFx(id: string): void {
    const fx = this.activeFx.get(id);
    if (fx) {
      fx.stop();
      this.activeFx.delete(id);
    }
  }

  dispose(): void {
    this.activeFx.forEach((fx) => fx.dispose());
    this.activeFx.clear();
  }
}
