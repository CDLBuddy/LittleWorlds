/**
 * Backyard World - Interactables configuration
 */

import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const BACKYARD_INTERACTABLES = [
  INTERACTABLE_ID.SLINGSHOT_PICKUP,
  INTERACTABLE_ID.BACKYARD_TARGET,
  INTERACTABLE_ID.MULTITOOL_PICKUP,
  INTERACTABLE_ID.CARVE_STATION,
  INTERACTABLE_ID.BACKYARD_GATE,
] as const satisfies readonly InteractableId[];
