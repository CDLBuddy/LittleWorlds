// src/game/content/collections/areas/backyard.ts
import type { AreaTemplate } from '../types';
import { createAreaTemplate } from '../template';

export const BACKYARD_COLLECTIONS: AreaTemplate = createAreaTemplate({
  areaId: 'backyard',
  finds: [
    // EDGE finds (2) - Perimeter locations
    { id: 'backyard_acorn', name: 'Acorn', icon: '🌰', hidingType: 'EDGE' },
    { id: 'backyard_pebble', name: 'Smooth Pebble', icon: '🪨', hidingType: 'EDGE' },
    
    // UNDER finds (2) - Beneath objects
    { id: 'backyard_leaf', name: 'Oak Leaf', icon: '🍂', hidingType: 'UNDER' },
    { id: 'backyard_nest', name: 'Tiny Nest', icon: '🪹', hidingType: 'UNDER' },
    
    // IN_ON finds (2) - Inside/on structures
    { id: 'backyard_shell', name: 'Snail Shell', icon: '🐚', hidingType: 'IN_ON' },
    { id: 'backyard_tadpole', name: 'Tadpole', icon: '🦎', hidingType: 'IN_ON' },
    
    // LANDMARK finds (2) - Notable features
    { id: 'backyard_crystal', name: 'Quartz', icon: '💎', hidingType: 'LANDMARK' },
    { id: 'backyard_fossil', name: 'Fossil', icon: '🦴', hidingType: 'LANDMARK' },
    
    // SKILL_GATED finds (2) - Requires tools/companion
    { id: 'backyard_flower', name: 'Wildflower', icon: '🌼', hidingType: 'SKILL_GATED' },
    { id: 'backyard_mushroom', name: 'Mushroom', icon: '🍄', hidingType: 'SKILL_GATED' },
  ],
  trophy: {
    id: 'backyard_trophy',
    name: 'Backyard Explorer',
    icon: '🏆',
    description: 'Discovered all treasures in your backyard',
  },
  postcard: {
    id: 'backyard_postcard',
    name: 'Peaceful Morning',
    sereneAction: 'Watch the sunrise from the porch',
    audioKey: 'ambient_backyard_morning',
    campUpgradeKey: 'swing',
  },
  gateHints: {
    '5/10': 'You\'re discovering your world...',
    '10/10': 'The backyard holds no more secrets. Time to explore beyond!',
  },
});
