/**
 * Backyard World - Tire swing prop
 */

import { Vector3, MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';
import { TIRE_SWING_POSITION, COLORS } from '../config/constants';

export function createTireSwing(scene: Scene) {
  // Rope from tree branch to tire
  const rope = MeshBuilder.CreateCylinder('rope', { 
    height: 3.5, 
    diameter: 0.05 
  }, scene);
  rope.position = new Vector3(
    TIRE_SWING_POSITION.x,
    3.5,
    TIRE_SWING_POSITION.z
  );
  const ropeMat = new StandardMaterial('ropeMat', scene);
  ropeMat.diffuseColor = COLORS.rope.clone();
  rope.material = ropeMat;

  // Tire
  const tire = MeshBuilder.CreateTorus('tire', { 
    diameter: 1.5, 
    thickness: 0.3 
  }, scene);
  tire.position = new Vector3(
    TIRE_SWING_POSITION.x,
    1.5,
    TIRE_SWING_POSITION.z
  );
  tire.rotation.x = Math.PI / 2;
  const tireMat = new StandardMaterial('tireMat', scene);
  tireMat.diffuseColor = COLORS.tire.clone();
  tire.material = tireMat;

  return { rope, ropeMat, tire, tireMat };
}
