/**
 * Task definitions - icon-first task chains
 */

import type { InteractableId } from './interactableIds';
import type { ItemId } from './items';
import { INTERACTABLE_ID } from './interactableIds';

export interface TaskStep {
  id: string;
  targetId: InteractableId; // ID of the interactable to interact with
  promptIcon: 'hand' | 'axe' | 'log' | 'fire' | 'tent' | 'fish' | 'paw' | 'book' | 'knife' | 'spark' | 'knot' | 'target';
  requiresItems?: ItemId[]; // Inventory requirements (must have all)
  grantsItems?: ItemId[]; // Items to grant on step completion
  consumesItems?: ItemId[]; // Items to remove on step completion
}

export interface Task {
  id: string;
  name: string;
  steps: TaskStep[];
}

/**
 * Campfire v1: Simple 3-step task chain
 * 1. Pick up axe (hand icon)
 * 2. Use axe on log pile (axe icon, requires axe)
 * 3. Light campfire (fire icon, requires log)
 */
export const campfire_v1: Task = {
  id: 'campfire_v1',
  name: 'Build a Campfire',
  steps: [
    {
      id: 'pickup_axe',
      targetId: INTERACTABLE_ID.AXE,
      promptIcon: 'hand',
      grantsItems: ['axe'],
    },
    {
      id: 'chop_log',
      targetId: INTERACTABLE_ID.LOGPILE,
      promptIcon: 'axe',
      requiresItems: ['axe'],
      grantsItems: ['log'],
    },
    {
      id: 'light_fire',
      targetId: INTERACTABLE_ID.CAMPFIRE,
      promptIcon: 'fire',
      requiresItems: ['log'],
    },
  ],
};

// Backyard tasks - Boy role
export const boy_backyard_find_slingshot: Task = {
  id: 'boy_backyard_find_slingshot',
  name: 'Find Slingshot',
  steps: [
    {
      id: 'pickup_slingshot',
      targetId: INTERACTABLE_ID.SLINGSHOT_PICKUP,
      promptIcon: 'hand',
      grantsItems: ['slingshot', 'steel_balls'],
    },
  ],
};

export const boy_backyard_first_shots: Task = {
  id: 'boy_backyard_first_shots',
  name: 'First Shots',
  steps: [
    {
      id: 'shoot_target',
      targetId: INTERACTABLE_ID.BACKYARD_TARGET,
      promptIcon: 'target',
      requiresItems: ['slingshot'],
    },
  ],
};

// Backyard tasks - Girl role
export const girl_backyard_find_multitool: Task = {
  id: 'girl_backyard_find_multitool',
  name: 'Find Multitool',
  steps: [
    {
      id: 'pickup_multitool',
      targetId: INTERACTABLE_ID.MULTITOOL_PICKUP,
      promptIcon: 'hand',
      grantsItems: ['multitool', 'string'],
    },
  ],
};

export const girl_backyard_carve_token: Task = {
  id: 'girl_backyard_carve_token',
  name: 'Carve Token',
  steps: [
    {
      id: 'carve',
      targetId: INTERACTABLE_ID.CARVE_STATION,
      promptIcon: 'knife',
      requiresItems: ['multitool'],
      grantsItems: ['carved_token'],
    },
  ],
};

// Woodline tasks - Boy role
export const boy_woodline_find_flint: Task = {
  id: 'boy_woodline_find_flint',
  name: 'Find Flint',
  steps: [
    {
      id: 'pickup_flint',
      targetId: INTERACTABLE_ID.FLINT_PICKUP,
      promptIcon: 'hand',
      grantsItems: ['flint'],
    },
  ],
};

export const boy_woodline_spark_fire: Task = {
  id: 'boy_woodline_spark_fire',
  name: 'Spark Fire',
  steps: [
    {
      id: 'spark',
      targetId: INTERACTABLE_ID.WOODLINE_CAMPFIRE,
      promptIcon: 'spark',
      requiresItems: ['flint', 'steel_balls'],
    },
  ],
};

// Woodline tasks - Girl role
export const girl_woodline_find_fieldguide: Task = {
  id: 'girl_woodline_find_fieldguide',
  name: 'Find Field Guide',
  steps: [
    {
      id: 'pickup_fieldguide',
      targetId: INTERACTABLE_ID.FIELDGUIDE_PICKUP,
      promptIcon: 'book',
      grantsItems: ['field_guide'],
    },
  ],
};

export const girl_woodline_bowdrill_fire: Task = {
  id: 'girl_woodline_bowdrill_fire',
  name: 'Bow Drill Fire',
  steps: [
    {
      id: 'bowdrill',
      targetId: INTERACTABLE_ID.BOWDRILL_STATION,
      promptIcon: 'knot',
      requiresItems: ['multitool', 'string'],
    },
  ],
};

// Task registry
export const TASKS_BY_ID: Record<string, Task> = {
  campfire_v1,
  boy_backyard_find_slingshot,
  boy_backyard_first_shots,
  girl_backyard_find_multitool,
  girl_backyard_carve_token,
  boy_woodline_find_flint,
  boy_woodline_spark_fire,
  girl_woodline_find_fieldguide,
  girl_woodline_bowdrill_fire,
};

export type TaskId = keyof typeof TASKS_BY_ID;
export const allTasks: Task[] = Object.values(TASKS_BY_ID);
