/**
 * Night World - Grass field configuration
 * Starlit clearing with moon-silvered grass
 */

import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';
import type { ExclusionZone, GrassFieldConfig } from '@game/terrain/grass/types';

/**
 * Night clearing grass configuration
 * Dark grass with moonlight highlights
 */
export const NIGHT_GRASS_CONFIG: Omit<GrassFieldConfig, 'parentName'> = {
  assetUrl: 'grass_circle_night.glb',
  template: {
    predicate: (m) => m.name.includes('grass_circle_night') || m.name.includes('Cubo'),
  },
  placement: {
    gridSize: 8,          // 8×8 grid for better circular coverage
    spacing: 15,          // 15m spacing (tighter for circles)
    offset: -60,          // Center grid on clearing
    scaleY: 0.5,          // Shorter grass (50%) for night clearing
    jitter: {
      position: 3,        // +/- 3m random offset
      rotationY: Math.PI * 2,  // Full random rotation (0-360°)
    },
  },
  zones: [
    // Exclude stargazing stone (center)
    { kind: 'circle', centerX: 0, centerZ: 0, radius: 8 },
    // Exclude moon flower grove
    { kind: 'circle', centerX: -15, centerZ: 5, radius: 8 },
    // Exclude owl tree
    { kind: 'circle', centerX: 10, centerZ: -8, radius: 8 },
    // Exclude echo pool
    { kind: 'circle', centerX: 8, centerZ: 8, radius: 8 },
  ] satisfies ExclusionZone[],
  wind: {
    ...GRASS_WIND_PRESET_DEFAULT,
    // Very gentle night breeze
    amplitude: 0.06,
    speed: 0.6,
  },
  debug: { log: true },
};
