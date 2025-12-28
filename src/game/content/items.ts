/**
 * Item definitions - data-driven items
 */

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  stackable: boolean;
  maxStack?: number;
}

export const ITEMS: Record<string, ItemDef> = {
  stick: {
    id: 'stick',
    name: 'Stick',
    icon: 'ui/icon_stick.png',
    description: 'A sturdy stick',
    stackable: true,
    maxStack: 10,
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    icon: 'ui/icon_stone.png',
    description: 'A smooth stone',
    stackable: true,
    maxStack: 10,
  },
  log: {
    id: 'log',
    name: 'Log',
    icon: 'ui/icon_log.png',
    description: 'A piece of wood',
    stackable: true,
    maxStack: 5,
  },
  fish: {
    id: 'fish',
    name: 'Fish',
    icon: 'ui/icon_fish.png',
    description: 'A fresh fish',
    stackable: false,
  },
  rope: {
    id: 'rope',
    name: 'Rope',
    icon: 'ui/icon_rope.png',
    description: 'Useful rope',
    stackable: true,
    maxStack: 5,
  },
  // Backyard + Woodline items
  slingshot: {
    id: 'slingshot',
    name: 'Slingshot',
    icon: 'ui/icon_slingshot.png',
    description: 'A simple slingshot',
    stackable: false,
  },
  steel_balls: {
    id: 'steel_balls',
    name: 'Steel Balls',
    icon: 'ui/icon_steel_balls.png',
    description: 'Ammo for the slingshot',
    stackable: true,
    maxStack: 25,
  },
  multitool: {
    id: 'multitool',
    name: 'Multitool',
    icon: 'ui/icon_multitool.png',
    description: 'A versatile tool',
    stackable: false,
  },
  string: {
    id: 'string',
    name: 'String',
    icon: 'ui/icon_string.png',
    description: 'Strong cordage',
    stackable: true,
    maxStack: 10,
  },
  flint: {
    id: 'flint',
    name: 'Flint',
    icon: 'ui/icon_flint.png',
    description: 'For making sparks',
    stackable: false,
  },
  field_guide: {
    id: 'field_guide',
    name: 'Field Guide',
    icon: 'ui/icon_field_guide.png',
    description: 'A survival handbook',
    stackable: false,
  },
  // Keepsakes
  carved_token: {
    id: 'carved_token',
    name: 'Carved Token',
    icon: 'ui/icon_carved_token.png',
    description: 'A handmade keepsake',
    stackable: false,
  },
  bow_drill: {
    id: 'bow_drill',
    name: 'Bow Drill',
    icon: 'ui/icon_bow_drill.png',
    description: 'Friction fire starter',
    stackable: false,
  },
};
