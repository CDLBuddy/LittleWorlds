/**
 * Pine World - Trapper's cache prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3, type Vector3 as Vec3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createTrappersCache(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vec3) {
  const mat = mats.get('cacheMat', () => {
    const m = new StandardMaterial('cacheMat', scene);
    m.diffuseColor = new Color3(0.3, 0.25, 0.2);
    m.ambientColor = new Color3(0.12, 0.1, 0.08);
    m.specularColor = Color3.Black();
    return m;
  });

  const cache = bag.trackMesh(MeshBuilder.CreateBox('trappers_cache', { width: 1.5, height: 0.8, depth: 1.0 }, scene));
  cache.position = position.add(new Vector3(0, 0.4, 0));
  cache.rotation.y = Math.PI / 6;
  cache.material = mat;
  cache.receiveShadows = true;
}
