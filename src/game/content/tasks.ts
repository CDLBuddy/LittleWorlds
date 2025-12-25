/**
 * Task definitions - icon-first task chains
 */

export interface TaskDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  celebrationMessage: string;
  dependencies: string[];
}

export const TASKS: Record<string, TaskDef> = {
  find_stick: {
    id: 'find_stick',
    name: 'Find a Stick',
    description: 'Look for a stick on the ground',
    icon: 'ui/task_stick.png',
    celebrationMessage: 'Great job! You found a stick!',
    dependencies: [],
  },
  find_axe: {
    id: 'find_axe',
    name: 'Find the Axe',
    description: 'Search for the axe',
    icon: 'ui/task_axe.png',
    celebrationMessage: 'Awesome! You found the axe!',
    dependencies: ['find_stick'],
  },
  chop_wood: {
    id: 'chop_wood',
    name: 'Chop Wood',
    description: 'Use the axe to chop some logs',
    icon: 'ui/task_chop.png',
    celebrationMessage: 'Nice work! You chopped some wood!',
    dependencies: ['find_axe'],
  },
  make_fire: {
    id: 'make_fire',
    name: 'Make a Fire',
    description: 'Light the campfire with the wood',
    icon: 'ui/task_fire.png',
    celebrationMessage: 'Amazing! The fire is burning bright!',
    dependencies: ['chop_wood'],
  },
};
