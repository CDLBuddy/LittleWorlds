/**
 * Pine World - Interactable IDs
 */

import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const PINE_INTERACTABLES = [
  INTERACTABLE_ID.PINE_DUSK_GATE,
  INTERACTABLE_ID.PINE_CREEK_GATE,
] as const satisfies readonly InteractableId[];
