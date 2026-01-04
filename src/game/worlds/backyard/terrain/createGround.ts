/**
 * Backyard World - Ground plane creation
 */

import { MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';
import { BACKYARD_TERRAIN, COLORS } from '../config/constants';

export function createGround(scene: Scene) {
  const { groundWidth, groundHeight } = BACKYARD_TERRAIN;

  // Large ground plane (backyard) - visible as fallback if grass fails to load
  const ground = MeshBuilder.CreateGround(
    'ground',
    { width: groundWidth, height: groundHeight },
    scene
  );
  ground.isPickable = true;
  ground.checkCollisions = false; // Controller handles collision
  ground.receiveShadows = true;

  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = COLORS.ground.clone();
  groundMat.specularColor = COLORS.ground.scale(0.2);
  ground.material = groundMat;

  return { ground, groundMat };
}
