import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const DUSK_INTERACTABLES = [
  INTERACTABLE_ID.DUSK_NIGHT_GATE,
  INTERACTABLE_ID.DUSK_PINE_GATE,
] as const satisfies readonly InteractableId[];
