/**
 * Woodline World - Grass terrain
 * Creates grass field using shared factory
 */

import type { Scene } from '@babylonjs/core';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { GrassFieldResult } from '@game/terrain/grass/types';
import { loadContainer } from '../models/loadContainer';
import { WOODLINE_GRASS_CONFIG } from './grassConfig';

/**
 * Create grass field for Woodline world
 * Returns GrassFieldResult for disposal management
 */
export async function createGrass(
  scene: Scene,
  getIsAlive: () => boolean
): Promise<GrassFieldResult> {
  const result = await createGrassField(
    scene,
    {
      ...WOODLINE_GRASS_CONFIG,
      parentName: 'woodlineGrass',
    },
    {
      loadContainer,
      getIsAlive,
    }
  );

  if (import.meta.env.DEV) {
    console.log(`[Woodline] Created grass field with ${result.instances.length} instances`);
  }

  return result;
}
