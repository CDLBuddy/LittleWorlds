/**
 * Pine World - Terrain Envelope
 * 
 * Creates visual-only geometry around terrain edges:
 * - Distant ground (huge plane beneath terrain)
 * - Terrain skirt (walls around perimeter to hide edges)
 * 
 * Purpose: Prevent seeing raw terrain cutoff or void when looking at edges
 */

import { Color3, MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export interface TerrainEnvelopeOptions {
  /** Size of distant ground plane (default: 2000) */
  groundSize?: number;
  /** How far below terrain to place ground (default: 10) */
  groundDepth?: number;
  /** Skirt wall height (default: 20) */
  skirtHeight?: number;
  /** Ground color (default: forest floor brown) */
  groundColor?: Color3;
  /** Skirt color (default: matches ground) */
  skirtColor?: Color3;
}

/**
 * Create terrain envelope (distant ground + perimeter skirt)
 */
export function createTerrainEnvelope(
  scene: Scene,
  bag: DisposableBag,
  mats: MaterialCache,
  sampler: TerrainSamplerWithBounds,
  options: TerrainEnvelopeOptions = {}
): void {
  const {
    groundSize = 2000,
    groundDepth = 10,
    skirtHeight = 20,
    groundColor = new Color3(0.25, 0.22, 0.18), // Forest floor brown
    skirtColor = groundColor,
  } = options;

  const bounds = sampler.bounds;

  console.log('[TerrainEnvelope] Creating envelope:', {
    groundSize,
    groundDepth,
    skirtHeight,
    bounds: {
      x: [bounds.min.x, bounds.max.x],
      z: [bounds.min.z, bounds.max.z],
    },
  });

  // --- Distant Ground ---
  const distantGround = bag.trackMesh(
    MeshBuilder.CreateGround(
      'distantGround',
      {
        width: groundSize,
        height: groundSize,
        subdivisions: 2, // Low poly
      },
      scene
    )
  );

  // Position slightly below lowest terrain point
  distantGround.position.y = bounds.min.y - groundDepth;

  // Simple material matching world palette
  const distantGroundMat = mats.get('distantGroundMat', () => {
    const mat = new StandardMaterial('distantGroundMat', scene);
    mat.diffuseColor = groundColor;
    mat.specularColor = Color3.Black();
    mat.freeze();
    return mat;
  });
  distantGround.material = distantGroundMat;

  // No collisions, no shadows
  distantGround.checkCollisions = false;
  distantGround.receiveShadows = false;
  distantGround.freezeWorldMatrix();

  // --- Terrain Skirt (4 walls around perimeter) ---
  const skirtMat = mats.get('terrainSkirtMat', () => {
    const mat = new StandardMaterial('terrainSkirtMat', scene);
    mat.diffuseColor = skirtColor;
    mat.specularColor = Color3.Black();
    mat.freeze();
    return mat;
  });

  const terrainWidth = bounds.max.x - bounds.min.x;
  const terrainDepth = bounds.max.z - bounds.min.z;

  // North wall (top, -Z)
  const northWall = bag.trackMesh(
    MeshBuilder.CreateBox(
      'skirtNorth',
      {
        width: terrainWidth + 4, // Extend slightly past corners
        height: skirtHeight,
        depth: 2, // Thin wall
      },
      scene
    )
  );
  northWall.position.set(
    (bounds.min.x + bounds.max.x) / 2, // Center X
    bounds.min.y - skirtHeight / 2, // Extend down from terrain base
    bounds.min.z - 1 // At northern edge
  );
  northWall.material = skirtMat;
  northWall.checkCollisions = false;
  northWall.receiveShadows = false;
  northWall.freezeWorldMatrix();

  // South wall (bottom, +Z)
  const southWall = bag.trackMesh(
    MeshBuilder.CreateBox(
      'skirtSouth',
      {
        width: terrainWidth + 4,
        height: skirtHeight,
        depth: 2,
      },
      scene
    )
  );
  southWall.position.set(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.min.y - skirtHeight / 2,
    bounds.max.z + 1 // At southern edge
  );
  southWall.material = skirtMat;
  southWall.checkCollisions = false;
  southWall.receiveShadows = false;
  southWall.freezeWorldMatrix();

  // West wall (left, -X)
  const westWall = bag.trackMesh(
    MeshBuilder.CreateBox(
      'skirtWest',
      {
        width: 2,
        height: skirtHeight,
        depth: terrainDepth,
      },
      scene
    )
  );
  westWall.position.set(
    bounds.min.x - 1, // At western edge
    bounds.min.y - skirtHeight / 2,
    (bounds.min.z + bounds.max.z) / 2 // Center Z
  );
  westWall.material = skirtMat;
  westWall.checkCollisions = false;
  westWall.receiveShadows = false;
  westWall.freezeWorldMatrix();

  // East wall (right, +X)
  const eastWall = bag.trackMesh(
    MeshBuilder.CreateBox(
      'skirtEast',
      {
        width: 2,
        height: skirtHeight,
        depth: terrainDepth,
      },
      scene
    )
  );
  eastWall.position.set(
    bounds.max.x + 1, // At eastern edge
    bounds.min.y - skirtHeight / 2,
    (bounds.min.z + bounds.max.z) / 2 // Center Z
  );
  eastWall.material = skirtMat;
  eastWall.checkCollisions = false;
  eastWall.receiveShadows = false;
  eastWall.freezeWorldMatrix();

  console.log('[TerrainEnvelope] Created: 1 distant ground + 4 skirt walls');
}
