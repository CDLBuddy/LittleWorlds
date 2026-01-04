/**
 * Backyard World - Garden dirt patch
 */

import { MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';
import { GARDEN_POSITION, COLORS } from '../config/constants';

export function createGarden(scene: Scene) {
  const garden = MeshBuilder.CreateBox('garden', { 
    width: 4, 
    height: 0.2, 
    depth: 2 
  }, scene);
  garden.position = GARDEN_POSITION.clone();
  
  const gardenMat = new StandardMaterial('gardenMat', scene);
  gardenMat.diffuseColor = COLORS.garden.clone();
  garden.material = gardenMat;

  return { garden, gardenMat };
}
