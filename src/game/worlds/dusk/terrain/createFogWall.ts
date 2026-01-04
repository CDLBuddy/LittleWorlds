import { Scene, TransformNode, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export function createFogWall(scene: Scene, parent: TransformNode) {
  // Visual-only fog wall tease at (-18, -8) area from README.
  const root = new TransformNode('dusk_fog_tease_root', scene);
  root.parent = parent;

  const fog = MeshBuilder.CreateBox('dusk_fog_wall', { width: 10, height: 4, depth: 2 }, scene);
  fog.position.set(-18, 2.0, -8);
  fog.isPickable = false;
  fog.checkCollisions = false;
  fog.parent = root;

  const mat = new StandardMaterial('dusk_fog_wall_mat', scene);
  mat.diffuseColor = new Color3(0.70, 0.62, 0.85);
  mat.emissiveColor = new Color3(0.18, 0.12, 0.22);
  mat.alpha = 0.25;
  mat.specularColor = new Color3(0, 0, 0);
  fog.material = mat;

  return {
    dispose: () => {
      fog.dispose();
      mat.dispose();
      root.dispose();
    },
  };
}
