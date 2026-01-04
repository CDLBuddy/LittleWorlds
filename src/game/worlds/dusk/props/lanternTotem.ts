import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';

export function createLanternTotem(scene: Scene, parent: TransformNode) {
  // Visual-only "trail totem" for the approach to Night.
  const root = new TransformNode('dusk_totem_root', scene);
  root.parent = parent;
  root.position.copyFrom(DUSK.TOTEM_POS);

  const post = MeshBuilder.CreateCylinder('dusk_totem_post', { height: 3.2, diameter: 0.35, tessellation: 10 }, scene);
  post.parent = root;
  post.position.set(0, 1.6, 0);
  post.isPickable = false;

  const postMat = new StandardMaterial('dusk_totem_post_mat', scene);
  postMat.diffuseColor = new Color3(0.20, 0.14, 0.09);
  postMat.specularColor = new Color3(0.06, 0.06, 0.06);
  post.material = postMat;

  const lantern = MeshBuilder.CreateBox('dusk_totem_lantern', { width: 0.5, height: 0.7, depth: 0.5 }, scene);
  lantern.parent = root;
  lantern.position.set(0, 2.7, 0);
  lantern.isPickable = false;

  const lanternMat = new StandardMaterial('dusk_totem_lantern_mat', scene);
  lanternMat.diffuseColor = new Color3(0.14, 0.14, 0.16);
  lanternMat.emissiveColor = new Color3(0.95, 0.60, 0.22).scale(0.55);
  lanternMat.specularColor = new Color3(0.08, 0.08, 0.08);
  lantern.material = lanternMat;

  return {
    dispose: () => {
      lantern.dispose();
      post.dispose();
      lanternMat.dispose();
      postMat.dispose();
      root.dispose();
    },
  };
}
