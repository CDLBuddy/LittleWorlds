/**
 * Pine World - Terrain and world constants
 */

export const WORLD_ID = 'pinetrails' as const;

export const PINE_TERRAIN = {
  width: 90,
  depth: 160,
  halfDepth: 80,   // depth / 2
  maxRise: 12,     // 0 → +12
  playerYOffset: 0.9,
} as const;

// Coordinate convention used throughout helpers
export const Z_NORTH = -PINE_TERRAIN.halfDepth;
export const Z_SOUTH = PINE_TERRAIN.halfDepth;

// Keep trees/props inside terrain bounds
export const X_MIN = -PINE_TERRAIN.width * 0.5 + 2;
export const X_MAX = PINE_TERRAIN.width * 0.5 - 2;

export const TRAIL_HALF_WIDTH = 5.5; // visual trail ribbon width / 2
export const TRAIL_Y_OFFSET = 0.06; // prevent z-fighting against terrain
