/**
 * Terrain Snapping Utilities
 * 
 * Snap meshes to terrain height using their bounding box base (not pivot point).
 * This ensures objects sit properly on sloped terrain.
 */

import type { AbstractMesh } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core';

/**
 * Snap mesh to terrain by its bounding box bottom
 * 
 * This is more accurate than using pivot/position because it accounts
 * for meshes whose origin is not at their base.
 * 
 * @param mesh - The mesh to snap
 * @param heightAt - Function to query terrain height at (x, z)
 * @param lift - Additional lift above terrain (default 0)
 */
export function snapMeshBaseToGround(
  mesh: AbstractMesh,
  heightAt: (x: number, z: number) => number,
  lift = 0
): void {
  // Ensure world matrix is up to date
  mesh.computeWorldMatrix(true);
  
  // Get mesh position in world space
  const worldPos = mesh.getAbsolutePosition();
  const x = worldPos.x;
  const z = worldPos.z;

  // Query terrain height at this XZ position
  const targetY = heightAt(x, z) + lift;

  // Get the actual bottom of the mesh's bounding box
  const bb = mesh.getBoundingInfo().boundingBox;
  const bottomY = bb.minimumWorld.y;

  // Move mesh so its bottom sits exactly on targetY
  const delta = targetY - bottomY;
  mesh.position.y += delta;
}

/**
 * Project a path of points onto terrain
 * 
 * Used for trails, ribbons, or any geometry that needs to follow terrain contours.
 * 
 * @param points - Original path points
 * @param heightAt - Function to query terrain height at (x, z)
 * @param lift - Small lift to prevent z-fighting (default 0.02)
 */
export function projectPathToGround(
  points: Vector3[],
  heightAt: (x: number, z: number) => number,
  lift = 0.02
): Vector3[] {
  return points.map(p => {
    const terrainY = heightAt(p.x, p.z);
    return new Vector3(p.x, terrainY + lift, p.z);
  });
}
