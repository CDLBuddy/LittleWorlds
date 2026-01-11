/**
 * Beach World - Grass field configuration
 * Beach dune grass and coastal vegetation
 */

import { GRASS_WIND_PRESET_DEFAULT } from '@game/terrain/grass/presets';
import type { ExclusionZone, GrassFieldConfig } from '@game/terrain/grass/types';

/**
 * Beach grass configuration
 * Coastal dune grass with ocean breeze
 */
export const BEACH_GRASS_CONFIG: Omit<GrassFieldConfig, 'parentName'> = {
  assetUrl: 'Summergrass.glb',
  template: {
    predicate: (m) => m.name.includes('grass') || m.name.includes('Plane'),
  },
  placement: {
    gridSize: 6,          // 8×8 grid for 140×80 shoreline
    spacing: 13,        // 17.5m spacing
    offset: 0,          // Center grid on beach
    offsetY: 0.2,         // Raise 20cm to prevent z-fighting
    scaleY: 0.2,          // Shorter grass (50%) for beach dune grass
    jitter: {
      position: 2,      // +/- 2m random offset
      rotationY: Math.PI * 2,  // Full random rotation (0-360°)
    },
  },
  zones: [
    // Exclude most of the beach - only allow grass near north gate
    // Central beach area (campfire and main sand)
    { kind: 'rect', centerX: 0, centerZ: 0, width: 140, depth: 60 },
    // Ocean area (south, not walkable)
    { kind: 'rect', centerX: 0, centerZ: -55, width: 140, depth: 30 },
  ] satisfies ExclusionZone[],
  wind: {
    ...GRASS_WIND_PRESET_DEFAULT,
    // Strong ocean breeze
    amplitude: 0.18,
    speed: 1.8,
  },
  debug: { log: true },
};
