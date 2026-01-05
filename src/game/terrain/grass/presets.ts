/**
 * Grass wind system - Presets
 * Predefined wind configurations for different environments
 */

import { Vector2 } from '@babylonjs/core';
import type { GrassWindPreset } from './types';

/**
 * Calm environment - minimal wind, gentle sway
 * Use for: peaceful scenes, indoor-adjacent areas
 */
export const GRASS_WIND_PRESET_CALM: GrassWindPreset = {
  enabled: true,
  windDir: new Vector2(1, 0.2), // Subtle directional bias
  amplitude: 0.08, // Minimal bend
  speed: 0.8, // Slow movement
  frequency: 0.5, // Gentle waves
  maskScale: 1.0, // Standard height masking
  debugForceMask: false,
} as const;

/**
 * Default environment - natural breeze, subtle movement
 * Use for: typical outdoor scenes, natural settings
 */
export const GRASS_WIND_PRESET_DEFAULT: GrassWindPreset = {
  enabled: true,
  windDir: new Vector2(1, 0.3), // Light diagonal wind
  amplitude: 0.15, // Moderate bend
  speed: 1.2, // Natural pace
  frequency: 0.75, // Balanced wave pattern
  maskScale: 1.2, // Slightly tighter height masking
  debugForceMask: false,
} as const;

/**
 * Windy environment - strong breeze, dramatic movement
 * Use for: stormy scenes, exposed areas, dramatic effect
 */
export const GRASS_WIND_PRESET_WINDY: GrassWindPreset = {
  enabled: true,
  windDir: new Vector2(1, 0.5), // Strong diagonal wind
  amplitude: 0.28, // Significant bend
  speed: 2.0, // Fast movement
  frequency: 1.2, // More frequent waves
  maskScale: 1.5, // Aggressive height masking
  debugForceMask: false,
} as const;
