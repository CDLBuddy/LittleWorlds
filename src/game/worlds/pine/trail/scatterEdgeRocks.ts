/**
 * Pine World - Trail edge rocks
 * Scatter rocks along trail edges for visual definition and realism
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { X_MIN, X_MAX } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { mulberry32, seededFromString } from '../utils/math';
import { heightAtXZ } from '../utils/terrain';
import { getTrailWidthAt } from './buildCenterline';

/**
 * Scatter realistic rocks along trail edges for definition
 * Uses seeded random for consistent placement across reloads
 */
export function scatterTrailEdgeRocks(
  scene: Scene,
  bag: DisposableBag,
  mats: MaterialCache,
  centerline: Vector3[]
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

    // Bounds check
    if (x < X_MIN || x > X_MAX) continue;

    const y = heightAtXZ(x, z);

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

    // Partially embed in terrain (looks more natural)
    rock.position.set(x, y - baseSize * 0.15, z);
    
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
  }
}
