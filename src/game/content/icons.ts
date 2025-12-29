/**
 * Icon mapping for UI elements
 */

import { CONTENT_VERSION } from './version';

export { CONTENT_VERSION };

export const ICONS = {
  // Items
  stick: '/assets/ui/icon_stick.png',
  stone: '/assets/ui/icon_stone.png',
  log: '/assets/ui/icon_log.png',
  fish: '/assets/ui/icon_fish.png',
  rope: '/assets/ui/icon_rope.png',
  
  // Interactables
  campfire: '/assets/ui/icon_campfire.png',
  tent: '/assets/ui/icon_tent.png',
  axe: '/assets/ui/icon_axe.png',
  
  // Tasks
  task_stick: '/assets/ui/task_stick.png',
  task_axe: '/assets/ui/task_axe.png',
  task_chop: '/assets/ui/task_chop.png',
  task_fire: '/assets/ui/task_fire.png',
  
  // UI
  button_interact: '/assets/ui/button_interact.png',
  button_pause: '/assets/ui/button_pause.png',
  companion_call: '/assets/ui/companion_call.png',
} as const;

export type IconKey = keyof typeof ICONS;
