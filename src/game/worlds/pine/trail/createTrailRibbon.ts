/**
 * Pine World - Trail ribbon creation
 */

import { Color3, Mesh, MeshBuilder, type Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { TRAIL_HALF_WIDTH, TRAIL_Y_OFFSET } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { buildSwitchbackCenterline } from './buildCenterline';
import { scatterTrailEdgeRocks } from './scatterEdgeRocks';

export function createTrailRibbon(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  const centerline = buildSwitchbackCenterline();

  // Convert centerline into left/right edges
  const left: Vector3[] = [];
  const right: Vector3[] = [];

  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    const pPrev = centerline[Math.max(0, i - 1)];
    const pNext = centerline[Math.min(centerline.length - 1, i + 1)];

    const forward = pNext.subtract(pPrev);
    forward.y = 0;
    if (forward.lengthSquared() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();

    // Perp in XZ plane
    const perp = new Vector3(-forward.z, 0, forward.x);
    perp.normalize();

    left.push(p.add(perp.scale(TRAIL_HALF_WIDTH)));
    right.push(p.add(perp.scale(-TRAIL_HALF_WIDTH)));
  }

  const ribbon = bag.trackMesh(
    MeshBuilder.CreateRibbon(
      'pine_trail_ribbon',
      {
        pathArray: [left, right],
        closeArray: false,
        closePath: false,
        updatable: false,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene
    )
  );

  ribbon.position.y += TRAIL_Y_OFFSET;
  ribbon.isPickable = false;
  ribbon.receiveShadows = true;

  const mat = mats.get('pineTrailMat', () => {
    const m = new StandardMaterial('pineTrailMat', scene);
    // Lighter "packed dirt" band so the path reads
    m.diffuseColor = new Color3(0.42, 0.36, 0.28);
    m.ambientColor = new Color3(0.22, 0.18, 0.14);
    m.specularColor = Color3.Black();
    return m;
  });

  ribbon.material = mat;

  // Add a few "berm rocks" along the trail edges to sell elevation/trench
  scatterTrailEdgeRocks(scene, bag, mats, centerline);

  return ribbon;
}
