/**
 * Particle utilities
 */

import { ParticleSystem, Texture, Color4, Vector3, Scene } from '@babylonjs/core';

export function createBasicParticles(
  scene: Scene,
  emitter: Vector3,
  capacity = 100
): ParticleSystem {
  const particles = new ParticleSystem('particles', capacity, scene);
  
  particles.particleTexture = new Texture('textures/particle.png', scene);
  particles.emitter = emitter;
  
  particles.minSize = 0.1;
  particles.maxSize = 0.3;
  particles.minLifeTime = 0.5;
  particles.maxLifeTime = 1.5;
  particles.emitRate = 50;
  
  particles.blendMode = ParticleSystem.BLENDMODE_ADD;
  particles.color1 = new Color4(1, 1, 0.8, 1);
  particles.color2 = new Color4(1, 0.8, 0.2, 1);
  particles.colorDead = new Color4(0.5, 0.3, 0, 0);
  
  return particles;
}
