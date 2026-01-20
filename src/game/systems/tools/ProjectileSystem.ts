/**
 * Projectile System - Manages projectile pool and firing
 * Phase v0.8.0 - Phase 6
 */

import type { Scene } from '@babylonjs/core';
import { Vector3, Color3, ParticleSystem, DynamicTexture, MeshBuilder, StandardMaterial, Mesh } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import { Projectile, type ProjectileHitResult } from './Projectile';
import type { ProjectileConfig } from '@game/content/tools';
import type { CameraRig } from '../camera/CameraRig';

type RoleId = 'boy' | 'girl';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

/**
 * Projectile System
 * Manages a pool of projectiles for performance
 */
export class ProjectileSystem {
  private projectilePool: Projectile[] = [];
  private activeProjectiles: Projectile[] = [];
  private poolSize = 20; // Max concurrent projectiles
  private eventBusSub: (() => void) | null = null;
  private cameraRig: CameraRig | null = null;
  private impactDecals: Mesh[] = [];
  private maxDecals = 30; // Max visible decals before cleanup

  constructor(
    private scene: Scene,
    private eventBus: EventBus
  ) {
    // Initialize projectile pool
    // Pool will be created on-demand as projectiles are fired
  }

  /**
   * Set camera rig for shake effects
   */
  setCameraRig(cameraRig: CameraRig): void {
    this.cameraRig = cameraRig;
  }

  /**
   * Fire a projectile
   */
  fireProjectile(
    origin: Vector3,
    direction: Vector3,
    config: ProjectileConfig,
    roleId: RoleId
  ): void {
    // Get or create projectile from pool
    const projectile = this.getProjectile(config, roleId);
    
    if (!projectile) {
      console.warn('[ProjectileSystem] Pool exhausted, cannot fire projectile');
      return;
    }

    // Fire it
    projectile.fire(origin, direction);
    this.activeProjectiles.push(projectile);

    if (import.meta.env.DEV) {
      console.log('[ProjectileSystem] Fired projectile, active:', this.activeProjectiles.length);
    }
  }

  /**
   * Update all active projectiles
   */
  update(deltaTime: number): void {
    // Update all active projectiles
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activeProjectiles[i];
      const stillActive = projectile.update(deltaTime);

      if (!stillActive) {
        // Remove from active list and return to pool
        this.activeProjectiles.splice(i, 1);
      }
    }
  }

  /**
   * Get projectile from pool (or create new one)
   */
  private getProjectile(config: ProjectileConfig, roleId: RoleId): Projectile | null {
    // Try to find inactive projectile in pool
    for (const projectile of this.projectilePool) {
      if (!projectile.isActive()) {
        return projectile;
      }
    }

    // Check if we can create more
    if (this.projectilePool.length >= this.poolSize) {
      return null; // Pool exhausted
    }

    // Create new projectile
    const projectile = new Projectile(
      this.scene,
      config,
      (hit) => this.handleProjectileHit(hit, roleId),
      () => this.handleProjectileExpire(roleId)
    );

    this.projectilePool.push(projectile);

    if (import.meta.env.DEV) {
      console.log('[ProjectileSystem] Created projectile, pool size:', this.projectilePool.length);
    }

    return projectile;
  }

  /**
   * Handle projectile hit
   */
  private handleProjectileHit(hit: ProjectileHitResult, roleId: RoleId): void {
    if (import.meta.env.DEV) {
      console.log('[ProjectileSystem] Projectile hit:', hit.mesh.name, 'target:', hit.targetId, 'velocity:', hit.velocity.toFixed(2));
    }

    // Detect surface type for appropriate effects
    const surfaceType = this.detectSurfaceType(hit.mesh);

    // Camera shake based on hit type and velocity
    const isTarget = !!hit.targetId;
    const velocityFactor = Math.min(hit.velocity / 20, 1); // Normalize to 0-1
    const shakeIntensity = isTarget ? 0.7 * velocityFactor : 0.3 * velocityFactor;
    if (this.cameraRig && shakeIntensity > 0.1) {
      this.cameraRig.shake(shakeIntensity, 0.15);
    }

    // Visual feedback: pulse the hit mesh (only for targets to avoid affecting instanced meshes)
    if (hit.targetId && hit.mesh.material) {
      const originalColor = (hit.mesh.material as any).emissiveColor?.clone();
      const flashColor = new Color3(1, 1, 0.5); // Yellow flash
      
      // Flash animation
      let elapsed = 0;
      const flashDuration = 0.3; // seconds
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        elapsed += this.scene.getEngine().getDeltaTime() / 1000;
        const t = Math.min(elapsed / flashDuration, 1);
        
        if ((hit.mesh.material as any).emissiveColor) {
          // Fade from flash back to original
          (hit.mesh.material as any).emissiveColor = Color3.Lerp(flashColor, originalColor || Color3.Black(), t);
        }
        
        if (t >= 1) {
          this.scene.onBeforeRenderObservable.remove(observer);
        }
      });
    }

    // Create impact particle effect (velocity-based)
    this.createImpactParticles(hit.position, hit.normal, surfaceType, hit.velocity);

    // Create impact decal
    this.createImpactDecal(hit.position, hit.normal, surfaceType, hit.velocity);

    // Placeholder: Impact sound (Phase 9)
    if (import.meta.env.DEV) {
      console.log(`[ProjectileSystem] AUDIO: Play ${surfaceType}_impact at`, hit.position);
    }
    // TODO: Uncomment when audio system is available
    // this.audioSystem?.playSpatialSfx(`${surfaceType}_impact`, hit.position);

    // Emit hit event if it's a valid target
    if (hit.targetId) {
      this.eventBus.emit({
        type: 'game/targetHit' as any,
        targetId: hit.targetId,
        position: { x: hit.position.x, y: hit.position.y, z: hit.position.z },
        roleId,
      });
    }
  }

  /**
   * Handle projectile expire
   */
  private handleProjectileExpire(_roleId: RoleId): void {
    // Projectile timed out without hitting anything
    if (import.meta.env.DEV) {
      console.log('[ProjectileSystem] Projectile expired');
    }
  }

  /**
   * Detect surface type from mesh name or metadata
   */
  private detectSurfaceType(mesh: any): 'metal' | 'wood' | 'ground' | 'stone' {
    const name = mesh.name.toLowerCase();
    const metadata = mesh.metadata;

    // Check metadata first
    if (metadata?.surfaceType) {
      return metadata.surfaceType;
    }

    // Check name patterns
    if (name.includes('target') || name.includes('metal') || name.includes('steel')) {
      return 'metal';
    }
    if (name.includes('wood') || name.includes('tree') || name.includes('log')) {
      return 'wood';
    }
    if (name.includes('ground') || name.includes('terrain') || name.includes('grass')) {
      return 'ground';
    }
    if (name.includes('stone') || name.includes('rock')) {
      return 'stone';
    }

    // Default to ground
    return 'ground';
  }

  /**
   * Create impact particle effect
   */
  private createImpactParticles(
    position: Vector3,
    normal: Vector3,
    surfaceType: 'metal' | 'wood' | 'ground' | 'stone',
    velocity: number
  ): void {
    // Scale particle count and power based on velocity
    const velocityFactor = Math.min(velocity / 20, 1.5); // Normalize, allow up to 1.5x
    const particleCount = Math.floor(20 * velocityFactor);
    const emitPowerMin = 2 * velocityFactor;
    const emitPowerMax = 4 * velocityFactor;
    
    // Create particle system
    const particles = new ParticleSystem('impactParticles', particleCount, this.scene);

    // Create a simple white circle texture for particles
    const particleTexture = new DynamicTexture('particleTexture', 64, this.scene, false);
    const context = particleTexture.getContext();
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(32, 32, 28, 0, 2 * Math.PI);
    context.fill();
    particleTexture.update();
    particles.particleTexture = particleTexture;

    // Particle colors based on surface type
    let color1: Color3;
    let color2: Color3;
    switch (surfaceType) {
      case 'metal':
        color1 = new Color3(1, 0.8, 0.3); // Orange sparks
        color2 = new Color3(1, 0.5, 0.1);
        break;
      case 'wood':
        color1 = new Color3(0.6, 0.4, 0.2); // Brown wood chips
        color2 = new Color3(0.4, 0.3, 0.1);
        break;
      case 'stone':
        color1 = new Color3(0.6, 0.6, 0.6); // Gray dust
        color2 = new Color3(0.4, 0.4, 0.4);
        break;
      case 'ground':
      default:
        color1 = new Color3(0.5, 0.4, 0.3); // Dirt/dust
        color2 = new Color3(0.3, 0.25, 0.2);
        break;
    }

    particles.color1 = color1.toColor4(1);
    particles.color2 = color2.toColor4(1);
    particles.colorDead = color2.toColor4(0);

    // Emission
    particles.emitter = position;
    particles.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
    particles.maxEmitBox = new Vector3(0.05, 0.05, 0.05);

    // Direction based on surface normal
    particles.direction1 = normal.scale(0.5).add(new Vector3(-0.5, 0, -0.5));
    particles.direction2 = normal.scale(0.5).add(new Vector3(0.5, 0.5, 0.5));

    // Particle properties
    particles.minSize = 0.05;
    particles.maxSize = 0.15;
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.5;
    particles.emitRate = 100;
    particles.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    particles.gravity = new Vector3(0, -9.8, 0);
    particles.minEmitPower = emitPowerMin;
    particles.maxEmitPower = emitPowerMax;
    particles.updateSpeed = 0.02;

    // Start and dispose after burst
    particles.start();
    setTimeout(() => {
      particles.stop();
      setTimeout(() => particles.dispose(), 1000);
    }, 100);
  }

  /**
   * Create impact decal (scorch mark, dent, etc.)
   */
  private createImpactDecal(
    position: Vector3,
    normal: Vector3,
    surfaceType: 'metal' | 'wood' | 'ground' | 'stone',
    velocity: number
  ): void {
    // Scale decal size based on velocity
    const velocityFactor = Math.min(velocity / 20, 1);
    const size = 0.15 + (0.15 * velocityFactor); // 0.15-0.3 units

    // Create simple plane decal
    const decal = MeshBuilder.CreatePlane('impactDecal', { size }, this.scene);
    
    // Position and orient to surface
    decal.position.copyFrom(position);
    decal.position.addInPlace(normal.scale(0.01)); // Slightly above surface to avoid z-fighting
    
    // Orient to surface normal using lookAt
    decal.lookAt(position.add(normal));
    
    // Random rotation around normal
    decal.rotate(normal, Math.random() * Math.PI * 2);

    // Create decal material
    const material = new StandardMaterial('decalMat', this.scene);
    
    // Color based on surface type
    let decalColor: Color3;
    switch (surfaceType) {
      case 'metal':
        decalColor = new Color3(0.15, 0.15, 0.15); // Dark scorch
        break;
      case 'wood':
        decalColor = new Color3(0.25, 0.2, 0.15); // Wood dent
        break;
      case 'stone':
        decalColor = new Color3(0.3, 0.3, 0.3); // Stone chip
        break;
      case 'ground':
      default:
        decalColor = new Color3(0.2, 0.15, 0.1); // Dirt crater
        break;
    }
    
    material.diffuseColor = decalColor;
    material.alpha = 0.6;
    material.specularColor = Color3.Black();
    decal.material = material;
    
    // Track decal for cleanup
    this.impactDecals.push(decal);
    
    // Cleanup old decals if limit exceeded
    if (this.impactDecals.length > this.maxDecals) {
      const oldDecal = this.impactDecals.shift();
      if (oldDecal) {
        oldDecal.dispose();
      }
    }
    
    // Fade out and dispose after lifetime
    const lifetime = 15; // seconds
    let elapsed = 0;
    const fadeObserver = this.scene.onBeforeRenderObservable.add(() => {
      elapsed += this.scene.getEngine().getDeltaTime() / 1000;
      const t = elapsed / lifetime;
      
      if (material) {
        material.alpha = 0.6 * (1 - t);
      }
      
      if (t >= 1) {
        this.scene.onBeforeRenderObservable.remove(fadeObserver);
        const index = this.impactDecals.indexOf(decal);
        if (index !== -1) {
          this.impactDecals.splice(index, 1);
        }
        decal.dispose();
      }
    });
  }

  /**
   * Clear all projectiles for a specific role
   */
  clearProjectiles(_roleId: RoleId): void {
    // Deactivate all active projectiles
    // In a more complex system, we'd track which role owns which projectile
    // For now, just clear all
    this.activeProjectiles = [];

    if (import.meta.env.DEV) {
      console.log('[ProjectileSystem] Cleared projectiles');
    }
  }

  /**
   * Get count of active projectiles
   */
  getActiveCount(): number {
    return this.activeProjectiles.length;
  }

  /**
   * Dispose all projectiles
   */
  dispose(): void {
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }

    // Dispose all projectiles in pool
    for (const projectile of this.projectilePool) {
      projectile.dispose();
    }

    this.projectilePool = [];
    this.activeProjectiles = [];
  }
}
