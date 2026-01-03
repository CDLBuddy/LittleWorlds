/**
 * Pine World - Rocky outcrop prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, type Vector3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { mulberry32, seededFromString } from '../utils/math';
import { heightAtXZ } from '../utils/terrain';

export function createRockyOutcrop(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vector3) {
  const rockMat = mats.get('pineOutcropRockMat', () => {
    const m = new StandardMaterial('pineOutcropRockMat', scene);
    m.diffuseColor = new Color3(0.45, 0.45, 0.42);
    m.ambientColor = new Color3(0.16, 0.16, 0.16);
    m.specularColor = Color3.Black();
    return m;
  });

  const rand = mulberry32(seededFromString('pine_outcrop'));
  for (let i = 0; i < 7; i++) {
    const d = 2.0 + rand() * 2.4;
    const rock = bag.trackMesh(MeshBuilder.CreateSphere(`overlook_rock_${i}`, { diameter: d, segments: 8 }, scene));

    const x = position.x + (rand() - 0.5) * 10;
    const z = position.z + (rand() - 0.5) * 10;
    const y = heightAtXZ(x, z);

    rock.position.set(x, y - 0.2 + rand() * 0.3, z);
    rock.scaling.y = 0.52 + rand() * 0.35;
    rock.rotation.y = rand() * Math.PI * 2;
    rock.material = rockMat;
    rock.receiveShadows = true;
  }
}
