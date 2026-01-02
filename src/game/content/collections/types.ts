// src/game/content/collections/types.ts
/**
 * Types for area collections (finds, trophies, postcards)
 */

/**
 * Hiding types for collectible finds
 * - EDGE: Perimeter/boundary locations (fences, garden edges)
 * - UNDER: Beneath objects (logs, rocks, bushes)
 * - IN_ON: Inside or on top of structures (tree stumps, planters)
 * - LANDMARK: Notable features (big trees, rocks, water features)
 * - SKILL_GATED: Requires tool or companion (axe to chop, dog to dig)
 */
export type HidingType = 'EDGE' | 'UNDER' | 'IN_ON' | 'LANDMARK' | 'SKILL_GATED';

export interface Find {
  id: string;
  name: string;
  icon: string;
  hidingType: HidingType;
  description?: string;
}

export interface Trophy {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Postcard {
  id: string;
  name: string;
  sereneAction: string;      // e.g., "Sit by the campfire"
  audioKey: string;           // Audio asset key for ambient/memory sound
  campUpgradeKey: string;     // Upgrade unlocked (e.g., "campfire_logs")
}

export interface GateHint {
  findCount: 5 | 10;
  message: string;
}

export interface AreaTemplate {
  areaId: string;
  finds: Find[];              // Exactly 10 finds (2 per hiding type)
  trophy: Trophy;
  postcard: Postcard;
  gateHints: {
    '5/10': string;
    '10/10': string;
  };
}
