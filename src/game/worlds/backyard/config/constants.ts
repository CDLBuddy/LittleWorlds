/**
 * Backyard World - Constants and configuration
 */

import { Vector3, Color3 } from '@babylonjs/core';
import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';

// === TERRAIN ===
export const BACKYARD_TERRAIN = {
  groundWidth: 80,
  groundHeight: 80,
} as const;

// === GRASS ===
export const GRASS_CONFIG = {
  gridSize: 6,
  spacing: 13,  // Adjust 10-16m to optimize coverage (eliminate gaps/overlaps)
  offset: -40,
  scaleY: 0.6, // Reduce grass height to 60%
  jitter: {
    position: 2,  // +/- 2m random offset (15% of 13m spacing)
    rotationY: Math.PI * 2,  // Full random rotation (0-360°)
  },
} as const;

// Grass wind animation settings (extends shared DEFAULT preset with Backyard-specific tuning)
export const GRASS_WIND_CONFIG = {
  ...GRASS_WIND_PRESET_DEFAULT,
  // Backyard-specific overrides:
  maskScale: 2.0, // Adjusted for scaleY: 0.6 grass scaling
} as const;

// Exclusion zones for structures (no grass)
export const GRASS_EXCLUSION_ZONES = [
  // House at (0, 0, 32)
  { centerX: 0, centerZ: 32, width: 20, depth: 12 },
  // Sandbox - aligned with grass grid at (-7.5, 5.5)
  { centerX: -7.5, centerZ: 5.5, width: 5, depth: 5 },
  // Garden at (-15, -18)
  { centerX: -15, centerZ: -18, width: 6, depth: 4 },
] as const;

// === MODEL POSITIONS ===
export const HOUSE_POSITION = new Vector3(0, 0, 32);

export const TREE_POSITIONS = [
  { pos: new Vector3(-20, 0, 20), scale: 1.2 },
  { pos: new Vector3(18, 0, 18), scale: 1.0 },
  { pos: new Vector3(-22, 0, -10), scale: 1.3 },
  { pos: new Vector3(22, 0, -8), scale: 1.4 }, // Tree with tire swing
] as const;

// === PROPS ===
export const TIRE_SWING_POSITION = new Vector3(22, 0, -8);
export const SANDBOX_POSITION = new Vector3(-7.5, 0.15, 5.5);
export const GARDEN_POSITION = new Vector3(-15, 0.1, -18);

// === COLORS ===
export const COLORS = {
  ground: new Color3(0.45, 0.65, 0.35), // Grass green
  fence: new Color3(0.95, 0.95, 0.95), // White picket
  sand: new Color3(0.95, 0.85, 0.6),
  sandboxBorder: new Color3(0.5, 0.35, 0.2), // Wood
  garden: new Color3(0.3, 0.2, 0.15), // Dirt
  rope: new Color3(0.6, 0.5, 0.4),
  tire: new Color3(0.1, 0.1, 0.1), // Black
} as const;

// === FENCE ===
export const FENCE_CONFIG = {
  height: 1.5,
  picketWidth: 0.08,
  picketDepth: 0.05,
  picketSpacing: 0.15,
  railHeight: 0.08,
} as const;

export const FENCE_SECTIONS = [
  { name: 'frontFence', position: new Vector3(0, 0, 30), width: 60, depth: 0.1 },
  { name: 'leftFence', position: new Vector3(-30, 0, 0), width: 0.1, depth: 60 },
  { name: 'rightFence', position: new Vector3(30, 0, 0), width: 0.1, depth: 60 },
  { name: 'backLeftFence', position: new Vector3(-17.5, 0, -30), width: 25, depth: 0.1 },
  { name: 'backRightFence', position: new Vector3(17.5, 0, -30), width: 25, depth: 0.1 },
] as const;
