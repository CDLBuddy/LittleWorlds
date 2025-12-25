/**
 * FX System - particles, sparkles, fireflies
 */

import { Scene, ParticleSystem, Vector3 } from '@babylonjs/core';

export class FxSystem {
  private activeFx = new Map<string, ParticleSystem>();

  constructor(_scene: Scene) {
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
