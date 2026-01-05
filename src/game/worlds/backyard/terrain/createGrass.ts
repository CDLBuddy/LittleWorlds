/**
 * Backyard World - Grass tiling system
 * Thin wrapper around shared createGrassField factory
 */

import { type Scene, type AbstractMesh } from '@babylonjs/core';
import { loadContainer } from '../models/loadContainer';
import { GRASS_CONFIG, GRASS_EXCLUSION_ZONES, GRASS_WIND_CONFIG } from '../config/constants';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { ExclusionZone, GrassFieldResult } from '@game/terrain/grass/types';

/**
 * Load and tile grass across the backyard with exclusion zones for structures
 * 
 * Uses shared createGrassField factory with Backyard-specific configuration:
 * - 6×6 grid with 13m spacing
 * - Exclusion zones for house, sandbox, garden
 * - Wind animation with amplitude 0.15, speed 1.2
 * - 60% Y-scale for grass height
 */
export async function createGrass(
  scene: Scene,
  ground: AbstractMesh,
  getIsAlive: () => boolean
): Promise<GrassFieldResult> {
  // Convert Backyard constants to shared ExclusionZone format
  const zones: ExclusionZone[] = GRASS_EXCLUSION_ZONES.map(zone => ({
    kind: 'rect' as const,
    centerX: zone.centerX,
    centerZ: zone.centerZ,
    width: zone.width,
    depth: zone.depth,
  }));

  // Create grass field using shared factory
  const result = await createGrassField(
    scene,
    {
      assetUrl: 'Summergrass.glb',
      template: {
        // Match original Backyard template selection logic
        predicate: (m) => m.name.includes('grass') || m.name.includes('Plane'),
      },
      placement: {
        gridSize: GRASS_CONFIG.gridSize,
        spacing: GRASS_CONFIG.spacing,
        offset: GRASS_CONFIG.offset,
        scaleY: GRASS_CONFIG.scaleY,
      },
      zones,
      wind: GRASS_WIND_CONFIG,
      parentName: 'grassParent',
      debug: { log: true },
    },
    {
      loadContainer,
      getIsAlive,
    }
  );

  if (import.meta.env.DEV) {
    console.log(`[Backyard] Created grass field with ${result.instances.length} instances`);
    console.log(`[Backyard] Template mesh: ${result.templateMesh.name}`);
    if (result.instances.length > 0) {
      const first = result.instances[0];
      console.log(`[Backyard] First instance position: (${first.position.x.toFixed(1)}, ${first.position.z.toFixed(1)})`);
    }
  }

  // Hide the basic ground since we have grass now
  ground.visibility = 0;
  ground.setEnabled(false);

  // Return full GrassFieldResult for disposal management
  return result;
}

