import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  type AbstractMesh,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';

export function createAncientOak(scene: Scene, parent: TransformNode) {
  // Procedural "ancient oak" placeholder: chunky trunk + canopy blobs.
  // Later you can swap this with an OakTree_Ancient.glb without changing world logic.

  const root = new TransformNode('dusk_oak_root', scene);
  root.parent = parent;
  root.position.copyFrom(DUSK.OAK_POS);

  const trunk = MeshBuilder.CreateCylinder(
    'dusk_oak_trunk',
    { height: 10.5, diameterTop: 2.0, diameterBottom: 2.6, tessellation: 10 },
    scene
  );
  trunk.parent = root;
  trunk.position.set(0, 5.25, 0);
  trunk.isPickable = false;
  trunk.checkCollisions = false;

  const barkMat = new StandardMaterial('dusk_oak_bark_mat', scene);
  barkMat.diffuseColor = new Color3(0.22, 0.15, 0.10);
  barkMat.emissiveColor = new Color3(0.02, 0.01, 0.01);
  barkMat.specularColor = new Color3(0.04, 0.04, 0.04);
  trunk.material = barkMat;

  // Branch hint
  const branch = MeshBuilder.CreateCylinder(
    'dusk_oak_branch',
    { height: 5.2, diameterTop: 0.65, diameterBottom: 0.85, tessellation: 10 },
    scene
  );
  branch.parent = root;
  branch.position.set(1.2, 8.1, 0.0);
  branch.rotation.z = Math.PI / 2;
  branch.rotation.y = 0.15;
  branch.isPickable = false;
  branch.checkCollisions = false;
  branch.material = barkMat;

  const canopyMat = new StandardMaterial('dusk_oak_canopy_mat', scene);
  canopyMat.diffuseColor = new Color3(0.10, 0.22, 0.10);
  canopyMat.emissiveColor = new Color3(0.02, 0.04, 0.02);
  canopyMat.specularColor = new Color3(0, 0, 0);

  const blobs: AbstractMesh[] = [];
  const blobData = [
    { x: 0.0, y: 11.0, z: 0.0, s: 6.8 },
    { x: -2.4, y: 10.5, z: 1.8, s: 5.6 },
    { x: 2.6, y: 10.8, z: -1.6, s: 5.9 },
    { x: 0.8, y: 12.3, z: 2.4, s: 5.2 },
    { x: -0.9, y: 12.1, z: -2.6, s: 5.0 },
  ];

  for (let i = 0; i < blobData.length; i++) {
    const b = blobData[i];
    const blob = MeshBuilder.CreateSphere(`dusk_oak_blob_${i}`, { diameter: b.s, segments: 8 }, scene);
    blob.parent = root;
    blob.position.set(b.x, b.y, b.z);
    blob.isPickable = false;
    blob.checkCollisions = false;
    blob.material = canopyMat;
    blobs.push(blob);
  }

  // Swing anchor: under the branch
  const swingAnchorWorld = new Vector3(2.8, 7.4, 0.0);

  return {
    swingAnchorWorld,
    dispose: () => {
      for (const m of blobs) m.dispose();
      canopyMat.dispose();
      branch.dispose();
      trunk.dispose();
      barkMat.dispose();
      root.dispose();
    },
  };
}
