/**
 * Beach World - Grass terrain
 * Creates grass field using shared factory (flat beach, no terrain conforming)
 */

import type { Scene } from '@babylonjs/core';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { GrassFieldResult } from '@game/terrain/grass/types';
import { loadContainer } from '../models/loadContainer';
import { BEACH_GRASS_CONFIG } from './grassConfig';

/**
 * Flat beach height function
 * @param _ - X coordinate (unused)
 * @param __ - Z coordinate (unused)
 * @returns Flat ground level
 */
function heightAtXZ(_: number, __: number): number {
  return 0; // Flat beach at y=0
}

/**
 * Create Beach grass field
 * @param scene - Babylon scene
 * @param getIsAlive - Lifecycle guard callback
 * @returns Grass field result
 */
export async function createGrass(
  scene: Scene,
  getIsAlive: () => boolean
): Promise<GrassFieldResult> {
  const result = await createGrassField(
    scene,
    {
      ...BEACH_GRASS_CONFIG,
      parentName: 'beachGrass',
      // Phase E: Budget controls for sparse beach grass
      budget: {
        density: 0.55,       // 55% of full grid density (sparse beach vegetation)
        maxInstances: 150,   // Hard cap for performance
      },
      // Phase E: Enhanced placement with seeded jitter
      placement: {
        ...BEACH_GRASS_CONFIG.placement,
        jitter: {
          position: { xz: 3.5 },           // ±3.5m random offset in XZ
          rotationY: { rad: Math.PI * 2 }, // Full 0-360° random rotation
          scale: { min: 0.7, max: 1.2 },   // 70%-120% scale variation
        },
        random: {
          seed: 'beach_grass_v1', // Deterministic layout across reloads
        },
      },
      // Phase D: Flat terrain (no conforming needed for beach)
      terrain: {
        mode: 'heightFn',
        heightAt: heightAtXZ,
        alignToNormal: false, // Keep vertical
      },
    },
    {
      loadContainer: (args) => loadContainer({ ...args, addToScene: true }),
      getIsAlive,
    }
  );

  if (import.meta.env.DEV) {
    console.log(`[Beach] Created grass field with ${result.instances.length} instances (Phase E: seeded + budgeted)`);
  }

  return result;
}
