/**
 * Area definitions - data-driven chapters for LittleWorlds
 */

import { CONTENT_VERSION } from './version';

export { CONTENT_VERSION };

export type RoleId = 'boy' | 'girl';

export const AREA_IDS = ['backyard', 'woodline', 'creek', 'pine', 'dusk', 'night', 'beach'] as const;
export type AreaId = typeof AREA_IDS[number];

/**
 * Runtime type guard for AreaId
 * Use at boundaries to validate unknown/string values
 */
export function isAreaId(value: unknown): value is AreaId {
  return typeof value === 'string' && (AREA_IDS as readonly string[]).includes(value);
}

export interface AreaDef {
  id: AreaId;
  name: string;
  worldKey: string; // World key (will be linked to actual worlds later)
  next?: AreaId; // Next area in progression
  tasksByRole: {
    boy: string[]; // Task IDs for boy role
    girl: string[]; // Task IDs for girl role
  };
}

/**
 * Area registry - defines the progression through LittleWorlds
 */
export const AREAS: Record<AreaId, AreaDef> = {
  backyard: {
    id: 'backyard',
    name: 'Backyard',
    worldKey: 'BACKYARD',
    next: 'woodline',
    tasksByRole: {
      boy: ['boy_backyard_find_slingshot', 'boy_backyard_first_shots'],
      girl: ['girl_backyard_find_multitool', 'girl_backyard_carve_token'],
    },
  },
  woodline: {
    id: 'woodline',
    name: 'Woodline',
    worldKey: 'WOODLINE',
    next: 'creek',
    tasksByRole: {
      boy: ['boy_woodline_find_flint', 'boy_woodline_spark_fire'],
      girl: ['girl_woodline_find_fieldguide', 'girl_woodline_bowdrill_fire'],
    },
  },
  creek: {
    id: 'creek',
    name: 'Creek',
    worldKey: 'CREEK',
    next: 'pine',
    tasksByRole: {
      boy: ['boy_creek_cross_shallow', 'boy_creek_slingshot_bridge'],
      girl: ['girl_creek_cross_shallow', 'girl_creek_filter_water'],
    },
  },
  pine: {
    id: 'pine',
    name: 'Pine Trails',
    worldKey: 'PINE',
    next: 'dusk',
    tasksByRole: {
      boy: [],
      girl: [],
    },
  },
  dusk: {
    id: 'dusk',
    name: 'Firefly Dusk',
    worldKey: 'DUSK',
    next: 'night',
    tasksByRole: {
      boy: [],
      girl: [],
    },
  },
  night: {
    id: 'night',
    name: 'Night Stars',
    worldKey: 'NIGHT',
    next: 'beach',
    tasksByRole: {
      boy: [],
      girl: [],
    },
  },
  beach: {
    id: 'beach',
    name: 'Beachfront',
    worldKey: 'BEACH',
    tasksByRole: {
      boy: [],
      girl: [],
    },
  },
};

/**
 * Get all task IDs for a given role and area
 */
export function getTasksForArea(areaId: AreaId, role: RoleId): string[] {
  return AREAS[areaId].tasksByRole[role];
}

/**
 * Get the next area in progression
 */
export function getNextArea(currentArea: AreaId): AreaId | null {
  return AREAS[currentArea].next ?? null;
}
