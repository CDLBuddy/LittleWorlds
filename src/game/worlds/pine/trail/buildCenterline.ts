/**
 * Pine World - Switchback centerline builder
 */

import { Vector3 } from '@babylonjs/core';
import { heightAtXZ } from '../utils/terrain';
import { subdividePolyline } from './subdividePolyline';

export function buildSwitchbackCenterline() {
  // A readable switchback shape from south to north.
  // Keep it simple: long runs + a few turns.
  const pts: Vector3[] = [];

  const add = (x: number, z: number) => {
    const y = heightAtXZ(x, z);
    pts.push(new Vector3(x, y, z));
  };

  // South entry
  add(0, 72);
  add(-8, 58);
  add(-18, 40);
  add(-22, 22);
  // Switchback turn
  add(10, 14);
  add(22, 2);
  add(18, -10);
  // Second switchback
  add(-10, -18);
  add(-22, -30);
  add(-14, -44);
  // Final climb to north
  add(0, -58);
  add(0, -70);

  // Subdivide for smoother ribbon
  return subdividePolyline(pts, 6);
}
