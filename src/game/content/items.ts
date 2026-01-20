/**
 * Item definitions - data-driven items
 * Includes both passive items and interactive tools
 */

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  stackable: boolean;
  maxStack?: number;
  /** Is this item an interactive tool that can be equipped? */
  isInteractive?: boolean;
  /** Item category for inventory filtering */
  category?: 'tool' | 'material' | 'consumable' | 'keepsake';
}

export const ITEMS: Record<string, ItemDef> = {
  axe: {
    id: 'axe',
    name: 'Axe',
    icon: 'ui/icon_axe.png',
    description: 'A sharp axe for chopping',
    stackable: false,
    isInteractive: true, // Tool (not yet interactive in v0.8.0)
    category: 'tool',
  },
  stick: {
    id: 'stick',
    name: 'Stick',
    icon: 'ui/icon_stick.png',
    description: 'A sturdy stick',
    stackable: true,
    maxStack: 10,
    category: 'material',
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    icon: 'ui/icon_stone.png',
    description: 'A smooth stone',
    stackable: true,
    maxStack: 10,
    category: 'material',
  },
  log: {
    id: 'log',
    name: 'Log',
    icon: 'ui/icon_log.png',
    description: 'A piece of wood',
    stackable: true,
    maxStack: 5,
    category: 'material',
  },
  fish: {
    id: 'fish',
    name: 'Fish',
    icon: 'ui/icon_fish.png',
    description: 'A fresh fish',
    stackable: false,
    category: 'consumable',
  },
  rope: {
    id: 'rope',
    name: 'Rope',
    icon: 'ui/icon_rope.png',
    description: 'Useful rope',
    stackable: true,
    maxStack: 5,
    category: 'material',
  },
  // Backyard + Woodline items
  slingshot: {
    id: 'slingshot',
    name: 'Slingshot',
    icon: 'ui/icon_slingshot.png',
    description: 'A simple slingshot',
    stackable: false,
    isInteractive: true, // Interactive tool
    category: 'tool',
  },
  steel_balls: {
    id: 'steel_balls',
    name: 'Steel Balls',
    icon: 'ui/icon_steel_balls.png',
    description: 'Ammo for the slingshot',
    stackable: true,
    maxStack: 25,
    category: 'material', // Ammo is a material
  },
  multitool: {
    id: 'multitool',
    name: 'Multitool',
    icon: 'ui/icon_multitool.png',
    description: 'A versatile tool',
    stackable: false,
    isInteractive: true, // Tool (not yet interactive in v0.8.0)
    category: 'tool',
  },
  string: {
    id: 'string',
    name: 'String',
    icon: 'ui/icon_string.png',
    description: 'Strong cordage',
    stackable: true,
    maxStack: 10,
    category: 'material',
  },
  flint: {
    id: 'flint',
    name: 'Flint',
    icon: 'ui/icon_flint.png',
    description: 'For making sparks',
    stackable: false,
    category: 'material',
  },
  field_guide: {
    id: 'field_guide',
    name: 'Field Guide',
    icon: 'ui/icon_field_guide.png',
    description: 'A survival handbook',
    stackable: false,
    category: 'keepsake',
  },
  // Creek items
  clean_water: {
    id: 'clean_water',
    name: 'Clean Water',
    icon: '💧',
    description: 'Filtered water from the creek',
    stackable: true,
    maxStack: 3,
    category: 'consumable',
  },
  // Keepsakes
  carved_token: {
    id: 'carved_token',
    name: 'Carved Token',
    icon: 'ui/icon_carved_token.png',
    description: 'A handmade keepsake',
    stackable: false,
    category: 'keepsake',
  },
  bow_drill: {
    id: 'bow_drill',
    name: 'Bow Drill',
    icon: 'ui/icon_bow_drill.png',
    description: 'Friction fire starter',
    stackable: false,
    isInteractive: true, // Tool (not yet interactive in v0.8.0)
    category: 'tool',
  },
};

export type ItemId = keyof typeof ITEMS;
export const ALL_ITEM_IDS = Object.keys(ITEMS);
