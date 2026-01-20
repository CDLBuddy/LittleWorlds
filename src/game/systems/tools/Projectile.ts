/**
 * Projectile class - Individual projectile with physics
 * Phase v0.8.0 - Phase 6
 */

import type { Scene, AbstractMesh } from '@babylonjs/core';
import { MeshBuilder, StandardMaterial, Color3, Vector3, Ray, TrailMesh } from '@babylonjs/core';
import type { ProjectileConfig } from '@game/content/tools';

export interface ProjectileHitResult {
  mesh: AbstractMesh;
  position: Vector3;
  normal: Vector3;
  targetId?: string;
  velocity: number; // Speed at impact
}

/**
 * Projectile - Physics-driven projectile (steel ball, arrow, etc.)
 */
export class Projectile {
  private mesh: AbstractMesh;
  private trail: TrailMesh | null = null;
  private velocity: Vector3;
  private lastPosition: Vector3;
  private lifetime: number;
  private maxLifetime: number;
  private active = false;
  private useGravity: boolean;
  private gravityForce = 9.8; // m/s²

  constructor(
    private scene: Scene,
    private config: ProjectileConfig,
    private onHit?: (hit: ProjectileHitResult) => void,
    private onExpire?: () => void
  ) {
    // Create projectile mesh (sphere for steel ball)
    this.mesh = MeshBuilder.CreateSphere('projectile', {
      diameter: 0.15, // Small steel ball
      segments: 8,
    }, scene);

    // Create material
    const material = new StandardMaterial('projectileMat', scene);
    material.diffuseColor = new Color3(0.6, 0.6, 0.7); // Metallic gray
    material.specularColor = new Color3(0.8, 0.8, 0.9);
    material.specularPower = 64;
    material.emissiveColor = new Color3(0.3, 0.3, 0.4); // Subtle glow
    this.mesh.material = material;

    // Not pickable (shouldn't interfere with raycasts)
    this.mesh.isPickable = false;

    // Create trail mesh for motion streak
    this.trail = new TrailMesh('projectileTrail', this.mesh, scene, 0.05, 15, true);
    const trailMaterial = new StandardMaterial('trailMat', scene);
    trailMaterial.emissiveColor = new Color3(0.5, 0.5, 0.6);
    trailMaterial.alpha = 0.5;
    this.trail.material = trailMaterial;

    // Start inactive
    this.mesh.setEnabled(false);
    if (this.trail) this.trail.start();

    this.velocity = Vector3.Zero();
    this.lastPosition = Vector3.Zero();
    this.lifetime = 0;
    this.maxLifetime = config.lifetime;
    this.useGravity = config.useGravity;
  }

  /**
   * Fire projectile from position in direction
   */
  fire(position: Vector3, direction: Vector3): void {
    this.mesh.position.copyFrom(position);
    this.lastPosition.copyFrom(position);
    this.velocity = direction.normalize().scale(this.config.speed);
    this.lifetime = 0;
    this.active = true;
    this.mesh.setEnabled(true);

    if (import.meta.env.DEV) {
      console.log('[Projectile] Fired:', {
        position: position.toString(),
        direction: direction.toString(),
        speed: this.config.speed,
        velocity: this.velocity.toString(),
        meshEnabled: this.mesh.isEnabled(),
        meshVisible: this.mesh.isVisible,
        meshPosition: this.mesh.position.toString()
      });
    }
  }

  /**
   * Update projectile physics and check for hits
   */
  update(deltaTime: number): boolean {
    if (!this.active) {
      return false;
    }

    // Update lifetime
    this.lifetime += deltaTime;
    if (this.lifetime >= this.maxLifetime) {
      this.expire();
      return false;
    }

    // Store last position for raycast
    this.lastPosition.copyFrom(this.mesh.position);

    // Apply gravity
    if (this.useGravity) {
      this.velocity.y -= this.gravityForce * deltaTime;
    }

    // Update position
    const delta = this.velocity.scale(deltaTime);
    this.mesh.position.addInPlace(delta);

    // Check for collision via raycast
    const hit = this.checkCollision();
    if (hit) {
      this.handleHit(hit);
      return false;
    }

    return true; // Still active
  }

  /**
   * Check for collision using raycast
   */
  private checkCollision(): ProjectileHitResult | null {
    // Cast ray from last position to current position
    const direction = this.mesh.position.subtract(this.lastPosition);
    const distance = direction.length();
    
    if (distance < 0.001) {
      return null; // Too small to check
    }

    const ray = new Ray(this.lastPosition, direction.normalize(), distance);
    
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      // Ignore self and other projectiles
      return mesh.isPickable && mesh !== this.mesh && !mesh.name.startsWith('projectile');
    });

    if (hit && hit.hit && hit.pickedMesh && hit.pickedPoint && hit.getNormal) {
      const normal = hit.getNormal(true);
      
      // Check if hit mesh or parent has target metadata
      let targetId: string | undefined;
      if (hit.pickedMesh.metadata?.isTarget && hit.pickedMesh.metadata?.targetId) {
        targetId = hit.pickedMesh.metadata.targetId;
      } else if (hit.pickedMesh.parent && (hit.pickedMesh.parent as any).metadata?.isTarget) {
        targetId = (hit.pickedMesh.parent as any).metadata?.targetId;
      }
      
      return {
        mesh: hit.pickedMesh,
        position: hit.pickedPoint,
        normal: normal || Vector3.Up(),
        targetId,
        velocity: this.velocity.length(),
      };
    }

    return null;
  }

  /**
   * Handle hit with surface/target
   */
  private handleHit(hit: ProjectileHitResult): void {
    if (import.meta.env.DEV) {
      console.log('[Projectile] Hit:', hit.mesh.name, 'targetId:', hit.targetId);
    }

    // Call hit callback
    this.onHit?.(hit);

    // Deactivate projectile
    this.deactivate();
  }

  /**
   * Expire projectile (reached max lifetime)
   */
  private expire(): void {
    if (import.meta.env.DEV) {
      console.log('[Projectile] Expired after', this.lifetime, 'seconds');
    }

    this.onExpire?.();
    this.deactivate();
  }

  /**
   * Deactivate projectile (return to pool)
   */
  private deactivate(): void {
    this.active = false;
    this.mesh.setEnabled(false);
    this.velocity.set(0, 0, 0);
  }

  /**
   * Check if projectile is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get projectile position
   */
  getPosition(): Vector3 {
    return this.mesh.position.clone();
  }

  /**
   * Dispose projectile (cleanup)
   */
  dispose(): void {
    if (this.trail) {
      this.trail.dispose();
      if (this.trail.material) {
        this.trail.material.dispose();
      }
      this.trail = null;
    }
    this.mesh.dispose();
    if (this.mesh.material) {
      this.mesh.material.dispose();
    }
  }
}
