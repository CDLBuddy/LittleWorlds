/**
 * Forest ground - baked ground planes + decals
 */

import { Scene, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export function createForestGround(scene: Scene): void {
  const ground = MeshBuilder.CreateGround('ground', { width: 50, height: 50 }, scene);
  ground.isPickable = true;
  ground.checkCollisions = false; // Controller handles collision
  
  const material = new StandardMaterial('groundMat', scene);
  material.diffuseColor = new Color3(0.4, 0.6, 0.3);
  ground.material = material;
}
