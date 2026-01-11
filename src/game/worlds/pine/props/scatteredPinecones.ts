/**
 * Pine World - Scattered pinecones
 * Phase 8: Use sampler for terrain queries, add slope checking
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial } from '@babylonjs/core';
import { TRAIL_HALF_WIDTH, Z_NORTH, Z_SOUTH } from '../config/constants';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { clamp, mulberry32, seededFromString } from '../utils/math';
import { isSlopeOk } from '../utils/placement';

export function createScatteredPinecones(
  scene: Scene,
  bag: DisposableBag,
  mats: MaterialCache,
  sampler: TerrainSamplerWithBounds
) {
  const coneMat = mats.get('pineconeMat_ground', () => {
    const m = new StandardMaterial('pineconeMat_ground', scene);
    m.diffuseColor = new Color3(0.5, 0.4, 0.3);
    m.ambientColor = new Color3(0.16, 0.13, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const rand = mulberry32(seededFromString('pine_pinecones'));
  const count = 30;
  const bounds = sampler.bounds;
  const xMin = bounds.min.x;
  const xMax = bounds.max.x;

  let placed = 0;
  let skipped = 0;

  for (let i = 0; i < count; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);
    const x = clamp((rand() - 0.5) * 40, xMin, xMax);

    // Keep mostly off the trail ribbon
    if (Math.abs(x) < TRAIL_HALF_WIDTH + 2) {
      skipped++;
      continue;
    }

    // Phase 8: Bounds and slope checks
    if (!sampler.inBounds(x, z)) {
      skipped++;
      continue;
    }

    const normal = sampler.normalAt(x, z);
    if (!isSlopeOk(normal.y, 0.75)) { // Pinecones on flatter ground
      skipped++;
      continue;
    }

    const y = sampler.heightAt(x, z);

    const cone = bag.trackMesh(MeshBuilder.CreateSphere(`pinecone_${i}`, { diameter: 0.15, segments: 6 }, scene));
    cone.position.set(x, y + 0.1, z);
    cone.scaling.y = 1.5;
    cone.rotation.x = rand() * Math.PI;
    cone.rotation.z = rand() * Math.PI;
    cone.material = coneMat;
    cone.receiveShadows = true;
    placed++;
  }

  if (import.meta.env.DEV) {
    console.log(`[Pine] Scattered pinecones: ${placed}/${count} placed, ${skipped} skipped`);
  }
}
