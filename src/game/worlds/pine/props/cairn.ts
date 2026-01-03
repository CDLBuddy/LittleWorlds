/**
 * Pine World - Cairn prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, type Vector3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createCairn(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vector3) {
  const stoneMat = mats.get('pineStoneMat', () => {
    const m = new StandardMaterial('pineStoneMat', scene);
    m.diffuseColor = new Color3(0.5, 0.5, 0.48);
    m.ambientColor = new Color3(0.18, 0.18, 0.18);
    m.specularColor = Color3.Black();
    return m;
  });

  const sizes = [1.15, 0.95, 0.75, 0.55, 0.38];
  let y = position.y;

  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const stone = bag.trackMesh(MeshBuilder.CreateSphere(`cairn_stone_${i}`, { diameter: s, segments: 8 }, scene));
    stone.position.set(position.x + (Math.random() - 0.5) * 0.1, y + s * 0.5, position.z + (Math.random() - 0.5) * 0.1);
    stone.scaling.y = 0.72;
    stone.material = stoneMat;
    stone.receiveShadows = true;
    y += s * 0.6;
  }
}
