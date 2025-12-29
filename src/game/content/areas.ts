/**
 * Area definitions - data-driven chapters for LittleWorlds
 */

import { CONTENT_VERSION } from './version';

export { CONTENT_VERSION };

export type RoleId = 'boy' | 'girl';
export type AreaId = 'backyard' | 'woodline';

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
    tasksByRole: {
      boy: ['boy_woodline_find_flint', 'boy_woodline_spark_fire'],
      girl: ['girl_woodline_find_fieldguide', 'girl_woodline_bowdrill_fire'],
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
