/**
 * Pine World - Trail edge rocks
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { TRAIL_HALF_WIDTH, X_MIN, X_MAX } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { mulberry32, seededFromString } from '../utils/math';
import { heightAtXZ } from '../utils/terrain';

export function scatterTrailEdgeRocks(
  scene: Scene,
  bag: DisposableBag,
  mats: MaterialCache,
  centerline: Vector3[]
) {
  const rand = mulberry32(seededFromString('pine_trail_rocks'));

  const rockMat = mats.get('pineRockMat', () => {
    const m = new StandardMaterial('pineRockMat', scene);
    m.diffuseColor = new Color3(0.46, 0.46, 0.44);
    m.ambientColor = new Color3(0.16, 0.16, 0.16);
    m.specularColor = Color3.Black();
    return m;
  });

  const count = 36;
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rand() * centerline.length);
    const p = centerline[idx];

    // random offset near edges
    const side = rand() < 0.5 ? -1 : 1;
    const x = p.x + side * (TRAIL_HALF_WIDTH + 1.5 + rand() * 3.2);
    const z = p.z + (rand() - 0.5) * 2.0;

    if (x < X_MIN || x > X_MAX) continue;

    const y = heightAtXZ(x, z);

    const rock = bag.trackMesh(
      MeshBuilder.CreateSphere(`trail_rock_${i}`, { diameter: 0.6 + rand() * 1.3, segments: 8 }, scene)
    );
    rock.position.set(x, y + 0.18, z);
    rock.scaling.y = 0.55 + rand() * 0.35;
    rock.rotation.y = rand() * Math.PI * 2;
    rock.material = rockMat;
    rock.receiveShadows = true;
  }
}
