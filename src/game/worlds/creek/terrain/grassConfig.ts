/**
 * Creek World - Grass field configuration
 * Narrow corridor grass along banks (100×140 area)
 */

import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';
import type { ExclusionZone, GrassFieldConfig } from '@game/terrain/grass/types';

/**
 * Creek grass configuration
 * Grass along banks only (not in water), 5×7 grid covering corridor
 */
export const CREEK_GRASS_CONFIG: Omit<GrassFieldConfig, 'parentName'> = {
  assetUrl: 'Summergrass.glb',
  template: {
    predicate: (m) => m.name.includes('grass') || m.name.includes('Plane'),
  },
  placement: {
    gridSize: 5,          // 5×5 grid for narrow corridor
    spacing: 20,          // 20m spacing (banks are 20m wide each)
    offset: -50,          // Center on creek corridor
    scaleY: 0.6,          // Standard grass height
    offsetY: 0.1,         // Raise above ground to prevent z-fighting
    jitter: {
      position: 3,        // +/- 3m random offset (15% of 20m spacing)
      rotationY: Math.PI * 2,  // Full random rotation (0-360°)
    },
  },
  zones: [
    // Exclude center water area (creek bed -15 to 15 x)
    { kind: 'rect', centerX: 0, centerZ: 0, width: 30, depth: 140 },
    // Exclude stepping stones area at north entry
    { kind: 'circle', centerX: 0, centerZ: 15, radius: 12 },
    // Exclude filter station area (south)
    { kind: 'circle', centerX: 0, centerZ: -50, radius: 15 },
  ] satisfies ExclusionZone[],
  wind: {
    ...GRASS_WIND_PRESET_DEFAULT,
    // Slightly breezier near water
    amplitude: 0.18,
    speed: 1.3,
  },
  debug: { log: true },
};
