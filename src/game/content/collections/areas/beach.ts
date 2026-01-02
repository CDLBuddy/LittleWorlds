// src/game/content/collections/areas/beach.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const BEACH_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'beach',
  finds: [
    { id: 'beach_shell', name: 'Conch Shell', icon: '🐚', hidingType: 'EDGE' },
    { id: 'beach_driftwood', name: 'Driftwood', icon: '🪵', hidingType: 'EDGE' },
    { id: 'beach_crab', name: 'Hermit Crab', icon: '🦀', hidingType: 'UNDER' },
    { id: 'beach_seaweed', name: 'Seaweed', icon: '🌿', hidingType: 'UNDER' },
    { id: 'beach_tidepool', name: 'Starfish', icon: '⭐', hidingType: 'IN_ON' },
    { id: 'beach_sand_dollar', name: 'Sand Dollar', icon: '🪙', hidingType: 'IN_ON' },
    { id: 'beach_lighthouse', name: 'Old Lighthouse', icon: '🗼', hidingType: 'LANDMARK' },
    { id: 'beach_rock_arch', name: 'Sea Arch', icon: '🌊', hidingType: 'LANDMARK' },
    { id: 'beach_pearl', name: 'Rare Pearl', icon: '🦪', hidingType: 'SKILL_GATED' },
    { id: 'beach_message_bottle', name: 'Message in Bottle', icon: '🍾', hidingType: 'SKILL_GATED' },
  ],
  trophy: { 
    id: 'beach_trophy', 
    name: 'Beachcomber', 
    icon: '🏆', 
    description: 'Collected every treasure the beach offers' 
  },
  postcard: { 
    id: 'beach_postcard', 
    name: 'Ocean Sunrise', 
    sereneAction: 'Watch the waves roll in', 
    audioKey: 'ambient_beach_waves', 
    campUpgradeKey: 'beach_chair' 
  },
  gateHints: { 
    '5/10': 'The tide reveals its gifts...', 
    '10/10': 'Beachfront mastered! You\'ve explored every world.' 
  },
});
