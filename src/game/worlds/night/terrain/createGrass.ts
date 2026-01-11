/**
 * Night World - Circular grass patches with hex placement
 * Uses raycast allowlist to avoid water/void, conforms to terrain
 */

import type { Scene } from '@babylonjs/core';
import { Mesh } from '@babylonjs/core';
import { createGrassField } from '@game/terrain/grass/createGrassField';
import type { GrassFieldResult } from '@game/terrain/grass/types';
import { prepareTemplateMeshForInstancing } from '@game/terrain/grass/asset/prepareTemplateMesh';
import { loadContainer } from '../models/loadContainer';
import { NIGHT_GRASS_CONFIG } from './grassConfig';

/**
 * Create Night clearing grass field with circular patches
 * @param scene - Babylon scene
 * @param clearingGround - Ground mesh for raycast allowlist
 * @param getIsAlive - Lifecycle guard callback
 * @returns Grass field result
 */
export async function createGrass(
  scene: Scene,
  clearingGround: import('@babylonjs/core').AbstractMesh,
  getIsAlive: () => boolean
): Promise<GrassFieldResult> {
  const result = await createGrassField(
    scene,
    {
      ...NIGHT_GRASS_CONFIG,
      parentName: 'nightGrass',
      // Phase C: Staggered grid with manual spacing for circular patches
      placement: {
        mode: { kind: 'staggered' },     // Offset odd rows for better coverage
        gridSize: 11,                    // 11×11 grid to fit within 100m depth
        spacing: 9,                      // 9m spacing (11 * 9 = 99m coverage)
        offset: -49.5,                   // Center grid: 99/2 = 49.5 (covers -49.5 to +49.5)
        jitter: {
          position: { xz: 1.5 },         // ±1.5m jitter for organic scatter
          rotationY: { rad: Math.PI },   // Full rotation variation
          scale: { min: 0.5, max: 1.0 }, // 50-100% scale variation
        },
        random: {
          seed: 'nightworld_grass_v3',   // New seed for different pattern
        },
      },
      // Budget controls
      budget: {
        density: 1,          // 100% density for full coverage
        maxInstances: 150,   // Cap for 121 grid positions
      },
      // Raycast allowlist terrain conforming
      terrain: {
        mode: 'raycastAllowlist',
        groundMeshes: [clearingGround],  // ONLY grassable ground, no water
        rayStartY: 50,
        rayLength: 200,
        alignToNormal: true,
        yOffset: -0.03,      // Sink slightly into ground
        maxTiltDeg: 20,      // Reasonable tilt limit
        normalBlend: 0.7,    // 70% terrain normal, 30% vertical (softer tilt)
      },
    },
    {
      loadContainer: async (args) => {
        const container = await loadContainer({ ...args, addToScene: true });
        
        // Prepare circular patch mesh: bake transforms and center pivot
        for (const mesh of container.meshes) {
          if ((mesh.name.includes('grass_circle_night') || mesh.name.includes('Cubo')) && mesh instanceof Mesh) {
            // Bake baked position/rotation/scale into vertices
            mesh.bakeCurrentTransformIntoVertices();
            // Center pivot in XZ to prevent offset scatter
            prepareTemplateMeshForInstancing(mesh, { centerPivotXZ: true });
            
            if (import.meta.env.DEV) {
              console.log(`[Night] Prepared circular grass mesh: "${mesh.name}"`);
            }
          }
        }
        
        return container;
      },
      getIsAlive,
    }
  );

  if (import.meta.env.DEV) {
    console.log(`[Night] Created grass field with ${result.instances.length} instances (staggered + auto-spacing + raycast)`);
    console.log(`[Night] Template mesh: ${result.templateMesh.name}`);
    console.log(`[Night] Parent enabled: ${result.parent.isEnabled()}`);
    console.log(`[Night] Template enabled: ${result.templateMesh.isEnabled()}, visible: ${result.templateMesh.isVisible}`);
    const thinCount = (result.templateMesh as any).thinInstanceCount;
    if (thinCount !== undefined) {
      console.log(`[Night] Thin instance count: ${thinCount}`);
    }
  }

  return result;
}
