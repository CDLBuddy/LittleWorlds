import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  type AbstractMesh,
} from '@babylonjs/core';

export function createLingerNests(scene: Scene, parent: TransformNode) {
  // Visual-only "soft clearings" around edges. These are not interactable yet.
  const nests: Array<{ mesh: AbstractMesh; mat: StandardMaterial }> = [];

  const positions = [
    new Vector3(0, 0.01, -30), // north-ish
    new Vector3(30, 0.01, 0), // east-ish
    new Vector3(0, 0.01, 30), // south-ish
    new Vector3(-30, 0.01, 0), // west-ish
  ];

  for (let i = 0; i < positions.length; i++) {
    const disc = MeshBuilder.CreateDisc(`dusk_nest_${i}`, { radius: 4.2, tessellation: 28 }, scene);
    disc.rotation.x = Math.PI / 2;
    disc.position.copyFrom(positions[i]);
    disc.isPickable = false;
    disc.checkCollisions = false;
    disc.parent = parent;

    const mat = new StandardMaterial(`dusk_nest_${i}_mat`, scene);
    mat.diffuseColor = new Color3(0.18, 0.28, 0.18);
    mat.emissiveColor = new Color3(0.02, 0.03, 0.02);
    mat.specularColor = new Color3(0, 0, 0);
    disc.material = mat;

    nests.push({ mesh: disc, mat });
  }

  return {
    dispose: () => {
      for (const n of nests) {
        n.mesh.dispose();
        n.mat.dispose();
      }
    },
  };
}
