/**
 * Backyard World - Multitool pickup interactable
 */

import { Vector3, Color3, type Scene } from '@babylonjs/core';
import { INTERACTABLE_ID } from '@game/content/interactableIds';
import type { AppEvent } from '@game/shared/events';
import { createPickupInteractable } from '../utils/interactableFactories';
import type { Interactable } from '../types';

export function createMultitoolPickup(
  scene: Scene,
  eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  return createPickupInteractable(
    scene,
    INTERACTABLE_ID.MULTITOOL_PICKUP,
    new Vector3(10, 0, 10),
    new Color3(0.5, 0.5, 0.6), // Metallic gray
    eventBus
  );
}
