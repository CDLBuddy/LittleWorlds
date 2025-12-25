/**
 * Forest layout - spawn points, zones, paths
 */

import { Vector3 } from '@babylonjs/core';

export const SPAWN_POINTS = {
  player: new Vector3(0, 0, 0),
  companion: new Vector3(2, 0, 0),
  campfire: new Vector3(5, 0, 5),
  tent: new Vector3(-3, 0, 8),
} as const;

export const ZONES = {
  creek: { center: new Vector3(10, 0, 0), radius: 5 },
  clearing: { center: new Vector3(0, 0, 0), radius: 8 },
  woods: { center: new Vector3(-8, 0, -8), radius: 6 },
} as const;
