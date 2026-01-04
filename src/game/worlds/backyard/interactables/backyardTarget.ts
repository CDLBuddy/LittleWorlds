/**
 * Backyard World - Backyard target interactable
 */

import { Vector3, Color3, type Scene } from '@babylonjs/core';
import { INTERACTABLE_ID } from '@game/content/interactableIds';
import type { AppEvent } from '@game/shared/events';
import { createTargetInteractable } from '../utils/interactableFactories';
import type { Interactable } from '../types';

export function createBackyardTarget(
  scene: Scene,
  eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  return createTargetInteractable(
    scene,
    INTERACTABLE_ID.BACKYARD_TARGET,
    new Vector3(-15, 0, -5),
    new Color3(0.9, 0.2, 0.2), // Red target
    eventBus
  );
}
