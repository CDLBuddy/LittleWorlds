/**
 * Forest ambience - birds/creek zones, wind, day tint
 */

export const AMBIENCE_ZONES = [
  {
    id: 'birds',
    sound: 'amb_birds',
    position: { x: -8, y: 0, z: -8 },
    radius: 10,
    volume: 0.5,
  },
  {
    id: 'creek',
    sound: 'amb_creek',
    position: { x: 10, y: 0, z: 0 },
    radius: 8,
    volume: 0.7,
  },
] as const;

export const WIND_CONFIG = {
  enabled: true,
  strength: 0.3,
  variability: 0.2,
} as const;
