/**
 * Pine World - Pine bough hut prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3, type Vector3 as Vec3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createPineBoughHut(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vec3) {
  const roofMat = mats.get('roofMat', () => {
    const m = new StandardMaterial('roofMat', scene);
    m.diffuseColor = new Color3(0.25, 0.32, 0.22);
    m.ambientColor = new Color3(0.12, 0.16, 0.12);
    m.specularColor = Color3.Black();
    return m;
  });

  const floorMat = mats.get('floorMat', () => {
    const m = new StandardMaterial('floorMat', scene);
    m.diffuseColor = new Color3(0.35, 0.28, 0.22);
    m.ambientColor = new Color3(0.14, 0.12, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const roof = bag.trackMesh(
    MeshBuilder.CreateCylinder('hut_roof', { height: 3.2, diameterTop: 0.1, diameterBottom: 3.2, tessellation: 3 }, scene)
  );
  roof.position = new Vector3(position.x, position.y + 1.7, position.z);
  roof.rotation.z = Math.PI / 2;
  roof.material = roofMat;
  roof.receiveShadows = true;

  const floor = bag.trackMesh(MeshBuilder.CreateBox('hut_floor', { width: 3.2, height: 0.12, depth: 2.7 }, scene));
  floor.position = new Vector3(position.x, position.y + 0.06, position.z);
  floor.material = floorMat;
  floor.receiveShadows = true;
}
