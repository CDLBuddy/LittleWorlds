/**
 * Task graph - dependencies: stick → chips → fire
 */

export interface TaskNode {
  id: string;
  name: string;
  requires: string[];
  unlocks: string[];
}

export const FOREST_TASK_GRAPH: TaskNode[] = [
  {
    id: 'find_stick',
    name: 'Find a Stick',
    requires: [],
    unlocks: ['find_axe'],
  },
  {
    id: 'find_axe',
    name: 'Find the Axe',
    requires: ['find_stick'],
    unlocks: ['chop_wood'],
  },
  {
    id: 'chop_wood',
    name: 'Chop Wood',
    requires: ['find_axe'],
    unlocks: ['make_fire'],
  },
  {
    id: 'make_fire',
    name: 'Make a Fire',
    requires: ['chop_wood'],
    unlocks: ['roast_marshmallow'],
  },
  {
    id: 'roast_marshmallow',
    name: 'Roast Marshmallow',
    requires: ['make_fire'],
    unlocks: [],
  },
];

export function buildTaskGraph(nodes: TaskNode[]): Map<string, TaskNode> {
  const graph = new Map<string, TaskNode>();
  nodes.forEach((node) => graph.set(node.id, node));
  return graph;
}
