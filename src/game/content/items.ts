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
};
