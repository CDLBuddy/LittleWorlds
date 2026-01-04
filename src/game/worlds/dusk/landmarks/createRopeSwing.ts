import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
} from '@babylonjs/core';
import { DUSK } from '../config/constants';

export function createRopeSwing(scene: Scene, parent: TransformNode, anchorWorld: Vector3) {
  const root = new TransformNode('dusk_swing_root', scene);
  root.parent = parent;

  // Place root at anchor point
  root.position.copyFrom(anchorWorld);

  const ropeMat = new StandardMaterial('dusk_rope_mat', scene);
  ropeMat.diffuseColor = new Color3(0.42, 0.30, 0.18);
  ropeMat.specularColor = new Color3(0.05, 0.05, 0.05);

  const seatMat = new StandardMaterial('dusk_swing_seat_mat', scene);
  seatMat.diffuseColor = new Color3(0.32, 0.22, 0.14);
  seatMat.emissiveColor = new Color3(0.02, 0.01, 0.0);
  seatMat.specularColor = new Color3(0.08, 0.08, 0.08);

  const ropeLen = 3.2;
  const ropeOffsetX = 0.55;

  const ropeL = MeshBuilder.CreateCylinder('dusk_rope_l', { height: ropeLen, diameter: 0.08, tessellation: 7 }, scene);
  ropeL.parent = root;
  ropeL.position.set(-ropeOffsetX, -ropeLen / 2, 0);
  ropeL.material = ropeMat;
  ropeL.isPickable = false;
  ropeL.checkCollisions = false;

  const ropeR = MeshBuilder.CreateCylinder('dusk_rope_r', { height: ropeLen, diameter: 0.08, tessellation: 7 }, scene);
  ropeR.parent = root;
  ropeR.position.set(ropeOffsetX, -ropeLen / 2, 0);
  ropeR.material = ropeMat;
  ropeR.isPickable = false;
  ropeR.checkCollisions = false;

  // Seat hangs below ropes (offset further down)
  const seat = MeshBuilder.CreateBox('dusk_swing_seat', { width: 1.35, height: 0.16, depth: 0.55 }, scene);
  seat.parent = root;
  seat.position.set(0, -ropeLen - 0.15, 0);
  seat.material = seatMat;
  seat.isPickable = false;
  seat.checkCollisions = false;

  // Slight forward offset to keep it visible
  root.position.y += 0.1;

  return {
    update: (t: number) => {
      // Gentle sway (visual-only)
      root.rotation.z = Math.sin(t * DUSK.SWING_SWAY_SPEED) * DUSK.SWING_SWAY_AMOUNT;
      root.rotation.x = Math.sin(t * (DUSK.SWING_SWAY_SPEED * 0.6) + 1.2) * (DUSK.SWING_SWAY_AMOUNT * 0.45);
    },
    dispose: () => {
      seat.dispose();
      ropeL.dispose();
      ropeR.dispose();
      ropeMat.dispose();
      seatMat.dispose();
      root.dispose();
    },
  };
}
