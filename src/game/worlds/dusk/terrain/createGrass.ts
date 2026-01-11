/**
 * Dusk World - Grass terrain
 * Creates grass field using shared factory (flat meadow, no terrain conforming)
 */

import type { Scene } from '@babylonjs/core';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { GrassFieldResult } from '@game/terrain/grass/types';
import { loadContainer } from '../models/loadContainer';
import { DUSK_GRASS_CONFIG } from './grassConfig';

/**
 * Flat meadow height function
 * @param _ - X coordinate (unused)
 * @param __ - Z coordinate (unused)
 * @returns Flat ground level
 */
function heightAtXZ(_: number, __: number): number {
  return 0; // Flat meadow at y=0
}

/**
 * Create Dusk meadow grass field
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
      ...DUSK_GRASS_CONFIG,
      parentName: 'duskGrass',
      // Phase E: Budget controls for organic appearance
      budget: {
        density: 0.75,       // 75% of full grid density
        maxInstances: 200,   // Hard cap for performance
      },
      // Phase E: Enhanced placement with seeded jitter
      placement: {
        ...DUSK_GRASS_CONFIG.placement,
        jitter: {
          position: { xz: 2.5 },           // ±2.5m random offset in XZ
          rotationY: { rad: Math.PI * 2 }, // Full 0-360° random rotation
          scale: { min: 0.8, max: 1.25 },  // 80%-125% scale variation
        },
        random: {
          seed: 'dusk_grass_v1', // Deterministic layout across reloads
        },
      },
      // Phase D: Flat terrain (no conforming needed for meadow)
      terrain: {
        mode: 'heightFn',
        heightAt: heightAtXZ,
        alignToNormal: false, // Keep vertical
      },
    },
    {
      loadContainer: async (args) => {
        const container = await loadContainer(args);
        if (!container) throw new Error('Container load cancelled');
        // Add container meshes to scene so they can be used
        container.addAllToScene();
        return container;
      },
      getIsAlive,
    }
  );

  if (import.meta.env.DEV) {
    console.log(`[Dusk] Created grass field with ${result.instances.length} instances (Phase E: seeded + budgeted)`);
  }

  return result;
}
