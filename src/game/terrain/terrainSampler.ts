/**
 * Terrain Sampler - Safe height/normal queries with bounds checking
 * 
 * Creates a sampler that can query terrain height and normals at world XZ coordinates.
 * Includes bounds checking to prevent bogus queries outside the terrain area.
 */

import { GroundMesh, Vector3 } from '@babylonjs/core';

export interface TerrainSamplerWithBounds {
  /** Check if world XZ coordinates are within terrain bounds */
  inBounds: (x: number, z: number) => boolean;
  /** Get terrain height at world XZ coordinates (safe fallback if out of bounds) */
  heightAt: (x: number, z: number) => number;
  /** Get terrain normal at world XZ coordinates (safe fallback if out of bounds) */
  normalAt: (x: number, z: number) => Vector3;
  /** Terrain bounding box in world space */
  bounds: {
    min: Vector3;
    max: Vector3;
  };
}

/**
 * Create a sampler for a Babylon GroundMesh with bounds checking
 * 
 * IMPORTANT: Only call this after ground.onReadyObservable has fired!
 * Height queries before the ground is ready will return incorrect values.
 */
export function createGroundSampler(ground: GroundMesh): TerrainSamplerWithBounds {
  const bb = ground.getBoundingInfo().boundingBox;
  const min = bb.minimumWorld.clone();
  const max = bb.maximumWorld.clone();

  function inBounds(x: number, z: number): boolean {
    return x >= min.x && x <= max.x && z >= min.z && z <= max.z;
  }

  function heightAt(x: number, z: number): number {
    if (!inBounds(x, z)) {
      return ground.position.y; // Safe fallback for out-of-bounds queries
    }
    return ground.getHeightAtCoordinates(x, z);
  }

  function normalAt(x: number, z: number): Vector3 {
    const n = new Vector3(0, 1, 0);
    if (!inBounds(x, z)) {
      return n; // Safe fallback for out-of-bounds queries
    }
    
    // Use getNormalAtCoordinates which returns a Vector3
    const normal = ground.getNormalAtCoordinates(x, z);
    return normal ? normal.normalize() : n;
  }

  return {
    inBounds,
    heightAt,
    normalAt,
    bounds: { min, max },
  };
}
