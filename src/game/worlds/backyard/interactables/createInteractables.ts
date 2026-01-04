/**
 * Backyard World - Interactables orchestrator
 * Coordinates all interactable objects and handles dynamic registration
 */

import type { Scene } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import type { Interactable } from '../types';
import { createSlingshotPickup } from './slingshotPickup';
import { createBackyardTarget } from './backyardTarget';
import { createMultitoolPickup } from './multitoolPickup';
import { createCarveStation } from './carveStation';
import { createBackyardGate } from './backyardGate';

export function createInteractables(
  scene: Scene,
  eventBus: { emit: (event: AppEvent) => void },
  getIsAlive: () => boolean
) {
  const interactables: Interactable[] = [];
  
  // Reference to interaction system for dynamic registration
  let dynamicRegister: ((interactable: Interactable) => void) | null = null;

  // Create synchronous interactables immediately
  interactables.push(
    createBackyardTarget(scene, eventBus),
    createMultitoolPickup(scene, eventBus),
    createCarveStation(scene, eventBus),
    createBackyardGate(scene, eventBus)
  );

  // Load slingshot asynchronously (GLB model)
  void createSlingshotPickup(scene, getIsAlive)
    .then(slingshotPickup => {
      // Add to interactables array after loading
      interactables.push(slingshotPickup);
      
      // If world is already active, register with interaction system
      if (dynamicRegister) {
        dynamicRegister(slingshotPickup);
      }
    })
    .catch((error) => {
      console.error('[Backyard] Failed to load slingshot:', error);
    });

  return {
    interactables,
    // Method to register late-loading interactables
    registerDynamic: (register: (interactable: Interactable) => void) => {
      dynamicRegister = register;
    },
  };
}
