/**
 * Pine World - Pinecone totem prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3, type Vector3 as Vec3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createPineconeTotem(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vec3) {
  const mat = mats.get('totemMat', () => {
    const m = new StandardMaterial('totemMat', scene);
    m.diffuseColor = new Color3(0.4, 0.35, 0.28);
    m.ambientColor = new Color3(0.14, 0.12, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const coneMat = mats.get('pineconeMat', () => {
    const m = new StandardMaterial('pineconeMat', scene);
    m.diffuseColor = new Color3(0.5, 0.4, 0.3);
    m.ambientColor = new Color3(0.16, 0.13, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const totem = bag.trackMesh(MeshBuilder.CreateCylinder('pinecone_totem', { height: 3, diameter: 0.22, tessellation: 8 }, scene));
  totem.position = position.add(new Vector3(0, 1.5, 0));
  totem.material = mat;
  totem.receiveShadows = true;

  for (let i = 0; i < 5; i++) {
    const cone = bag.trackMesh(MeshBuilder.CreateSphere(`totem_cone_${i}`, { diameter: 0.32, segments: 6 }, scene));
    cone.position = new Vector3(
      Math.sin(i * Math.PI * 0.4) * 0.3,
      -1.2 + 0.6 + i * 0.5,
      Math.cos(i * Math.PI * 0.4) * 0.3
    );
    cone.scaling.y = 1.5;
    cone.parent = totem;
    cone.material = coneMat;
    cone.receiveShadows = true;
  }
}
