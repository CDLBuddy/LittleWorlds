/**
 * Forest interactables - campfire, tent, axe, logs, fishing spot
 */

export const FOREST_INTERACTABLES = [
  { id: 'campfire', type: 'campfire', position: { x: 5, y: 0, z: 5 } },
  { id: 'tent', type: 'tent', position: { x: -3, y: 0, z: 8 } },
  { id: 'axe', type: 'axe', position: { x: 2, y: 0, z: 3 } },
  { id: 'logs', type: 'logs', position: { x: 6, y: 0, z: 2 } },
  { id: 'fishing_spot', type: 'fishing_spot', position: { x: 10, y: 0, z: 0 } },
] as const;
