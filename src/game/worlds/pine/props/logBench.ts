/**
 * Pine World - Log bench prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, type Vector3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createLogBench(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vector3) {
  const mat = mats.get('logMat', () => {
    const m = new StandardMaterial('logMat', scene);
    m.diffuseColor = new Color3(0.4, 0.35, 0.28);
    m.ambientColor = new Color3(0.14, 0.12, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const log = bag.trackMesh(MeshBuilder.CreateCylinder('log_bench', { height: 2.4, diameter: 0.6, tessellation: 12 }, scene));
  log.position = position;
  log.rotation.z = Math.PI / 2;
  log.material = mat;
  log.receiveShadows = true;
}
