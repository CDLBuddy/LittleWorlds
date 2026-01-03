/**
 * Pine World - Terrain elevation helpers
 */

import { Vector3 } from '@babylonjs/core';
import { PINE_TERRAIN } from '../config/constants';

export function getElevationAtZ(z: number): number {
  // z=-80 => top of hill => 12
  // z=+80 => bottom => 0
  const t = (z + PINE_TERRAIN.halfDepth) / PINE_TERRAIN.depth; // 0..1
  const clamped = Math.min(1, Math.max(0, t));
  return PINE_TERRAIN.maxRise * (1 - clamped);
}

export function atTerrain(x: number, z: number, yOffset = 0): Vector3 {
  return new Vector3(x, getElevationAtZ(z) + yOffset, z);
}

// Legacy helper for existing code
export function heightAtXZ(x: number, z: number): number {
  void x;
  return getElevationAtZ(z);
}
