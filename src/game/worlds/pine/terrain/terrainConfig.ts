/**
 * Pine World - Terrain Configuration
 * 
 * Pine Trails uses heightmap-based terrain for natural hills and slopes.
 * The heightmap provides elevation data: white = high, black = low.
 */

import type { TerrainConfig } from '../../../terrain/types';
import { PINE_TERRAIN } from '../config/constants';

/**
 * Pine terrain config using heightmap
 * 
 * Heightmap texture: public/assets/heightmaps/pine.png
 * - Grayscale image (white = maxHeight, black = minHeight)
 * - Higher subdivisions = smoother terrain (but more vertices)
 * - 128-256 subdivisions is a good balance for 90x160 terrain
 */
export const PINE_TERRAIN_CONFIG: TerrainConfig = {
  kind: 'heightmap',
  url: 'assets/heightmaps/pine.png',
  width: PINE_TERRAIN.width,
  depth: PINE_TERRAIN.depth,
  subdivisions: 200, // High detail for natural terrain
  minHeight: 0,
  maxHeight: PINE_TERRAIN.maxRise,
  y: 0,
  name: 'pine_terrain',
};
