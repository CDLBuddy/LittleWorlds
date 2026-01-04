import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';

export function createLanternWorkbench(scene: Scene, parent: TransformNode) {
  // Visual-only: a stone slab + a couple "lantern" boxes.
  const root = new TransformNode('dusk_workbench_root', scene);
  root.parent = parent;
  root.position.copyFrom(DUSK.WORKBENCH_POS);

  const slab = MeshBuilder.CreateBox('dusk_workbench_slab', { width: 3.2, height: 0.22, depth: 2.2 }, scene);
  slab.parent = root;
  slab.position.set(0, 0.11, 0);
  slab.isPickable = false;
  slab.checkCollisions = false;

  const slabMat = new StandardMaterial('dusk_workbench_slab_mat', scene);
  slabMat.diffuseColor = new Color3(0.34, 0.33, 0.38);
  slabMat.specularColor = new Color3(0.08, 0.08, 0.08);
  slab.material = slabMat;

  // little lantern props
  const lanternMat = new StandardMaterial('dusk_workbench_lantern_mat', scene);
  lanternMat.diffuseColor = new Color3(0.18, 0.18, 0.20);
  lanternMat.emissiveColor = new Color3(0.85, 0.55, 0.18).scale(0.45);
  lanternMat.specularColor = new Color3(0.08, 0.08, 0.08);

  const lantern1 = MeshBuilder.CreateBox('dusk_workbench_lantern1', { width: 0.35, height: 0.5, depth: 0.35 }, scene);
  lantern1.parent = root;
  lantern1.position.set(0.85, 0.45, 0.55);
  lantern1.material = lanternMat;
  lantern1.isPickable = false;

  const lantern2 = MeshBuilder.CreateBox('dusk_workbench_lantern2', { width: 0.35, height: 0.5, depth: 0.35 }, scene);
  lantern2.parent = root;
  lantern2.position.set(-0.65, 0.45, -0.25);
  lantern2.material = lanternMat;
  lantern2.isPickable = false;

  return {
    dispose: () => {
      lantern1.dispose();
      lantern2.dispose();
      slab.dispose();
      slabMat.dispose();
      lanternMat.dispose();
      root.dispose();
    },
  };
}
