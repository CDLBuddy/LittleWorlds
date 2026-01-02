// src/game/content/collections/areas/creekside.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const CREEKSIDE_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'creek',
  finds: [
    { id: 'creek_pebble', name: 'River Pebble', icon: '🪨', hidingType: 'EDGE' },
    { id: 'creek_footprint', name: 'Animal Track', icon: '🐾', hidingType: 'EDGE' },
    { id: 'creek_willow', name: 'Willow Branch', icon: '🌿', hidingType: 'UNDER' },
    { id: 'creek_bird_nest', name: 'Bird Nest', icon: '🪹', hidingType: 'UNDER' },
    { id: 'creek_minnow', name: 'Minnow', icon: '🐟', hidingType: 'IN_ON' },
    { id: 'creek_dragonfly', name: 'Dragonfly', icon: '🦋', hidingType: 'IN_ON' },
    { id: 'creek_shale', name: 'Shale', icon: '🪨', hidingType: 'LANDMARK' },
    { id: 'creek_river_rock', name: 'River Rock', icon: '🪨', hidingType: 'LANDMARK' },
    { id: 'creek_cattail', name: 'Cattail', icon: '🌾', hidingType: 'SKILL_GATED' },
    { id: 'creek_moss', name: 'Moss Clump', icon: '🌿', hidingType: 'SKILL_GATED' },
  ],
  trophy: { id: 'creek_trophy', name: 'Creek Explorer', icon: '🏆', description: 'Mastered the creek' },
  postcard: { id: 'creek_postcard', name: 'Creek Sounds', sereneAction: 'Listen to flowing water', audioKey: 'ambient_creek', campUpgradeKey: 'fishing_rod' },
  gateHints: { '5/10': 'The creek reveals its secrets...', '10/10': 'Creek mastered! Pine trails call.' },
});
