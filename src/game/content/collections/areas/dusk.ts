// src/game/content/collections/areas/dusk.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const DUSK_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'dusk',
  finds: [
    { id: 'dusk_firefly', name: 'Firefly', icon: '✨', hidingType: 'EDGE' },
    { id: 'dusk_cricket', name: 'Cricket', icon: '🦗', hidingType: 'EDGE' },
    { id: 'dusk_moth', name: 'Luna Moth', icon: '🦋', hidingType: 'UNDER' },
    { id: 'dusk_glow_mushroom', name: 'Glowing Mushroom', icon: '🍄', hidingType: 'UNDER' },
    { id: 'dusk_lantern', name: 'Firefly Lantern', icon: '🏮', hidingType: 'IN_ON' },
    { id: 'dusk_jar', name: 'Glowstone in Jar', icon: '💎', hidingType: 'IN_ON' },
    { id: 'dusk_old_tree', name: 'Ancient Oak', icon: '🌳', hidingType: 'LANDMARK' },
    { id: 'dusk_meadow', name: 'Twilight Meadow', icon: '🌾', hidingType: 'LANDMARK' },
    { id: 'dusk_rare_flower', name: 'Night Bloom', icon: '🌸', hidingType: 'SKILL_GATED' },
    { id: 'dusk_owl_feather', name: 'Owl Feather', icon: '🪶', hidingType: 'SKILL_GATED' },
  ],
  trophy: { 
    id: 'dusk_trophy', 
    name: 'Twilight Wanderer', 
    icon: '🏆', 
    description: 'Found all treasures in the firefly dusk' 
  },
  postcard: { 
    id: 'dusk_postcard', 
    name: 'Firefly Dance', 
    sereneAction: 'Watch the fireflies emerge', 
    audioKey: 'ambient_dusk_crickets', 
    campUpgradeKey: 'firefly_jar' 
  },
  gateHints: { 
    '5/10': 'The twilight reveals wonders...', 
    '10/10': 'Dusk has no more secrets. Night stars beckon!' 
  },
});
