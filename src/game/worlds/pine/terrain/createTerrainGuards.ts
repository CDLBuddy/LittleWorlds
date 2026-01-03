/**
 * Pine World - Terrain safety guards
 */

import { type AbstractMesh, MeshBuilder, type Scene } from '@babylonjs/core';
import { PINE_TERRAIN } from '../config/constants';
import type { DisposableBag } from '../utils/DisposableBag';

export function createTerrainGuards(scene: Scene, bag: DisposableBag): AbstractMesh[] {
  const { width, halfDepth, maxRise } = PINE_TERRAIN;
  const guards: AbstractMesh[] = [];

  // Invisible apron beyond the north edge (prevents "fell off the world")
  const northApron = bag.trackMesh(
    MeshBuilder.CreateGround('pine_north_apron', {
      width: width + 60,
      height: 120,
    }, scene)
  );

  northApron.position.set(0, maxRise, -halfDepth - 60);
  northApron.isVisible = false;
  northApron.isPickable = true;
  northApron.checkCollisions = true;
  guards.push(northApron);

  // Optional catch floor far below (debug safety)
  const catchFloor = bag.trackMesh(
    MeshBuilder.CreateGround('pine_catch_floor', {
      width: 800,
      height: 800,
    }, scene)
  );

  catchFloor.position.y = -120;
  catchFloor.isVisible = false;
  catchFloor.isPickable = false;
  catchFloor.checkCollisions = true;
  guards.push(catchFloor);

  return guards;
}
