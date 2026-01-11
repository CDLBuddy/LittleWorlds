/**
 * Pine Forest - Tree grounding utilities
 * 
 * Phase 9: Footprint-based sampling to prevent floating trees on slopes.
 * Instead of single-point sampling, we check multiple points around the tree base
 * to detect uneven terrain and relocate or skip trees that would look wrong.
 */

import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import {
  TREE_FOOTPRINT_RADIUS,
  TREE_MAX_SLOPE_DELTA,
  TREE_MIN_NORMAL_Y,
  TREE_RELOCATE_ATTEMPTS,
  TREE_RELOCATE_RADIUS,
  TREE_SINK_EPS,
} from './constants';

/**
 * Result of sampling a tree footprint
 */
export interface FootprintSample {
  /** Center height */
  centerY: number;
  /** Minimum height across footprint */
  minY: number;
  /** Maximum height across footprint */
  maxY: number;
  /** Height difference (maxY - minY) */
  deltaY: number;
  /** Terrain normal Y component at center */
  normalY: number;
  /** Whether all sample points were in bounds */
  valid: boolean;
}

/**
 * Sample terrain at tree footprint (center + N/E/S/W cardinal points)
 * 
 * This checks for unevenness/slopes by comparing heights at multiple points
 * around where the tree trunk will sit.
 * 
 * @param sampler - Terrain sampler with bounds and height queries
 * @param x - Center X coordinate
 * @param z - Center Z coordinate
 * @param radius - Footprint radius to sample
 * @returns Footprint sample data with validity flag
 */
export function sampleFootprint(
  sampler: TerrainSamplerWithBounds,
  x: number,
  z: number,
  radius: number
): FootprintSample {
  // Check center + 4 cardinal directions
  const points = [
    { x, z },                    // Center
    { x, z: z - radius },        // North
    { x: x + radius, z },        // East
    { x, z: z + radius },        // South
    { x: x - radius, z },        // West
  ];

  // Check if all points are in bounds
  let valid = true;
  const heights: number[] = [];

  for (const pt of points) {
    if (!sampler.inBounds(pt.x, pt.z)) {
      valid = false;
      break;
    }
    heights.push(sampler.heightAt(pt.x, pt.z));
  }

  if (!valid) {
    // Return invalid sample
    return {
      centerY: 0,
      minY: 0,
      maxY: 0,
      deltaY: 0,
      normalY: 0,
      valid: false,
    };
  }

  // Compute statistics
  const centerY = heights[0];
  const minY = Math.min(...heights);
  const maxY = Math.max(...heights);
  const deltaY = maxY - minY;

  // Get terrain normal at center
  const normal = sampler.normalAt(x, z);
  const normalY = normal.y;

  return {
    centerY,
    minY,
    maxY,
    deltaY,
    normalY,
    valid: true,
  };
}

/**
 * Result of attempting to find a grounded placement for a tree
 */
export interface GroundedPlacement {
  /** Final X coordinate */
  x: number;
  /** Final Z coordinate */
  z: number;
  /** Base Y coordinate (before foot offset applied) */
  yBase: number;
  /** Placement reason */
  reason: 'ok' | 'relocated';
}

/**
 * Parameters for finding grounded placement
 */
export interface FindGroundedPlacementParams {
  /** Terrain sampler */
  sampler: TerrainSamplerWithBounds;
  /** Desired X coordinate */
  x: number;
  /** Desired Z coordinate */
  z: number;
  /** Tree scale (affects footprint radius) */
  scale: number;
  /** Seeded random number generator (0-1) */
  rand: () => number;
}

/**
 * Find a valid grounded placement for a tree, relocating if needed
 * 
 * Algorithm:
 * 1. Sample footprint at desired position
 * 2. If too steep/uneven, try relocation attempts
 * 3. Return first valid position or null if all fail
 * 
 * Grounding strategy:
 * - Use maxY from footprint (highest point under tree)
 * - Sink by TREE_SINK_EPS to hide micro-floating
 * - Better to slightly embed on uphill side than float on downhill side
 * 
 * @returns Grounded placement or null if no valid position found
 */
export function findGroundedPlacement(
  params: FindGroundedPlacementParams
): GroundedPlacement | null {
  const { sampler, x, z, scale, rand } = params;

  // Compute actual footprint radius based on tree scale
  const radius = TREE_FOOTPRINT_RADIUS * scale;

  // Check if placement passes all criteria
  const checkPlacement = (testX: number, testZ: number): FootprintSample | null => {
    const sample = sampleFootprint(sampler, testX, testZ, radius);

    if (!sample.valid) {
      return null; // Out of bounds
    }

    // Check slope via normal
    if (sample.normalY < TREE_MIN_NORMAL_Y) {
      return null; // Too steep
    }

    // Check footprint delta
    if (sample.deltaY > TREE_MAX_SLOPE_DELTA) {
      return null; // Too uneven
    }

    return sample;
  };

  // Try original position first
  const originalSample = checkPlacement(x, z);
  if (originalSample) {
    // Original position is good!
    // Use maxY to prevent floating on any part of footprint
    const yBase = originalSample.maxY - TREE_SINK_EPS;
    return { x, z, yBase, reason: 'ok' };
  }

  // Original position failed, try relocation
  for (let attempt = 0; attempt < TREE_RELOCATE_ATTEMPTS; attempt++) {
    // Jitter within relocation radius
    const angle = rand() * Math.PI * 2;
    const dist = rand() * TREE_RELOCATE_RADIUS;
    const jitterX = x + Math.cos(angle) * dist;
    const jitterZ = z + Math.sin(angle) * dist;

    const jitterSample = checkPlacement(jitterX, jitterZ);
    if (jitterSample) {
      // Found valid relocated position!
      const yBase = jitterSample.maxY - TREE_SINK_EPS;
      return { x: jitterX, z: jitterZ, yBase, reason: 'relocated' };
    }
  }

  // All attempts failed, skip this tree
  return null;
}
