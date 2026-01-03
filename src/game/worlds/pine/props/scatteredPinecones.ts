/**
 * Pine World - Scattered pinecones
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial } from '@babylonjs/core';
import { TRAIL_HALF_WIDTH, X_MIN, X_MAX, Z_NORTH, Z_SOUTH } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { clamp, mulberry32, seededFromString } from '../utils/math';
import { heightAtXZ } from '../utils/terrain';

export function createScatteredPinecones(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  const coneMat = mats.get('pineconeMat_ground', () => {
    const m = new StandardMaterial('pineconeMat_ground', scene);
    m.diffuseColor = new Color3(0.5, 0.4, 0.3);
    m.ambientColor = new Color3(0.16, 0.13, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const rand = mulberry32(seededFromString('pine_pinecones'));
  const count = 30;

  for (let i = 0; i < count; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);
    const x = clamp((rand() - 0.5) * 40, X_MIN, X_MAX);

    // Keep mostly off the trail ribbon
    if (Math.abs(x) < TRAIL_HALF_WIDTH + 2) continue;

    const y = heightAtXZ(x, z);

    const cone = bag.trackMesh(MeshBuilder.CreateSphere(`pinecone_${i}`, { diameter: 0.15, segments: 6 }, scene));
    cone.position.set(x, y + 0.1, z);
    cone.scaling.y = 1.5;
    cone.rotation.x = rand() * Math.PI;
    cone.rotation.z = rand() * Math.PI;
    cone.material = coneMat;
    cone.receiveShadows = true;
  }
}
