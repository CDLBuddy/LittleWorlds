/**
 * Backyard World - Sandbox prop with wooden border
 */

import { Vector3, MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';
import { SANDBOX_POSITION, COLORS } from '../config/constants';

export function createSandbox(scene: Scene) {
  // Main sandbox
  const sandbox = MeshBuilder.CreateBox('sandbox', { 
    width: 3, 
    height: 0.3, 
    depth: 3 
  }, scene);
  sandbox.position = SANDBOX_POSITION.clone();
  const sandMat = new StandardMaterial('sandMat', scene);
  sandMat.diffuseColor = COLORS.sand.clone();
  sandbox.material = sandMat;

  // Sandbox border pieces
  const borders: { mesh: any; material: StandardMaterial }[] = [];
  const borderMat = new StandardMaterial('borderMat', scene);
  borderMat.diffuseColor = COLORS.sandboxBorder.clone();

  const createBorder = (pos: Vector3, width: number, depth: number) => {
    const border = MeshBuilder.CreateBox('sandboxBorder', { 
      width, 
      height: 0.4, 
      depth 
    }, scene);
    border.position = pos;
    border.material = borderMat;
    return border;
  };

  const frontBorder = createBorder(new Vector3(-7.5, 0.2, 4.0), 3.2, 0.2);  // Front
  const backBorder = createBorder(new Vector3(-7.5, 0.2, 7.0), 3.2, 0.2);   // Back
  const leftBorder = createBorder(new Vector3(-9.0, 0.2, 5.5), 0.2, 3.2);   // Left
  const rightBorder = createBorder(new Vector3(-6.0, 0.2, 5.5), 0.2, 3.2);  // Right

  borders.push(
    { mesh: frontBorder, material: borderMat },
    { mesh: backBorder, material: borderMat },
    { mesh: leftBorder, material: borderMat },
    { mesh: rightBorder, material: borderMat }
  );

  return { sandbox, sandMat, borders, borderMat };
}
