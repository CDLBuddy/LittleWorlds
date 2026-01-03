/**
 * Pine World - Forest clutter (stumps, logs, rocks)
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial } from '@babylonjs/core';
import { PINE_TERRAIN, TRAIL_HALF_WIDTH, X_MIN, X_MAX, Z_NORTH, Z_SOUTH } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { clamp, mulberry32, seededFromString } from '../utils/math';
import { heightAtXZ } from '../utils/terrain';

export function scatterForestClutter(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  const rand = mulberry32(seededFromString('pine_clutter'));

  const stumpMat = mats.get('pineStumpMat', () => {
    const m = new StandardMaterial('pineStumpMat', scene);
    m.diffuseColor = new Color3(0.38, 0.3, 0.22);
    m.ambientColor = new Color3(0.14, 0.11, 0.08);
    m.specularColor = Color3.Black();
    return m;
  });

  const logMat = mats.get('pineLogMat', () => {
    const m = new StandardMaterial('pineLogMat', scene);
    m.diffuseColor = new Color3(0.36, 0.3, 0.24);
    m.ambientColor = new Color3(0.14, 0.12, 0.1);
    m.specularColor = Color3.Black();
    return m;
  });

  const rockMat = mats.get('pineClutterRockMat', () => {
    const m = new StandardMaterial('pineClutterRockMat', scene);
    m.diffuseColor = new Color3(0.44, 0.44, 0.42);
    m.ambientColor = new Color3(0.15, 0.15, 0.15);
    m.specularColor = Color3.Black();
    return m;
  });

  // Scatter outside trail corridor
  const corridor = TRAIL_HALF_WIDTH + 8;

  const stumps = 24;
  for (let i = 0; i < stumps; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);
    const side = rand() < 0.5 ? -1 : 1;

    const x = clamp((corridor + rand() * (PINE_TERRAIN.width * 0.5 - corridor - 2)) * side, X_MIN, X_MAX);
    const y = heightAtXZ(x, z);

    const stump = bag.trackMesh(
      MeshBuilder.CreateCylinder(`stump_${i}`, { height: 0.6 + rand() * 0.6, diameter: 0.5 + rand() * 0.6, tessellation: 10 }, scene)
    );
    stump.position.set(x, y + 0.3, z);
    stump.rotation.y = rand() * Math.PI * 2;
    stump.material = stumpMat;
    stump.receiveShadows = true;
  }

  const logs = 16;
  for (let i = 0; i < logs; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);
    const side = rand() < 0.5 ? -1 : 1;

    const x = clamp((corridor + rand() * (PINE_TERRAIN.width * 0.5 - corridor - 2)) * side, X_MIN, X_MAX);
    const y = heightAtXZ(x, z);

    const log = bag.trackMesh(
      MeshBuilder.CreateCylinder(`log_${i}`, { height: 2.2 + rand() * 2.2, diameter: 0.35 + rand() * 0.35, tessellation: 12 }, scene)
    );
    log.position.set(x, y + 0.35, z);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = rand() * Math.PI * 2;
    log.material = logMat;
    log.receiveShadows = true;
  }

  const rocks = 40;
  for (let i = 0; i < rocks; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);
    const side = rand() < 0.5 ? -1 : 1;

    const x = clamp((corridor + rand() * (PINE_TERRAIN.width * 0.5 - corridor - 2)) * side, X_MIN, X_MAX);
    const y = heightAtXZ(x, z);

    const r = bag.trackMesh(MeshBuilder.CreateSphere(`clutterRock_${i}`, { diameter: 0.3 + rand() * 0.9, segments: 8 }, scene));
    r.position.set(x, y + 0.15, z);
    r.scaling.y = 0.55 + rand() * 0.35;
    r.rotation.y = rand() * Math.PI * 2;
    r.material = rockMat;
    r.receiveShadows = true;
  }
}
