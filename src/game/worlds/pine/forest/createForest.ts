/**
 * Pine World - Forest creation
 */

import { AbstractMesh, Matrix, Mesh, Quaternion, type Scene, SceneLoader, Vector3 } from '@babylonjs/core';
import { PINE_TERRAIN, TRAIL_HALF_WIDTH, X_MIN, X_MAX, Z_NORTH, Z_SOUTH } from '../config/constants';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { clamp, mulberry32, seededFromString } from '../utils/math';
import { scatterForestClutter } from './scatterClutter';
import {
  normalizeMeshesForThinInstances,
  computeFootOffsetY,
} from '../../../assets/thinInstances/normalizeForThinInstances';
import { findGroundedPlacement } from './treeGrounding';
import { TREE_MAX_SLOPE_DELTA } from './constants';

export interface TreePlacementData {
  relocated: Array<{ x: number; z: number; y: number }>;
  skipped: Array<{ x: number; z: number; y: number }>;
}

export function createForest(
  scene: Scene,
  bag: DisposableBag,
  mats: MaterialCache,
  sampler: TerrainSamplerWithBounds
): { meshes: AbstractMesh[]; placementData: TreePlacementData } {
  const meshes: AbstractMesh[] = [];
  const placementData: TreePlacementData = { relocated: [], skipped: [] };

  // All tree positions, rotations, and scales
  const allTrees: Array<{ x: number; z: number; scale: number; rotation: number }> = [];

  // Curated "hero" trees near points of interest
  const hero = [
    { x: -15, z: 65, scale: 0.9, rotation: 0 },
    { x: 15, z: 65, scale: 0.85, rotation: 0 },
    { x: -20, z: 40, scale: 1.0, rotation: 0 },
    { x: 20, z: 40, scale: 0.9, rotation: 0 },
    { x: -8, z: 10, scale: 0.9, rotation: 0 },
    { x: 18, z: 0, scale: 0.8, rotation: 0 },
    { x: -5, z: -20, scale: 1.1, rotation: 0 },
    { x: 10, z: -25, scale: 1.0, rotation: 0 },
    { x: 8, z: -45, scale: 0.9, rotation: 0 },
  ];

  allTrees.push(...hero);

  // Procedural forest "walls": keep the path clear, but make edges dense
  const rand = mulberry32(seededFromString('pine_forest_wall'));
  
  for (let i = 0; i < 170; i++) {
    const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);
    const corridor = TRAIL_HALF_WIDTH + 10;
    const side = rand() < 0.5 ? -1 : 1;
    const bandMin = corridor;
    const bandMax = PINE_TERRAIN.width * 0.5 - 4;
    let x = bandMin + rand() * (bandMax - bandMin);
    x *= side;
    x = clamp(x, X_MIN, X_MAX);
    
    allTrees.push({
      x,
      z,
      scale: 0.7 + rand() * 0.4,
      rotation: rand() * Math.PI * 2
    });
  }

  // ===== PHASE 6: Placement Audit + Bounds Diagnostics =====
  const b = sampler.bounds;
  let oob = 0;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

  for (const t of allTrees) {
    minX = Math.min(minX, t.x);
    maxX = Math.max(maxX, t.x);
    minZ = Math.min(minZ, t.z);
    maxZ = Math.max(maxZ, t.z);
    if (!sampler.inBounds(t.x, t.z)) oob++;
  }

  console.log('[Pine] Terrain bounds:', b.min.x, b.max.x, b.min.z, b.max.z);
  console.log('[Pine] Tree bounds:', minX, maxX, minZ, maxZ, 'OOB:', oob, '/', allTrees.length);

  // Filter out-of-bounds trees (Option A: Drop OOB trees)
  const validTrees = allTrees.filter(t => sampler.inBounds(t.x, t.z));
  if (validTrees.length !== allTrees.length) {
    console.warn(`[Pine] Dropped ${allTrees.length - validTrees.length} trees out of bounds`);
  }

  console.log('[Pine] Prepared', validTrees.length, 'valid tree positions (', allTrees.length, 'total)');

  // Load and apply thin instances to Pinetree.glb
  SceneLoader.ImportMesh('', 'assets/models/', 'Pinetree.glb', scene, (loadedMeshes: AbstractMesh[]) => {
    console.log('[Pine] Loaded Pinetree.glb, mesh count:', loadedMeshes.length);
    
    if (loadedMeshes.length === 0) {
      console.error('[Pine] No meshes in Pinetree.glb');
      return;
    }

    // 1) Normalize/bake transforms so thin instances are sane
    const parts: Mesh[] = normalizeMeshesForThinInstances(loadedMeshes);

    // OPTIONAL: dispose the original root if it exists and is empty-ish
    for (const m of loadedMeshes) {
      if (m.name === '__root__') m.dispose(false, true);
    }

    // 2) Find trunk for foot offset
    const trunk = parts.find((p) => /trunk/i.test(p.name)) ?? parts[0];
    const footOffsetY = computeFootOffsetY(trunk);

    // 3) Build matrix buffer with grounding (PHASE 9: footprint sampling)
    const matrices: Matrix[] = [];
    let placedCount = 0;
    let relocatedCount = 0;
    let skippedCount = 0;
    let worstDeltaY = 0;

    // Create per-tree RNG for relocation jitter
    const treeRand = mulberry32(seededFromString('pine_tree_grounding'));

    for (const t of validTrees) {
      const placement = findGroundedPlacement({
        sampler,
        x: t.x,
        z: t.z,
        scale: t.scale,
        rand: treeRand
      });

      if (!placement) {
        skippedCount++;
        // Track skipped position for debug overlay
        const y = sampler.heightAt(t.x, t.z);
        placementData.skipped.push({ x: t.x, z: t.z, y });
        continue; // Skip this tree
      }

      // Track relocation stats
      if (placement.reason === 'relocated') {
        relocatedCount++;
        // Track relocated position for debug overlay
        placementData.relocated.push({ x: placement.x, z: placement.z, y: placement.yBase });
      }
      placedCount++;

      // Sample footprint one more time to get deltaY for diagnostics
      // (We could return this from findGroundedPlacement if needed, but keeping it simple)
      const centerY = sampler.heightAt(placement.x, placement.z);
      const localDelta = Math.abs(placement.yBase - centerY);
      if (localDelta > worstDeltaY) worstDeltaY = localDelta;

      // PHASE 6 FIX: Scale-aware foot offset
      const scaledFoot = footOffsetY * t.scale;
      const pos = new Vector3(placement.x, placement.yBase + scaledFoot, placement.z);

      const rot = Quaternion.RotationAxis(Vector3.Up(), t.rotation);
      const scl = new Vector3(t.scale, t.scale, t.scale);

      const m = Matrix.Compose(scl, rot, pos);
      matrices.push(m);
    }

    console.log(
      `[Pine] Trees: placed=${placedCount} relocated=${relocatedCount} skipped=${skippedCount} worstDeltaY=${worstDeltaY.toFixed(3)} (threshold=${TREE_MAX_SLOPE_DELTA})`
    );

    // Convert matrices to buffer
    const buffer = new Float32Array(matrices.length * 16);
    for (let i = 0; i < matrices.length; i++) {
      matrices[i].copyToArray(buffer, i * 16);
    }

    // 4) Apply SAME buffer to every renderable part
    for (const p of parts) {
      // If any part has no geometry, skip
      if (!p.geometry) continue;

      p.thinInstanceSetBuffer('matrix', buffer, 16, true);
      p.thinInstanceRefreshBoundingInfo(true); // important for correct culling/picking
      
      bag.trackMesh(p);
      meshes.push(p);
    }

    console.log('[Pine] Created', placedCount, 'tree instances across', parts.length, 'meshes');
  }, null, (_scene: Scene, message: string, exception: any) => {
    console.error('[Pine] Failed to load Pinetree.glb:', message, exception);
  });

  // Ground clutter: stumps + fallen logs + small rocks
  scatterForestClutter(scene, bag, mats, sampler);

  return { meshes, placementData };
}
