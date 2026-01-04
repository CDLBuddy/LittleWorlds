/**
 * Backyard World - Slingshot pickup interactable (async loaded)
 */

import { Vector3, type Scene } from '@babylonjs/core';
import { loadContainer } from '../models/loadContainer';
import { INTERACTABLE_ID } from '@game/content/interactableIds';
import type { Interactable } from '../types';

/**
 * Load Slingshot.glb model and create interactable
 */
export async function createSlingshotPickup(
  scene: Scene,
  getIsAlive: () => boolean
): Promise<Interactable> {
  const container = await loadContainer({
    scene,
    url: 'Slingshot.glb',
    getIsAlive,
  });

  const meshes = container.meshes;
  if (meshes.length === 0) {
    throw new Error('Slingshot model has no meshes');
  }

  const slingshotMesh = meshes[0];
  slingshotMesh.id = INTERACTABLE_ID.SLINGSHOT_PICKUP; // Set mesh id for companion targeting
  slingshotMesh.position = new Vector3(-10, 0.5, 10);
  slingshotMesh.scaling = new Vector3(1.5, 1.5, 1.5); // Increase to full size

  return {
    id: INTERACTABLE_ID.SLINGSHOT_PICKUP,
    mesh: slingshotMesh,
    interact: () => {
      slingshotMesh.setEnabled(false);
      console.log('[Backyard] Picked up slingshot');
    },
    dispose: () => {
      meshes.forEach(m => m.dispose());
    },
  };
}
