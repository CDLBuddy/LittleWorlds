/**
 * Pine World - Terrain creation
 * Creates the main Pine Trails terrain mesh, visually sloped from south→north (0→+12 units)
 */

import {
  Color3,
  MeshBuilder,
  type Scene,
  StandardMaterial,
} from '@babylonjs/core';
import { PINE_TERRAIN } from '../config/constants';
import { heightAtXZ } from '../utils/terrain';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createTerrain(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  const { width, depth } = PINE_TERRAIN;

  const ground = bag.trackMesh(
    MeshBuilder.CreateGround(
      'pine_terrain',
      {
        width,
        height: depth,
        subdivisionsX: 40,
        subdivisionsY: 70,
        updatable: true, // ✅ Critical: allows vertex deformation
      },
      scene
    )
  );

  // ✅ Actually deform the ground to match getElevationAtZ()
  ground.updateMeshPositions((positions) => {
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i + 0];
      const z = positions[i + 2];
      positions[i + 1] = heightAtXZ(x, z);
    }
  }, true); // true => recompute normals

  ground.refreshBoundingInfo(true);
  ground.isPickable = true;
  ground.checkCollisions = true;
  ground.receiveShadows = true;
  ground.metadata = { walkable: true };

  // === Material ===
  const mat = mats.get('pineTerrainMat', () => {
    const m = new StandardMaterial('pineTerrainMat', scene);
    m.diffuseColor = new Color3(0.35, 0.28, 0.22);
    m.specularColor = new Color3(0.1, 0.08, 0.06);
    m.ambientColor = new Color3(0.25, 0.2, 0.15);
    return m;
  });

  ground.material = mat;

  return ground;
}
