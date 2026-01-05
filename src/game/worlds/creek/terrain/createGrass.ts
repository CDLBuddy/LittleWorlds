/**
 * Creek World - Grass terrain
 * Creates grass field using shared factory
 */

import type { Scene } from '@babylonjs/core';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { GrassFieldResult } from '@game/terrain/grass/types';
import { loadContainer } from '../models/loadContainer';
import { CREEK_GRASS_CONFIG } from './grassConfig';

/**
 * Create Creek grass field along banks
 * @param scene - Babylon scene
 * @param getIsAlive - Lifecycle guard callback
 * @returns Grass field result with parent, instances, template, container
 */
export async function createGrass(
  scene: Scene,
  getIsAlive: () => boolean
): Promise<GrassFieldResult> {
  const result = await createGrassField(
    scene,
    {
      ...CREEK_GRASS_CONFIG,
      parentName: 'creekGrass',
    },
    {
      loadContainer: async (args) => (await loadContainer(args))!,
      getIsAlive,
    }
  );

  if (import.meta.env.DEV) {
    console.log(`[Creek] Created grass field with ${result.instances.length} instances`);
  }

  return result;
}
