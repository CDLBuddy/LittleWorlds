/**
 * Pine World - Bounds Guard
 * 
 * Prevents player and companion from going out of bounds
 * Uses snap-back to last safe position when OOB detected
 */

import type { AbstractMesh } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';

export interface WorldBoundsGuardOptions {
  /** Terrain sampler (source of truth for bounds) */
  sampler: TerrainSamplerWithBounds;
  /** Safety margin in world units (default: 2) */
  margin?: number;
  /** Callback when out-of-bounds detected */
  onOob?: (entityName: string, current: Vector3, lastSafe: Vector3) => void;
}

export interface WorldBoundsGuard {
  /** Update guard for current frame */
  update(playerMesh: AbstractMesh, companionMesh?: AbstractMesh | null): void;
  /** Dispose guard */
  dispose(): void;
}

/**
 * Create a bounds guard for Pine world
 */
export function createWorldBoundsGuard(options: WorldBoundsGuardOptions): WorldBoundsGuard {
  const { sampler, margin = 2, onOob } = options;
  const bounds = sampler.bounds;

  // Log bounds once on init
  console.log(
    '[WorldBoundsGuard] Initialized with bounds:',
    `X[${bounds.min.x}, ${bounds.max.x}]`,
    `Z[${bounds.min.z}, ${bounds.max.z}]`,
    `margin=${margin}`
  );

  // Track last safe positions
  const lastSafePlayer = new Vector3();
  const lastSafeCompanion = new Vector3();
  let lastSafePlayerInitialized = false;
  let lastSafeCompanionInitialized = false;

  // Throttle OOB logging (max 1 per 2 seconds)
  let lastOobLogTime = 0;
  const OOB_LOG_THROTTLE_MS = 2000;

  function isInBounds(position: Vector3): boolean {
    return (
      position.x >= bounds.min.x - margin &&
      position.x <= bounds.max.x + margin &&
      position.z >= bounds.min.z - margin &&
      position.z <= bounds.max.z + margin
    );
  }

  function snapBack(mesh: AbstractMesh, lastSafe: Vector3, entityName: string): void {
    const now = Date.now();
    const shouldLog = now - lastOobLogTime > OOB_LOG_THROTTLE_MS;

    if (shouldLog) {
      lastOobLogTime = now;
      console.warn(
        `[WorldBoundsGuard] ${entityName} OOB:`,
        `current=(${mesh.position.x.toFixed(1)}, ${mesh.position.z.toFixed(1)})`,
        `lastSafe=(${lastSafe.x.toFixed(1)}, ${lastSafe.z.toFixed(1)})`
      );
    }

    // Snap back to last safe position
    mesh.position.copyFrom(lastSafe);

    // Zero velocity if physics body exists
    const physicsBody = mesh.physicsBody;
    if (physicsBody) {
      physicsBody.setLinearVelocity(Vector3.Zero());
      physicsBody.setAngularVelocity(Vector3.Zero());
    }

    // Call optional callback
    if (onOob) {
      onOob(entityName, mesh.position.clone(), lastSafe.clone());
    }
  }

  function update(playerMesh: AbstractMesh, companionMesh?: AbstractMesh | null): void {
    // Check player
    if (playerMesh) {
      if (!lastSafePlayerInitialized) {
        lastSafePlayer.copyFrom(playerMesh.position);
        lastSafePlayerInitialized = true;
      }

      if (isInBounds(playerMesh.position)) {
        lastSafePlayer.copyFrom(playerMesh.position);
      } else {
        snapBack(playerMesh, lastSafePlayer, 'Player');
      }
    }

    // Check companion
    if (companionMesh) {
      if (!lastSafeCompanionInitialized) {
        lastSafeCompanion.copyFrom(companionMesh.position);
        lastSafeCompanionInitialized = true;
      }

      if (isInBounds(companionMesh.position)) {
        lastSafeCompanion.copyFrom(companionMesh.position);
      } else {
        snapBack(companionMesh, lastSafeCompanion, 'Companion');
      }
    }
  }

  function dispose(): void {
    // Nothing to dispose currently
  }

  return {
    update,
    dispose,
  };
}
