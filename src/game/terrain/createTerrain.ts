/**
 * Terrain creation using Babylon.js native features
 * 
 * Supports:
 * - Flat planes (CreateGround)
 * - Heightmap-based terrain (CreateGroundFromHeightMap)
 * 
 * Future: chunked/streaming terrain can be added here
 */

import { MeshBuilder, Vector3 } from '@babylonjs/core';
import type { Scene } from '@babylonjs/core';
import type { TerrainConfig, TerrainHandle, TerrainSampler } from './types';

/**
 * Create a terrain system based on configuration
 * 
 * @param scene - Babylon scene
 * @param cfg - Terrain configuration (flat or heightmap)
 * @returns TerrainHandle with mesh, sampler, and disposal
 */
export function createTerrain(scene: Scene, cfg: TerrainConfig): TerrainHandle {
  if (cfg.kind === 'flat') {
    return createFlatTerrain(scene, cfg);
  } else {
    return createHeightmapTerrain(scene, cfg);
  }
}

/**
 * Create flat plane terrain
 */
function createFlatTerrain(
  scene: Scene,
  cfg: Extract<TerrainConfig, { kind: 'flat' }>
): TerrainHandle {
  const ground = MeshBuilder.CreateGround(
    cfg.name ?? 'ground',
    {
      width: cfg.width,
      height: cfg.depth, // Note: CreateGround uses "height" for depth
      subdivisions: 1,
    },
    scene
  );

  const yPosition = cfg.y ?? 0;
  ground.position.y = yPosition;

  // Enable collision for player walking
  ground.checkCollisions = true;

  // Trivial sampler for flat terrain (constant height, up normal)
  const sampler: TerrainSampler = {
    heightAt: (_x: number, _z: number) => yPosition,
    normalAt: (_x: number, _z: number) => Vector3.Up(),
  };

  return {
    mesh: ground,
    sampler,
    dispose: () => ground.dispose(false, true),
  };
}

/**
 * Create heightmap-based terrain
 * 
 * Uses Babylon's CreateGroundFromHeightMap which provides:
 * - Fast getHeightAtCoordinates()
 * - Fast getNormalAtCoordinates()
 * - Built-in LOD support (future)
 */
function createHeightmapTerrain(
  scene: Scene,
  cfg: Extract<TerrainConfig, { kind: 'heightmap' }>
): TerrainHandle {
  const ground = MeshBuilder.CreateGroundFromHeightMap(
    cfg.name ?? 'terrain',
    cfg.url,
    {
      width: cfg.width,
      height: cfg.depth,
      subdivisions: cfg.subdivisions,
      minHeight: cfg.minHeight,
      maxHeight: cfg.maxHeight,
    },
    scene
  );

  const yPosition = cfg.y ?? 0;
  ground.position.y = yPosition;

  // Enable collision for player walking
  ground.checkCollisions = true;

  // Use Babylon's built-in fast sampling (world coordinates)
  const sampler: TerrainSampler = {
    heightAt: (x: number, z: number) => {
      const height = ground.getHeightAtCoordinates(x, z);
      return height + yPosition;
    },
    normalAt: (x: number, z: number) => {
      return ground.getNormalAtCoordinates(x, z);
    },
  };

  return {
    mesh: ground,
    sampler,
    dispose: () => ground.dispose(false, true),
  };
}
