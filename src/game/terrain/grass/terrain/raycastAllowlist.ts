/**
 * Raycast-based terrain sampling for grass placement
 * Provides allowlist-based ground detection to avoid water/void
 */

import { Scene, Ray, Vector3 } from '@babylonjs/core';
import type { GrassTerrainConform } from '../types';

// Reusable vectors to avoid allocations in tight loops
const tempRayOrigin = new Vector3();
const tempRayDir = Vector3.Down();

/**
 * Sample terrain height and normal via raycast against allowed meshes
 * Returns null if no valid ground hit (eliminates water/void placement)
 * 
 * @param scene - Babylon scene for raycasting
 * @param x - World X coordinate
 * @param z - World Z coordinate
 * @param cfg - Raycast configuration with ground mesh allowlist
 * @returns Hit data with y position and normal, or null if no valid ground
 */
export function sampleRaycastAllowlist(
  scene: Scene,
  x: number,
  z: number,
  cfg: Extract<GrassTerrainConform, { mode: 'raycastAllowlist' }>
): { y: number; normal: Vector3 } | null {
  const rayStartY = cfg.rayStartY ?? 50;
  const rayLength = cfg.rayLength ?? 200;

  // Set up ray from above, pointing down
  tempRayOrigin.set(x, rayStartY, z);
  const ray = new Ray(tempRayOrigin, tempRayDir, rayLength);

  // Raycast with predicate to check against allowlist
  const hit = scene.pickWithRay(
    ray,
    (mesh) => {
      return cfg.groundMeshes.some((allowedMesh) => allowedMesh === mesh);
    }
  );

  // If no hit or hit object not in allowlist, reject this position
  if (!hit || !hit.hit || !hit.pickedPoint) {
    return null;
  }

  // Calculate final Y position with offset
  const y = hit.pickedPoint.y + (cfg.yOffset ?? 0);

  // Get normal from hit (fallback to Up if missing)
  const normal = hit.getNormal(true, false) ?? Vector3.Up();

  return { y, normal };
}
