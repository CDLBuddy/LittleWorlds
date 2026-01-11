/**
 * Dusk World - Grass field configuration
 * Firefly Meadow with warm meadow grass
 */

import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';
import type { ExclusionZone, GrassFieldConfig } from '@game/terrain/grass/types';

/**
 * Dusk meadow grass configuration
 * Warm golden hour grass with firefly atmosphere
 */
export const DUSK_GRASS_CONFIG: Omit<GrassFieldConfig, 'parentName'> = {
  assetUrl: 'Summergrass.glb',
  template: {
    predicate: (m) => m.name.includes('grass') || m.name.includes('Plane'),
  },
  placement: {
    gridSize: 6,          // 6×6 grid for meadow
    spacing: 16,          // 16m spacing
    offset: -48,          // Center grid on meadow
    offsetY: 0.2,         // Raise 20cm to prevent z-fighting
    scaleY: 0.6,          // Medium height (60%) for meadow grass
    jitter: {
      position: 2.5,      // +/- 2.5m random offset
      rotationY: Math.PI * 2,  // Full random rotation (0-360°)
    },
  },
  zones: [
    // Exclude ancient oak area (center)
    { kind: 'circle', centerX: 0, centerZ: 0, radius: 15 },
    // Exclude linger nests (scattered areas)
    { kind: 'circle', centerX: -20, centerZ: -20, radius: 8 },
    { kind: 'circle', centerX: 20, centerZ: 20, radius: 8 },
    { kind: 'circle', centerX: -25, centerZ: 25, radius: 8 },
    { kind: 'circle', centerX: 25, centerZ: -25, radius: 8 },
  ] satisfies ExclusionZone[],
  wind: {
    ...GRASS_WIND_PRESET_DEFAULT,
    // Gentle evening breeze
    amplitude: 0.12,
    speed: 1.2,
  },
  debug: { log: true },
};
