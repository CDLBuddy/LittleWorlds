import { Vector3 } from '@babylonjs/core';

export const DUSK = {
  SIZE: 110,
  HALF: 55,
  GROUND_Y: 0,

  // Grass / meadow visuals
  PERIMETER_BAND: 14, // tall grass thickness from edges inward
  GRASS_COUNT: 900,
  FLOWER_COUNT_PER_TYPE: 55, // *5 types => 275 total (instances)

  // Landmark + POI
  OAK_POS: new Vector3(0, 0, 0),
  ENTRY_GLADE_POS: new Vector3(0, 0, 15),
  PHOTO_ROCK_POS: new Vector3(-15, 0.5, 0),
  WORKBENCH_POS: new Vector3(3, 0, -3),
  TOTEM_POS: new Vector3(0, 0, -13),

  // Gate positions - at the actual edges of the map
  NORTH_GATE_POS: new Vector3(0, 0, -52),  // North edge (negative Z)
  SOUTH_GATE_POS: new Vector3(0, 0, 52),   // South edge (positive Z)

  // Firefly cluster centers (roughly cardinal, slightly inside)
  CLUSTER_N: new Vector3(0, 1.8, -22),
  CLUSTER_E: new Vector3(22, 1.6, 0),
  CLUSTER_S: new Vector3(0, 1.6, 22),
  CLUSTER_W: new Vector3(-22, 1.6, 0),

  // Firefly counts
  FIREFLIES_PER_CLUSTER: 12, // 48 total
  FIREFLY_HEIGHT_WOBBLE: 0.45,

  // Lighting (subtle; SkySystem may already add lighting)
  SUN_DIR: new Vector3(-0.35, -1.0, 0.25), // low angle feel
  SUN_INTENSITY: 0.55,
  HEMI_INTENSITY: 0.35,

  // Fog / atmosphere
  FOG_DENSITY: 0.0022,

  // Swing
  SWING_SWAY_SPEED: 0.65,
  SWING_SWAY_AMOUNT: 0.12,

  // Firefly glow
  GLOW_INTENSITY: 0.7,
  GLOW_KERNEL: 32,

  // Light pooling: keep very small
  FIREFLY_LIGHTS: 6,
  FIREFLY_LIGHT_RANGE: 4.2,
  FIREFLY_LIGHT_INTENSITY: 0.55,
} as const;

// Prevent mutation of Vector3 constants
Object.freeze(DUSK.OAK_POS);
Object.freeze(DUSK.NORTH_GATE_POS);
Object.freeze(DUSK.SOUTH_GATE_POS);
Object.freeze(DUSK.ENTRY_GLADE_POS);
Object.freeze(DUSK.PHOTO_ROCK_POS);
Object.freeze(DUSK.WORKBENCH_POS);
Object.freeze(DUSK.TOTEM_POS);
Object.freeze(DUSK.CLUSTER_N);
Object.freeze(DUSK.CLUSTER_E);
Object.freeze(DUSK.CLUSTER_S);
Object.freeze(DUSK.CLUSTER_W);
Object.freeze(DUSK.SUN_DIR);
