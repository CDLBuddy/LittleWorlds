// src/game/content/collections/areas/woodline.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const WOODLINE_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'woodline',
  finds: [
    // EDGE finds (2)
    { id: 'woodline_pinecone', name: 'Pinecone', icon: '🌲', hidingType: 'EDGE' },
    { id: 'woodline_stick', name: 'Walking Stick', icon: '🪵', hidingType: 'EDGE' },
    
    // UNDER finds (2)
    { id: 'woodline_bark', name: 'Tree Bark', icon: '🪵', hidingType: 'UNDER' },
    { id: 'woodline_sap', name: 'Tree Sap', icon: '💧', hidingType: 'UNDER' },
    
    // IN_ON finds (2)
    { id: 'woodline_frog', name: 'Frog', icon: '🐸', hidingType: 'IN_ON' },
    { id: 'woodline_lily', name: 'Water Lily', icon: '🪷', hidingType: 'IN_ON' },
    
    // LANDMARK finds (2)
    { id: 'woodline_geode', name: 'Geode', icon: '💎', hidingType: 'LANDMARK' },
    { id: 'woodline_moss_rock', name: 'Mossy Rock', icon: '🪨', hidingType: 'LANDMARK' },
    
    // SKILL_GATED finds (2)
    { id: 'woodline_fern', name: 'Fern Frond', icon: '🌿', hidingType: 'SKILL_GATED' },
    { id: 'woodline_berry', name: 'Wild Berry', icon: '🫐', hidingType: 'SKILL_GATED' },
  ],
  trophy: {
    id: 'woodline_trophy',
    name: 'Forest Guardian',
    icon: '🏆',
    description: 'Discovered all secrets of the woodline',
  },
  postcard: {
    id: 'woodline_postcard',
    name: 'Campfire Stories',
    sereneAction: 'Warm your hands by the campfire',
    audioKey: 'ambient_campfire_crackle',
    campUpgradeKey: 'campfire_logs',
  },
  gateHints: {
    '5/10': 'The forest reveals its wonders...',
    '10/10': 'You\'ve mastered the woodline. A creek awaits!',
  },
});
