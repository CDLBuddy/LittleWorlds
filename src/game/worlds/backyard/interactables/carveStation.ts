/**
 * Backyard World - Carve station interactable
 */

import { Vector3, Color3, type Scene } from '@babylonjs/core';
import { INTERACTABLE_ID } from '@game/content/interactableIds';
import type { AppEvent } from '@game/shared/events';
import { createWorkbenchInteractable } from '../utils/interactableFactories';
import type { Interactable } from '../types';

export function createCarveStation(
  scene: Scene,
  eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  return createWorkbenchInteractable(
    scene,
    INTERACTABLE_ID.CARVE_STATION,
    new Vector3(15, 0, -5),
    new Color3(0.55, 0.35, 0.2), // Wood stump
    eventBus
  );
}
