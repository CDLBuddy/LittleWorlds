/**
 * Pine World - Forest creation
 */

import { type AbstractMesh, Color3, type Scene, Vector3 } from '@babylonjs/core';
import { PINE_TERRAIN, TRAIL_HALF_WIDTH, X_MIN, X_MAX, Z_NORTH, Z_SOUTH } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { clamp, mulberry32, seededFromString } from '../utils/math';
import { heightAtXZ } from '../utils/terrain';
import { createPineTree } from './createTree';
import { mkMat } from './materials';
import { scatterForestClutter } from './scatterClutter';

export function createForest(scene: Scene, bag: DisposableBag, mats: MaterialCache) {
  const meshes: AbstractMesh[] = [];

  // Shared materials by type
  const trunkMats = {
    whitePine: mats.get('trunk_whitePine', () => mkMat(scene, new Color3(0.45, 0.4, 0.35), 'trunk_whitePine')),
    redPine: mats.get('trunk_redPine', () => mkMat(scene, new Color3(0.5, 0.3, 0.25), 'trunk_redPine')),
    spruce: mats.get('trunk_spruce', () => mkMat(scene, new Color3(0.35, 0.3, 0.28), 'trunk_spruce')),
    hemlock: mats.get('trunk_hemlock', () => mkMat(scene, new Color3(0.4, 0.35, 0.32), 'trunk_hemlock')),
  };

  const canopyMats = {
    whitePine: mats.get('canopy_whitePine', () => mkMat(scene, new Color3(0.2, 0.35, 0.25), 'canopy_whitePine')),
    redPine: mats.get('canopy_redPine', () => mkMat(scene, new Color3(0.15, 0.3, 0.2), 'canopy_redPine')),
    spruce: mats.get('canopy_spruce', () => mkMat(scene, new Color3(0.12, 0.25, 0.18), 'canopy_spruce')),
    hemlock: mats.get('canopy_hemlock', () => mkMat(scene, new Color3(0.18, 0.32, 0.22), 'canopy_hemlock')),
  };

  // Curated "hero" trees near points of interest (readable layout)
  const hero = [
    { x: -15, z: 65, type: 'whitePine', h: 18 },
    { x: 15, z: 65, type: 'redPine', h: 16 },
    { x: -20, z: 40, type: 'whitePine', h: 20 },
    { x: 20, z: 40, type: 'redPine', h: 17 },
    { x: -8, z: 10, type: 'spruce', h: 18 }, // "sap area" placeholder
    { x: 18, z: 0, type: 'hemlock', h: 15 }, // overlook frame
    { x: -5, z: -20, type: 'whitePine', h: 22 },
    { x: 10, z: -25, type: 'redPine', h: 19 },
    { x: 8, z: -45, type: 'spruce', h: 18 },
  ] as const;

  for (const t of hero) {
    const y = heightAtXZ(t.x, t.z);
    meshes.push(
      ...createPineTree(
        scene,
        bag,
        new Vector3(t.x, y, t.z),
        t.type,
        t.h,
        trunkMats[t.type],
        canopyMats[t.type]
      )
    );
  }

  // Procedural forest "walls": keep the path clear, but make edges dense
  const rand = mulberry32(seededFromString('pine_forest_wall'));
  const total = 170;

  for (let i = 0; i < total; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);

    // Exclude trail corridor so player can see
    const corridor = TRAIL_HALF_WIDTH + 10;

    // pick left or right band
    const side = rand() < 0.5 ? -1 : 1;

    // forest band starts outside corridor and extends to edge
    const bandMin = corridor;
    const bandMax = PINE_TERRAIN.width * 0.5 - 4;

    let x = bandMin + rand() * (bandMax - bandMin);
    x *= side;

    x = clamp(x, X_MIN, X_MAX);

    const y = heightAtXZ(x, z);

    const roll = rand();
    const type = roll < 0.35 ? 'spruce' : roll < 0.65 ? 'whitePine' : roll < 0.85 ? 'redPine' : 'hemlock';

    const h = 14 + rand() * 10;

    const tree = createPineTree(
      scene,
      bag,
      new Vector3(x, y, z),
      type,
      h,
      trunkMats[type],
      canopyMats[type]
    );

    // add mild lean & rotation variety
    for (const m of tree) {
      m.rotation.y += (rand() - 0.5) * 0.6;
      m.rotation.z += (rand() - 0.5) * 0.05;
    }

    meshes.push(...tree);
  }

  // Ground clutter: stumps + fallen logs + small rocks (sells "forest floor")
  scatterForestClutter(scene, bag, mats);

  return meshes;
}
