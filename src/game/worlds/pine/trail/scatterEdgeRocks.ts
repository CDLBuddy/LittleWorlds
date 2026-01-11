/**
 * Pine World - Trail edge rocks
 * Scatter rocks along trail edges for visual definition and realism
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { snapMeshBaseToGround } from '../../../terrain/snapToTerrain';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { mulberry32, seededFromString } from '../utils/math';
import { isSlopeOk } from '../utils/placement';
import { getTrailWidthAt } from './buildCenterline';

/**
 * Scatter realistic rocks along trail edges for definition
 * Uses seeded random for consistent placement across reloads
 * Phase 8: Added slope checking to prevent rocks on steep terrain
 */
export function scatterTrailEdgeRocks(
  scene: Scene,
  bag: DisposableBag,
  mats: MaterialCache,
  centerline: Vector3[],
  sampler: TerrainSamplerWithBounds
) {
  const rand = mulberry32(seededFromString('pine_trail_rocks_v2'));

  // Material with slight color variation
  const rockMat = mats.get('pineRockMat', () => {
    const m = new StandardMaterial('pineRockMat', scene);
    m.diffuseColor = new Color3(0.48, 0.46, 0.44); // Slightly warmer gray
    m.ambientColor = new Color3(0.18, 0.18, 0.18);
    m.specularColor = new Color3(0.12, 0.12, 0.12); // Subtle rocky sheen
    m.specularPower = 16;
    return m;
  });

  const count = 48; // More rocks for better definition
  let placed = 0;
  let skipped = 0;

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rand() * centerline.length);
    const p = centerline[idx];
    const t = idx / (centerline.length - 1);

    // Get trail width at this position
    const trailHalfWidth = getTrailWidthAt(t);

    // Place rocks just outside trail edge (0.5-2m beyond edge)
    const side = rand() < 0.5 ? -1 : 1;
    const edgeOffset = 0.5 + rand() * 2.5;
    const x = p.x + side * (trailHalfWidth + edgeOffset);
    
    // Slight longitudinal variation
    const z = p.z + (rand() - 0.5) * 3.0;

    // Phase 8: Bounds check using sampler
    if (!sampler.inBounds(x, z)) {
      skipped++;
      continue;
    }

    // Phase 8: Slope check - skip if too steep (rocks would float/clip)
    const normal = sampler.normalAt(x, z);
    if (!isSlopeOk(normal.y, 0.7)) { // Allow slightly steeper slopes (0.7 = ~45°)
      skipped++;
      continue;
    }

    // Create more realistic rock shapes (ellipsoid, not sphere)
    const baseSize = 0.5 + rand() * 1.1;
    const rock = bag.trackMesh(
      MeshBuilder.CreateSphere(
        `trail_rock_${i}`,
        {
          diameterX: baseSize * (0.8 + rand() * 0.4),
          diameterY: baseSize * (0.5 + rand() * 0.3), // Flatter rocks
          diameterZ: baseSize * (0.9 + rand() * 0.3),
          segments: 8,
        },
        scene
      )
    );

    // Position in XZ, then snap to terrain by base
    rock.position.set(x, 0, z);
    snapMeshBaseToGround(rock, sampler.heightAt, -baseSize * 0.15); // Partially embed
    
    // Random rotation for organic look
    rock.rotation.set(
      (rand() - 0.5) * 0.3, // Slight tilt
      rand() * Math.PI * 2,  // Random yaw
      (rand() - 0.5) * 0.3   // Slight tilt
    );

    rock.material = rockMat;
    rock.receiveShadows = true;
    rock.isPickable = false;

    // Add some color variation per rock
    const colorVariation = 0.9 + rand() * 0.2;
    if (rand() > 0.7) {
      // Some rocks slightly different color
      const rockMatVariant = new StandardMaterial(`pineRockMat_${i}`, scene);
      rockMatVariant.diffuseColor = new Color3(
        0.48 * colorVariation,
        0.46 * colorVariation,
        0.44 * colorVariation
      );
      rockMatVariant.ambientColor = rockMat.ambientColor;
      rockMatVariant.specularColor = rockMat.specularColor;
      rockMatVariant.specularPower = rockMat.specularPower;
      rock.material = rockMatVariant;
      bag.trackOther(rockMatVariant);
    }

    placed++;
  }

  if (import.meta.env.DEV) {
    console.log(`[Pine] Trail edge rocks: ${placed} placed, ${skipped} skipped (OOB or steep)`);
  }
}

