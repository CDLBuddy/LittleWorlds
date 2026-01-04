import { Scene, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { DUSK } from '../config/constants';

export function createGround(scene: Scene) {
  const meadowGround = MeshBuilder.CreateGround(
    'dusk_meadow',
    { width: DUSK.SIZE, height: DUSK.SIZE, subdivisions: 2 },
    scene
  );
  meadowGround.position.set(0, DUSK.GROUND_Y, 0);
  meadowGround.isPickable = true;
  meadowGround.checkCollisions = false;
  meadowGround.metadata = { walkable: true };

  const meadowMat = new StandardMaterial('duskMeadowMat', scene);
  meadowMat.diffuseColor = new Color3(0.42, 0.52, 0.28); // warm meadow green
  meadowMat.specularColor = new Color3(0.06, 0.06, 0.06);
  meadowMat.ambientColor = new Color3(0.15, 0.12, 0.22);
  meadowMat.emissiveColor = new Color3(0.0, 0.0, 0.0);
  meadowGround.material = meadowMat;

  return {
    mesh: meadowGround,
    dispose: () => {
      meadowGround.dispose();
      meadowMat.dispose();
    },
  };
}
