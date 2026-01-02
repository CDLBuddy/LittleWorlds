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

const cloudFxUrl = (name: string) => `assets/sky/_fx/clouds/${name}`;

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

export type BillboardCloudsConfig = {
  enabled?: boolean;
  urls: string[];

  count?: number;

  radiusMin?: number;
  radiusMax?: number;

  heightMin?: number;
  heightMax?: number;

  sizeMin?: number;
  sizeMax?: number;

  alphaMin?: number;
  alphaMax?: number;

  speedMin?: number;
  speedMax?: number;

  windDir?: { x: number; z: number };

  wrap?: boolean;

  /** Soft fade-in for new clouds to avoid pops */
  fadeInSec?: number;

  /** If true, always face camera (recommended). */
  billboard?: boolean;

  brightness?: number; // default 1.35
  tint?: { r: number; g: number; b: number }; // optional, slightly bluish helps
  renderingGroupId?: number; // default 1 (after sky)
};

export type NoiseConfig = {
  enabled?: boolean;
  url: string;
  alpha?: number; // 0.02–0.05 typical
  scale?: number; // tile factor
};

/**
 * Complete visual preset for a world: sky + fog + sun + ambient
 */
export type WorldLookPreset = {
  sky?: PanoramaSkyConfig;
  fog?: FogConfig;
  sun?: SunConfig;
  ambient?: AmbientConfig;

  cloudBillboards?: BillboardCloudsConfig;
  noise?: NoiseConfig;
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
    cloudBillboards: {
      enabled: true,
      urls: [
        cloudFxUrl('cloud_01.png'),
        cloudFxUrl('cloud_02.png'),
        cloudFxUrl('cloud_03.png'),
        cloudFxUrl('cloud_04.png'),
        cloudFxUrl('cloud_05.png'),
        cloudFxUrl('cloud_06.png'),
        cloudFxUrl('cloud_07.png'),
      ],
      count: 40,
      radiusMin: 260,
      radiusMax: 780,
      heightMin: 110,
      heightMax: 190,
      sizeMin: 70,
      sizeMax: 190,
      alphaMin: 0.4,
      alphaMax: 0.8,
      speedMin: 0.5,
      speedMax: 2.0,
      windDir: { x: 1, z: 0.25 },
      wrap: true,
      fadeInSec: 0.8,
      billboard: true,
      brightness: 1.45,
      tint: { r: 1.0, g: 1.03, b: 1.08 },
      renderingGroupId: 1,
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

