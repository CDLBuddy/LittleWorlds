// src/game/content/collections/areas/night.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const NIGHT_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'night',
  finds: [
    { id: 'night_constellation', name: 'Star Chart', icon: '⭐', hidingType: 'EDGE' },
    { id: 'night_meteor', name: 'Meteor Fragment', icon: '☄️', hidingType: 'EDGE' },
    { id: 'night_bat', name: 'Bat Wing Print', icon: '🦇', hidingType: 'UNDER' },
    { id: 'night_moonstone', name: 'Moonstone', icon: '🌙', hidingType: 'UNDER' },
    { id: 'night_telescope', name: 'Old Telescope', icon: '🔭', hidingType: 'IN_ON' },
    { id: 'night_compass', name: 'Star Compass', icon: '🧭', hidingType: 'IN_ON' },
    { id: 'night_hilltop', name: 'Stargazing Hill', icon: '⛰️', hidingType: 'LANDMARK' },
    { id: 'night_campfire', name: 'Night Campfire', icon: '🔥', hidingType: 'LANDMARK' },
    { id: 'night_rare_stone', name: 'Astral Geode', icon: '💠', hidingType: 'SKILL_GATED' },
    { id: 'night_night_flower', name: 'Moon Flower', icon: '🌺', hidingType: 'SKILL_GATED' },
  ],
  trophy: { 
    id: 'night_trophy', 
    name: 'Stargazer', 
    icon: '🏆', 
    description: 'Discovered all wonders under the night sky' 
  },
  postcard: { 
    id: 'night_postcard', 
    name: 'Milky Way', 
    sereneAction: 'Lie on the grass and watch the stars', 
    audioKey: 'ambient_night_quiet', 
    campUpgradeKey: 'star_chart' 
  },
  gateHints: { 
    '5/10': 'The stars guide your search...', 
    '10/10': 'Night sky mastered! The beach awaits at dawn.' 
  },
});
