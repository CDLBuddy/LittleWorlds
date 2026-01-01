import { Color3, Vector3 } from '@babylonjs/core';

export type WorldId =
  | 'backyard'
  | 'beachfront'
  | 'creekside'
  | 'firefly'
  | 'nightstars'
  | 'pinetrails'
  | 'woodline';

/**
 * Generate stable sky texture URL for a world
 */
const skyUrl = (worldId: WorldId) => `assets/sky/${worldId}/sky.png`;

export type PanoramaSkyConfig = {
  url: string;
  rotationY?: number;
  size?: number;
  resolution?: 16 | 24 | 32;
};

export type FogConfig = {
  color: Color3;
  density: number;
};

export type SunConfig = {
  direction: Vector3;
  intensity: number;
  color: Color3;
};

export type AmbientConfig = {
  intensity: number;
  diffuse?: Color3;
  groundColor?: Color3;
};

/**
 * Complete visual preset for a world: sky + fog + sun + ambient
 */
export type WorldLookPreset = {
  sky?: PanoramaSkyConfig;
  fog?: FogConfig;
  sun?: SunConfig;
  ambient?: AmbientConfig;
};

export const SKY_PRESETS: Record<WorldId, WorldLookPreset> = {
  backyard: {
    sky: {
      url: skyUrl('backyard'),
      rotationY: Math.PI * 0.15,
      size: 1400,
      resolution: 32,
    },
    fog: {
      color: new Color3(1.0, 0.95, 0.88),
      density: 0.0005, // Very subtle warm fog
    },
    sun: {
      direction: new Vector3(-0.5, -2, -1),
      intensity: 0.9,
      color: new Color3(1.0, 0.96, 0.85), // Warm morning sun
    },
    ambient: {
      intensity: 0.7,
      diffuse: new Color3(1.0, 0.98, 0.95),
      groundColor: new Color3(0.6, 0.65, 0.5),
    },
  },

  woodline: {
    sky: {
      url: skyUrl('woodline'),
      rotationY: 0,
    },
    fog: {
      color: new Color3(0.9, 0.95, 1.0),
      density: 0.001, // Slightly hazier
    },
    sun: {
      direction: new Vector3(-1, -1.5, -0.5),
      intensity: 0.7,
      color: new Color3(1.0, 0.92, 0.8), // Later afternoon
    },
    ambient: {
      intensity: 0.5,
      diffuse: new Color3(0.95, 0.96, 1.0),
      groundColor: new Color3(0.5, 0.55, 0.45),
    },
  },

  beachfront: {
    sky: { url: skyUrl('beachfront') },
    fog: { color: new Color3(0.95, 0.98, 1.0), density: 0.0003 },
    sun: { direction: new Vector3(0, -2, -1), intensity: 1.1, color: new Color3(1, 1, 0.95) },
    ambient: { intensity: 0.8 },
  },

  creekside: {
    sky: { url: skyUrl('creekside') },
    fog: { color: new Color3(0.92, 0.96, 1.0), density: 0.0008 },
    sun: { direction: new Vector3(-0.7, -1.8, -0.8), intensity: 0.8, color: new Color3(1, 0.95, 0.88) },
    ambient: { intensity: 0.6 },
  },

  firefly: {
    sky: { url: skyUrl('firefly') },
    fog: { color: new Color3(0.3, 0.35, 0.5), density: 0.002 }, // Dusk fog
    sun: { direction: new Vector3(-1, -1, -1), intensity: 0.3, color: new Color3(0.9, 0.6, 0.4) },
    ambient: { intensity: 0.3 },
  },

  nightstars: {
    sky: { url: skyUrl('nightstars') },
    fog: { color: new Color3(0.1, 0.12, 0.2), density: 0.0015 },
    sun: { direction: new Vector3(0, -1, 0), intensity: 0.1, color: new Color3(0.7, 0.8, 1.0) }, // Moonlight
    ambient: { intensity: 0.2 },
  },

  pinetrails: {
    sky: { url: skyUrl('pinetrails') },
    fog: { color: new Color3(0.88, 0.92, 0.96), density: 0.001 },
    sun: { direction: new Vector3(-0.6, -1.5, -0.5), intensity: 0.75, color: new Color3(1, 0.94, 0.85) },
    ambient: { intensity: 0.65 },
  },
};

