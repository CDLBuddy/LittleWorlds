/**
 * Backyard World - Reusable interactable factory functions
 */

import { Vector3, Color3, MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import type { Interactable } from '../types';

/**
 * Creates a small hovering pickup box with bobbing animation
 */
export function createPickupInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  _eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  // Small hovering box for pickup
  const mesh = MeshBuilder.CreateBox(id, { size: 0.5 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 0.5; // Hover
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.2);
  mesh.material = mat;

  // Gentle bobbing animation
  const bobbingObserver = scene.onBeforeRenderObservable.add(() => {
    if (mesh.isEnabled()) {
      mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  return {
    id,
    mesh,
    interact: () => {
      mesh.setEnabled(false); // Hide after pickup
      console.log(`[Backyard] Picked up ${id}`);
    },
    dispose: () => {
      scene.onBeforeRenderObservable.remove(bobbingObserver);
      mesh.dispose();
      mat.dispose();
    },
  };
}

/**
 * Creates an upright cylinder target
 */
export function createTargetInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  _eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  // Cylinder target (upright)
  const mesh = MeshBuilder.CreateCylinder(id, { height: 2, diameter: 1 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 1; // Half height
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mesh.material = mat;

  return {
    id,
    mesh,
    interact: () => {
      console.log(`[Backyard] Hit target: ${id}`);
      // Target remains enabled (can be hit multiple times if needed)
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

/**
 * Creates a box workbench or stump
 */
export function createWorkbenchInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  _eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  // Box workbench/stump
  const mesh = MeshBuilder.CreateBox(id, { width: 1.5, height: 0.8, depth: 1.2 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 0.4; // Half height
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mesh.material = mat;

  return {
    id,
    mesh,
    interact: () => {
      console.log(`[Backyard] Used workbench: ${id}`);
      // Workbench remains enabled
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

/**
 * Creates a gate that triggers area transitions
 */
export function createGateInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  eventBus: { emit: (event: AppEvent) => void },
  targetArea: string
): Interactable {
  // Simple gate (tall box)
  const mesh = MeshBuilder.CreateBox(id, { width: 10, height: 2, depth: 0.3 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 1; // Half height
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.15);
  mesh.material = mat;

  return {
    id,
    mesh,
    alwaysActive: true, // Gates are always interactable, not tied to tasks
    interact: () => {
      // Emit area request with gate ID for spawn computation
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea, fromGateId: id });
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}
