/**
 * Pine World - Pine tree creation
 */

import {
  type AbstractMesh,
  MeshBuilder,
  type Scene,
  type StandardMaterial,
  TransformNode,
} from '@babylonjs/core';
import type { Vector3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';

export function createPineTree(
  scene: Scene,
  bag: DisposableBag,
  position: Vector3,
  type: 'whitePine' | 'redPine' | 'spruce' | 'hemlock',
  height: number,
  trunkMat: StandardMaterial,
  canopyMat: StandardMaterial
): AbstractMesh[] {
  const meshes: AbstractMesh[] = [];
  const parent = new TransformNode(`tree_${type}_${Math.round(position.x)}_${Math.round(position.z)}`, scene);
  parent.position = position;

  const trunkHeight = height * 0.62;
  const trunkDia = Math.max(0.45, height * 0.085);

  const trunk = bag.trackMesh(
    MeshBuilder.CreateCylinder('trunk', { height: trunkHeight, diameter: trunkDia, tessellation: 8 }, scene)
  );
  trunk.parent = parent;
  trunk.position.y = trunkHeight * 0.5;
  trunk.material = trunkMat;
  trunk.receiveShadows = true;
  meshes.push(trunk);

  // Canopy: 2 stacked cones for a more "pine" silhouette
  const canopyH1 = height * 0.34;
  const canopyD1 = height * 0.34;

  const canopy1 = bag.trackMesh(
    MeshBuilder.CreateCylinder(
      'canopy1',
      {
        height: canopyH1,
        diameterTop: 0.2,
        diameterBottom: canopyD1,
        tessellation: 8,
      },
      scene
    )
  );
  canopy1.parent = parent;
  canopy1.position.y = trunkHeight + canopyH1 * 0.5;
  canopy1.material = canopyMat;
  canopy1.receiveShadows = true;
  meshes.push(canopy1);

  const canopyH2 = height * 0.26;
  const canopyD2 = height * 0.24;

  const canopy2 = bag.trackMesh(
    MeshBuilder.CreateCylinder(
      'canopy2',
      {
        height: canopyH2,
        diameterTop: 0.15,
        diameterBottom: canopyD2,
        tessellation: 8,
      },
      scene
    )
  );
  canopy2.parent = parent;
  canopy2.position.y = trunkHeight + canopyH1 * 0.8;
  canopy2.material = canopyMat;
  canopy2.receiveShadows = true;
  meshes.push(canopy2);

  return meshes;
}
