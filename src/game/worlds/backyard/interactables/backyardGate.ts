/**
 * Backyard World - Backyard gate interactable (transition to woodline)
 */

import { Vector3, Color3, type Scene } from '@babylonjs/core';
import { INTERACTABLE_ID } from '@game/content/interactableIds';
import type { AppEvent } from '@game/shared/events';
import { createGateInteractable } from '../utils/interactableFactories';
import type { Interactable } from '../types';

export function createBackyardGate(
  scene: Scene,
  eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  return createGateInteractable(
    scene,
    INTERACTABLE_ID.BACKYARD_GATE,
    new Vector3(0, 0, -30),
    new Color3(0.8, 0.6, 0.3), // Wood gate
    eventBus,
    'woodline' // Target area
  );
}
