/**
 * Grass wind system - Type definitions
 * Shared types for grass wind animation plugin
 */

import type { Vector2, Vector3, AbstractMesh, TransformNode, AssetContainer } from '@babylonjs/core';

/**
 * Configuration options for grass wind animation
 */
export type GrassWindOptions = {
  /** Enable/disable wind animation */
  enabled?: boolean;
  /** Wind direction vector (x, z) - will be normalized by plugin */
  windDir?: Vector2;
  /** Bend amount in world units - higher = more dramatic movement */
  amplitude?: number;
  /** Animation speed multiplier - higher = faster movement */
  speed?: number;
  /** Wave frequency - higher = more waves across the grass */
  frequency?: number;
  /** Height-based mask scale for fallback masking (when no vertex colors) */
  maskScale?: number;
  /** Force full mask to all vertices (DEV debugging only) */
  debugForceMask?: boolean;
};

/**
 * Complete preset configuration for grass wind
 * All runtime-required properties defined
 */
export type GrassWindPreset = Required<Pick<GrassWindOptions, 
  'enabled' | 'windDir' | 'amplitude' | 'speed' | 'frequency' | 'maskScale'
>> & Partial<Pick<GrassWindOptions, 'debugForceMask'>>;

// ============================================================================
// Phase B: Grass Field Factory Types
// ============================================================================

/**
 * Exclusion zone definition for grass placement
 * Areas where grass should not be spawned
 */
export type ExclusionZone =
  | { kind: 'rect'; centerX: number; centerZ: number; width: number; depth: number }
  | { kind: 'circle'; centerX: number; centerZ: number; radius: number }
  | { kind: 'corridor'; points: { x: number; z: number }[]; width: number };

// ============================================================================
// Phase D: Terrain Conforming Types
// ============================================================================

/**
 * Terrain height function
 * Returns Y elevation at given (x, z) world position
 */
export type TerrainHeightFn = (x: number, z: number) => number;

/**
 * Terrain normal function
 * Returns surface normal vector at given (x, z) world position
 */
export type TerrainNormalFn = (x: number, z: number) => Vector3;

/**
 * Terrain conforming configuration for grass placement
 * Allows grass to snap to terrain height and align with terrain normal
 */
export type GrassTerrainConform =
  | { mode: 'none' }
  | {
      mode: 'heightFn';
      /** Function returning terrain height at (x, z) */
      heightAt: TerrainHeightFn;
      /** Optional function returning terrain normal at (x, z). If omitted, derives from heightAt. */
      normalAt?: TerrainNormalFn;
      /** Epsilon for normal derivation via central differences (default: 0.5) */
      sampleEps?: number;
      /** Whether to align grass to terrain normal (default: true) */
      alignToNormal?: boolean;
      /** Y-axis offset to apply after sampling terrain height (default: 0) */
      yOffset?: number;
      /** Maximum tilt angle in degrees (default: undefined = no clamp) */
      maxTiltDeg?: number;
      /** Normal blend factor 0..1 (default: 1 = full normal, 0 = vertical) */
      normalBlend?: number;
    }
  | {
      mode: 'raycast';
      /** Ground mesh to raycast against */
      ground: AbstractMesh;
      /** Starting Y position for raycasts (default: 50) */
      rayStartY?: number;
      /** Maximum raycast length (default: 200) */
      rayLength?: number;
      /** Whether to align grass to terrain normal (default: true) */
      alignToNormal?: boolean;
      /** Y-axis offset to apply after sampling terrain height (default: 0) */
      yOffset?: number;
      /** Maximum tilt angle in degrees (default: undefined = no clamp) */
      maxTiltDeg?: number;
      /** Normal blend factor 0..1 (default: 1 = full normal, 0 = vertical) */
      normalBlend?: number;
    };

// ============================================================================
// Phase E: Authoring Toolkit Types
// ============================================================================

/**
 * Random number generation configuration for deterministic placement
 */
export type GrassRandomConfig = {
  /** Seed for deterministic RNG (number or string) */
  seed?: number | string;
};

/**
 * Jitter configuration for organic grass variation
 * All jitter is applied deterministically when random seed is provided
 */
export type GrassJitter = {
  /** Position jitter in XZ plane (Phase E format or legacy number) */
  position?: { xz: number } | number;
  /** Y-rotation jitter (Phase E format or legacy number) */
  rotationY?: { rad: number } | number;
  /** Uniform scale jitter */
  scale?: { min: number; max: number };
};

/**
 * Budget controls for grass density and instance count
 */
export type GrassBudget = {
  /** Density factor 0..1 (default: 1 = full density) */
  density?: number;
  /** Maximum number of instances (hard cap) */
  maxInstances?: number;
};

/**
 * Grid-based placement configuration for grass instances
 */
export type GrassGridPlacement = {
  /** Grid size (NxN) */
  gridSize: number;
  /** Spacing between instances in meters */
  spacing: number;
  /** World offset for grid origin (applied to both X and Z) */
  offset?: number;
  /** Y-axis scaling factor for instances (e.g., 0.6 for 60% height) */
  scaleY?: number;
  /** Y-axis offset in meters (default: 0). Set to 0.01-0.02 to prevent z-fighting with ground plane */
  offsetY?: number;
  /** Optional global Y-rotation in radians */
  rotationY?: number;
  /** Phase E: Jitter/randomization configuration */
  jitter?: GrassJitter;
  /** Phase E: Random number generator configuration */
  random?: GrassRandomConfig;
};

/**
 * Configuration for createGrassField factory
 */
export type GrassFieldConfig = {
  /** Asset URL to load (passed to loadContainer) */
  assetUrl: string;
  /** Template mesh resolution strategy */
  template?: {
    /** Exact mesh name to search for */
    meshName?: string;
    /** Custom predicate to find template mesh */
    predicate?: (m: AbstractMesh) => boolean;
  };
  /** Grid placement configuration */
  placement: GrassGridPlacement;
  /** Exclusion zones where grass should not spawn */
  zones?: ExclusionZone[];
  /** Wind animation configuration */
  wind?: GrassWindOptions;
  /** Terrain conforming configuration (optional, default: no conforming) */
  terrain?: GrassTerrainConform;
  /** Phase E: Budget controls for density and instance count */
  budget?: GrassBudget;
  /** Parent TransformNode name */
  parentName?: string;
  /** Debug options */
  debug?: { log?: boolean };
};

/**
 * Result from createGrassField factory
 */
export type GrassFieldResult = {
  /** Parent TransformNode containing all instances */
  parent: TransformNode;
  /** Array of grass instance meshes */
  instances: AbstractMesh[];
  /** Template mesh (disabled, used for instancing) */
  templateMesh: AbstractMesh;
  /** Loaded AssetContainer (caller owns disposal) */
  container: AssetContainer;
};
