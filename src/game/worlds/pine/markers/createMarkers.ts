/**
 * Pine World - Trail markers
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { heightAtXZ } from '../utils/terrain';
import { createCairn } from '../props/cairn';

export function createMarkers(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  // Cairns along the climb
  const cairnZ = [60, 30, 0, -30, -60];
  for (let i = 0; i < cairnZ.length; i++) {
    const z = cairnZ[i];
    createCairn(scene, bag, mats, new Vector3((i % 2 === 0 ? -3 : 3), heightAtXZ(0, z), z));
  }

  // Bent saplings: simple cylinders
  const saplingMat = mats.get('saplingMat', () => {
    const m = new StandardMaterial('saplingMat', scene);
    m.diffuseColor = new Color3(0.4, 0.35, 0.25);
    m.ambientColor = new Color3(0.14, 0.12, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const saplings = [
    { x: -3, z: 45 },
    { x: 3, z: 15 },
    { x: -3, z: -15 },
    { x: 3, z: -45 },
  ];

  for (let i = 0; i < saplings.length; i++) {
    const s = saplings[i];
    const y = heightAtXZ(s.x, s.z);

    const sapling = bag.trackMesh(
      MeshBuilder.CreateCylinder(`sapling_${i}`, { height: 2, diameter: 0.1, tessellation: 6 }, scene)
    );
    sapling.position.set(s.x, y + 1.0, s.z);
    sapling.rotation.z = Math.PI / 8;
    sapling.material = saplingMat;
    sapling.receiveShadows = true;
  }

  return true;
}
