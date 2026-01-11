/**
 * Shared terrain system types
 * 
 * Provides a unified API for different terrain implementations:
 * - Flat planes (simple worlds)
 * - Heightmap-based terrain (hills, slopes)
 * - Future: chunked/streaming terrain
 */

import type { AbstractMesh, Vector3 } from '@babylonjs/core';

/**
 * Terrain implementation type
 */
export type TerrainKind = 'flat' | 'heightmap';

/**
 * Configuration for flat terrain (simple plane)
 */
export interface FlatTerrainConfig {
  kind: 'flat';
  width: number;
  depth: number;
  y?: number;
  name?: string;
}

/**
 * Configuration for heightmap-based terrain
 */
export interface HeightmapTerrainConfig {
  kind: 'heightmap';
  url: string;          // e.g. "assets/heightmaps/pine.png"
  width: number;
  depth: number;
  subdivisions: number; // 128–256 is a good range to start
  minHeight: number;
  maxHeight: number;
  y?: number;
  name?: string;
}

/**
 * Union type for all terrain configurations
 */
export type TerrainConfig = FlatTerrainConfig | HeightmapTerrainConfig;

/**
 * Terrain sampler with bounds checking
 * Re-export from terrainSampler to avoid circular dependencies
 */
export type { TerrainSamplerWithBounds } from './terrainSampler';

/**
 * Fast terrain sampling interface
 * 
 * Allows player controllers, grass systems, etc. to query terrain
 * without caring about the underlying implementation.
 */
export interface TerrainSampler {
  /**
   * Get terrain height at world coordinates
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Height (Y) at that position
   */
  heightAt(x: number, z: number): number;

  /**
   * Get terrain normal at world coordinates
   * @param x - World X coordinate
   * @param z - World Z coordinate
   * @returns Normal vector at that position
   */
  normalAt(x: number, z: number): Vector3;
}

/**
 * Handle to a created terrain system
 * 
 * Worlds receive this from createTerrain() and can:
 * - Access the mesh for rendering/collision
 * - Use the sampler for height queries
 * - Dispose when world unloads
 */
export interface TerrainHandle {
  /** The terrain mesh (for rendering, collision, materials) */
  mesh: AbstractMesh;
  
  /** Fast sampling API for height/normal queries */
  sampler: TerrainSampler;
  
  /** Cleanup function */
  dispose(): void;
}
