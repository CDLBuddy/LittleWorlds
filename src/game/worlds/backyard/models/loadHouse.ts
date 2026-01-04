/**
 * Backyard World - House model loader
 */

import type { Scene } from '@babylonjs/core';
import { loadContainer } from './loadContainer';
import { HOUSE_POSITION } from '../config/constants';

/**
 * Load House.glb and set up collision + shadows
 */
export async function loadHouse(scene: Scene, getIsAlive: () => boolean): Promise<void> {
  const container = await loadContainer({
    scene,
    url: 'House.glb',
    getIsAlive,
  });

  const meshes = container.meshes;
  if (meshes.length > 0) {
    const houseRoot = meshes[0];
    houseRoot.position = HOUSE_POSITION.clone();
    
    // Set checkCollisions on all meshes
    meshes.forEach(mesh => {
      mesh.checkCollisions = true;
      mesh.receiveShadows = true;
    });
  }
}
