/**
 * Pine World - Placement utilities for sampler-based prop positioning
 * 
 * Provides slope checking and safe placement helpers for scatter systems.
 * All placement logic uses the terrain sampler as the single source of truth.
 */

import { Vector3 } from '@babylonjs/core';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';

/**
 * Check if a slope is suitable for placement based on terrain normal
 * 
 * @param normalY - The Y component of the terrain normal at the position
 * @param minNormalY - Minimum acceptable normal.y (default 0.75 = ~41° max slope)
 * @returns true if slope is acceptable for placement
 * 
 * @example
 * const normal = sampler.normalAt(x, z);
 * if (isSlopeOk(normal.y)) {
 *   // Place prop here
 * }
 */
export function isSlopeOk(normalY: number, minNormalY = 0.75): boolean {
  return normalY >= minNormalY;
}

/**
 * Attempt to place a prop at (x, z) with slope and bounds checking
 * 
 * Returns a position Vector3 if placement is valid, null otherwise.
 * Combines bounds checking and slope validation in one call.
 * 
 * @param sampler - Terrain sampler with bounds and normal data
 * @param x - X coordinate
 * @param z - Z coordinate
 * @param yOffset - Vertical offset to apply to the height (default 0)
 * @param minNormalY - Minimum acceptable slope normal.y (default 0.75)
 * @returns Vector3 position if valid, null if OOB or too steep
 * 
 * @example
 * const pos = placeAtSampler(sampler, x, z, 0.5);
 * if (pos) {
 *   rock.position.copyFrom(pos);
 * }
 */
export function placeAtSampler(
  sampler: TerrainSamplerWithBounds,
  x: number,
  z: number,
  yOffset = 0,
  minNormalY = 0.75
): Vector3 | null {
  // Bounds check
  if (!sampler.inBounds(x, z)) {
    return null;
  }

  // Slope check
  const normal = sampler.normalAt(x, z);
  if (!isSlopeOk(normal.y, minNormalY)) {
    return null;
  }

  // Get height and apply offset
  const y = sampler.heightAt(x, z);
  return new Vector3(x, y + yOffset, z);
}
