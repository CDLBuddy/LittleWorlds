/**
 * Pine World - Grass terrain
 * Creates grass field using shared factory with terrain conforming
 */

import type { Scene } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { GrassFieldResult } from '@game/terrain/grass/types';
import type { DisposableBag } from '../utils/DisposableBag';
import { PINE_GRASS_CONFIG } from './grassConfig';
import { heightAtXZ } from '../utils/terrain';
import { buildSwitchbackCenterline } from '../trail/buildCenterline';

/**
 * Asset container loader for Pine (inline, not shared module)
 */
async function loadContainer(params: { scene: Scene; url: string; getIsAlive: () => boolean }) {
  const { scene, url, getIsAlive } = params;
  
  if (!getIsAlive()) return undefined;
  
  const container = await SceneLoader.LoadAssetContainerAsync('assets/models/', url, scene);
  
  if (!getIsAlive()) {
    container.dispose();
    return undefined;
  }
  
  return container;
}

/**
 * Create Pine forest grass field
 * @param scene - Babylon scene
 * @param bag - DisposableBag for resource tracking
 * @param getIsAlive - Lifecycle guard callback
 * @returns Grass field result (tracked in DisposableBag)
 */
export async function createGrass(
  scene: Scene,
  bag: DisposableBag,
  getIsAlive: () => boolean
): Promise<GrassFieldResult> {
  // Build trail centerline for corridor exclusion
  const centerline = buildSwitchbackCenterline();
  const trailPoints = centerline.map((v) => ({ x: v.x, z: v.z }));

  const result = await createGrassField(
    scene,
    {
      ...PINE_GRASS_CONFIG,
      parentName: 'pineGrass',
      // Phase E: Budget controls for less grid-like appearance
      budget: {
        density: 0.7,        // 70% of full grid density
        maxInstances: 250,   // Hard cap for performance
      },
      // Phase E: Enhanced placement with seeded jitter
      placement: {
        ...PINE_GRASS_CONFIG.placement,
        jitter: {
          position: { xz: 1.5 },           // ±1.5m random offset in XZ
          rotationY: { rad: Math.PI * 2 }, // Full 0-360° random rotation
          scale: { min: 0.85, max: 1.2 },  // 85%-120% scale variation
        },
        random: {
          seed: 'pine_grass_v1', // Deterministic layout across reloads
        },
      },
      // Phase E: Corridor exclusion for trail (using variable width)
      zones: [
        ...(PINE_GRASS_CONFIG.zones || []),
        {
          kind: 'corridor',
          points: trailPoints,
          width: 14, // 14m wide corridor (accounts for variable trail width + margins)
        },
      ],
      // Phase D: Enable terrain conforming with Phase E polish
      terrain: {
        mode: 'heightFn',
        heightAt: heightAtXZ,
        sampleEps: 0.5,
        alignToNormal: true,
        yOffset: -0.05,      // Sink 5cm into terrain for grounding
        maxTiltDeg: 25,      // Clamp max tilt to 25° for natural look
        normalBlend: 0.92,   // 92% terrain normal, 8% vertical (subtle softening)
      },
    },
    {
      loadContainer: async (args) => (await loadContainer(args))!,
      getIsAlive,
    }
  );

  // Track parent in DisposableBag (disposes instances too)
  bag.trackMesh(result.parent as any);
  
  // Track container in DisposableBag
  if (result.container) {
    bag.trackOther(result.container);
  }

  if (import.meta.env.DEV) {
    console.log(`[Pine] Created grass field with ${result.instances.length} instances (Phase E: seeded + budgeted)`);
  }

  return result;
}
