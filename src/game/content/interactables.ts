/**
 * Interactable metadata definitions
 */

export interface InteractableDef {
  id: string;
  type: string;
  name: string;
  icon: string;
  interactionText: string;
}

export const INTERACTABLES: Record<string, InteractableDef> = {
  campfire: {
    id: 'campfire',
    type: 'campfire',
    name: 'Campfire',
    icon: 'ui/icon_campfire.png',
    interactionText: 'Light Fire',
  },
  tent: {
    id: 'tent',
    type: 'tent',
    name: 'Tent',
    icon: 'ui/icon_tent.png',
    interactionText: 'Enter Tent',
  },
  axe: {
    id: 'axe',
    type: 'tool',
    name: 'Axe',
    icon: 'ui/icon_axe.png',
    interactionText: 'Pick Up',
  },
  logs: {
    id: 'logs',
    type: 'resource',
    name: 'Log Pile',
    icon: 'ui/icon_logs.png',
    interactionText: 'Collect Log',
  },
  fishing_spot: {
    id: 'fishing_spot',
    type: 'activity',
    name: 'Fishing Spot',
    icon: 'ui/icon_fishing.png',
    interactionText: 'Go Fishing',
  },
};
