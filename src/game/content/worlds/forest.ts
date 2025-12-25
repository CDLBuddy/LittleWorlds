/**
 * Forest world content definition
 */

export const FOREST_CONTENT = {
  id: 'forest',
  name: 'Forest Adventure',
  description: 'A cozy forest to explore',
  
  spawnPoint: { x: 0, y: 0, z: 0 },
  
  interactables: [
    { id: 'campfire_1', type: 'campfire', position: { x: 5, y: 0, z: 5 } },
    { id: 'tent_1', type: 'tent', position: { x: -3, y: 0, z: 8 } },
    { id: 'axe_1', type: 'axe', position: { x: 2, y: 0, z: 3 } },
    { id: 'logs_1', type: 'logs', position: { x: 6, y: 0, z: 2 } },
  ],
  
  collectibles: [
    { id: 'stick_1', type: 'stick', position: { x: 1, y: 0, z: 1 } },
    { id: 'stone_1', type: 'stone', position: { x: -2, y: 0, z: 4 } },
  ],
  
  ambienceZones: [
    { sound: 'amb_birds', position: { x: -8, y: 0, z: -8 }, radius: 10 },
    { sound: 'amb_creek', position: { x: 10, y: 0, z: 0 }, radius: 8 },
  ],
} as const;
