/**
 * Task definitions - icon-first task chains
 */

export interface TaskStep {
  id: string;
  targetId: string; // ID of the interactable to interact with
  promptIcon: 'hand' | 'axe' | 'log' | 'fire' | 'tent' | 'fish' | 'paw';
  requiresItem?: string; // Optional inventory requirement
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
      targetId: 'axe_001',
      promptIcon: 'hand',
    },
    {
      id: 'chop_log',
      targetId: 'logpile_001',
      promptIcon: 'axe',
      requiresItem: 'axe',
    },
    {
      id: 'light_fire',
      targetId: 'campfire',
      promptIcon: 'fire',
      requiresItem: 'log',
    },
  ],
};

export const allTasks: Task[] = [campfire_v1];
