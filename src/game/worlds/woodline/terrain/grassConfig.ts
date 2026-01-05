/**
 * Woodline World - Grass field configuration
 * Sparse grass patches around clearing, avoiding campfire area
 */

import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';
import type { ExclusionZone, GrassFieldConfig } from '@game/terrain/grass/types';

/**
 * Woodline grass configuration
 * Sparser grid (4×4) with larger spacing (20m) for forest floor feel
 */
export const WOODLINE_GRASS_CONFIG: Omit<GrassFieldConfig, 'parentName'> = {
  assetUrl: 'Summergrass.glb',
  template: {
    predicate: (m) => m.name.includes('grass') || m.name.includes('Plane'),
  },
  placement: {
    gridSize: 4,          // Smaller grid for forest clearing
    spacing: 20,          // Wider spacing (adjust 15-25m to optimize coverage)
    offset: -40,          // Center grid
    scaleY: 0.5,          // Shorter grass (50% height) for forest floor
    offsetY: 0.1,         // Raise 10cm above ground to prevent z-fighting
    jitter: {
      position: -1,        // +/- 1.5m random offset (7.5% of 20m spacing)
      rotationY: Math.PI * 2,  // Full random rotation (0-360°)
    },
  },
  zones: [
    // Campfire clearing (center)
    { kind: 'circle', centerX: 0, centerZ: 0, radius: 10 },
  ] satisfies ExclusionZone[],
  wind: {
    ...GRASS_WIND_PRESET_DEFAULT,
    // Slightly calmer wind for forest floor (sheltered)
    amplitude: 0.12,
    speed: 1.0,
  },
  debug: { log: true },
};
