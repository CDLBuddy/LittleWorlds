// src/game/content/collections/areas/pine.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const PINE_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'pine',
  finds: [
    { id: 'pine_cone', name: 'Giant Pinecone', icon: '🌲', hidingType: 'EDGE' },
    { id: 'pine_needle', name: 'Pine Needles', icon: '🌿', hidingType: 'EDGE' },
    { id: 'pine_burrow', name: 'Rabbit Burrow', icon: '🐇', hidingType: 'UNDER' },
    { id: 'pine_root', name: 'Twisted Root', icon: '🪵', hidingType: 'UNDER' },
    { id: 'pine_stump', name: 'Hollow Stump', icon: '🪵', hidingType: 'IN_ON' },
    { id: 'pine_woodpecker', name: 'Woodpecker Hole', icon: '🕳️', hidingType: 'IN_ON' },
    { id: 'pine_boulder', name: 'Trailside Boulder', icon: '🪨', hidingType: 'LANDMARK' },
    { id: 'pine_clearing', name: 'Forest Clearing', icon: '☀️', hidingType: 'LANDMARK' },
    { id: 'pine_bark_axe', name: 'Bark Shard', icon: '🪓', hidingType: 'SKILL_GATED' },
    { id: 'pine_resin', name: 'Pine Resin', icon: '💧', hidingType: 'SKILL_GATED' },
  ],
  trophy: { 
    id: 'pine_trophy', 
    name: 'Pine Trail Pioneer', 
    icon: '🏆', 
    description: 'Explored every inch of the pine trails' 
  },
  postcard: { 
    id: 'pine_postcard', 
    name: 'Trailhead View', 
    sereneAction: 'Rest on the fallen log', 
    audioKey: 'ambient_pine_wind', 
    campUpgradeKey: 'axe_sharpener' 
  },
  gateHints: { 
    '5/10': 'The pines whisper their secrets...', 
    '10/10': 'Pine trails conquered! Dusk awaits your arrival.' 
  },
});
