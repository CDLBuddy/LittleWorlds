/**
 * Pine World - Grass field configuration
 * Forest floor grass with pine needle aesthetic
 */

import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';
import type { ExclusionZone, GrassFieldConfig } from '@game/terrain/grass/types';

/**
 * Pine forest grass configuration
 * Sparse forest floor coverage with exclusions for trail and props
 */
export const PINE_GRASS_CONFIG: Omit<GrassFieldConfig, 'parentName'> = {
  assetUrl: 'Summergrass.glb',
  template: {
    predicate: (m) => m.name.includes('grass') || m.name.includes('Plane'),
  },
  placement: {
    gridSize: 5,          // 5×5 grid for forest floor
    spacing: 18,          // 18m spacing (adjust based on coverage)
    offset: -45,          // Center grid on pine forest
    scaleY: 0.4,          // Shorter grass (40% height) for pine needle floor
    // offsetY removed: terrain conforming handles Y positioning
    jitter: {
      position: 3,        // +/- 3m random offset (~17% of 18m spacing)
      rotationY: Math.PI * 2,  // Full random rotation (0-360°)
    },
  },
  zones: [
    // Exclude main trail path (center)
    { kind: 'rect', centerX: 0, centerZ: 0, width: 15, depth: 100 },
    // Exclude pine bough hut area (north)
    { kind: 'circle', centerX: 0, centerZ: -30, radius: 12 },
    // Exclude rocky outcrop area (south)
    { kind: 'circle', centerX: 15, centerZ: 30, radius: 10 },
  ] satisfies ExclusionZone[],
  wind: {
    ...GRASS_WIND_PRESET_DEFAULT,
    // Very calm wind (sheltered by dense pines)
    amplitude: 0.08,
    speed: 0.8,
  },
  debug: { log: true },
};
