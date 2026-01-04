import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';

export function createPhotographyRock(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('dusk_photo_rock_root', scene);
  root.parent = parent;

  const rock = MeshBuilder.CreateSphere('dusk_photo_rock', { diameter: 4.8, segments: 8 }, scene);
  rock.parent = root;
  rock.position.copyFrom(DUSK.PHOTO_ROCK_POS);
  rock.scaling.set(1.25, 0.45, 0.95);
  rock.isPickable = false;
  rock.checkCollisions = false;

  const mat = new StandardMaterial('dusk_photo_rock_mat', scene);
  mat.diffuseColor = new Color3(0.32, 0.30, 0.34);
  mat.emissiveColor = new Color3(0.02, 0.01, 0.03);
  mat.specularColor = new Color3(0.10, 0.10, 0.10);
  rock.material = mat;

  return {
    dispose: () => {
      rock.dispose();
      mat.dispose();
      root.dispose();
    },
  };
}
