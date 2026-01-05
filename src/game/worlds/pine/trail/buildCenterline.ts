/**
 * Pine World - Switchback centerline builder
 * Generates the trail path with smooth curves
 */

import { Vector3 } from '@babylonjs/core';
import { heightAtXZ } from '../utils/terrain';
import { subdividePolyline } from './subdividePolyline';

/**
 * Build the main trail centerline
 * Returns high-resolution point array for ribbon + grass exclusion
 */
export function buildSwitchbackCenterline(): Vector3[] {
  const pts: Vector3[] = [];

  const add = (x: number, z: number) => {
    const y = heightAtXZ(x, z);
    pts.push(new Vector3(x, y, z));
  };

  // South entry - gentle approach
  add(0, 72);
  add(-4, 64);
  add(-8, 58);
  add(-14, 48);
  add(-18, 40);
  add(-20, 30);
  add(-22, 22);
  
  // First switchback - wide turn
  add(-18, 16);
  add(-10, 12);
  add(0, 12);
  add(10, 14);
  add(18, 16);
  add(22, 10);
  add(22, 2);
  add(20, -6);
  add(18, -10);
  
  // Second switchback - tighter turn
  add(10, -14);
  add(0, -16);
  add(-10, -18);
  add(-18, -22);
  add(-22, -30);
  add(-20, -38);
  add(-14, -44);
  
  // Final climb to north - straightening out
  add(-8, -50);
  add(0, -58);
  add(0, -70);

  // Subdivide for smooth curves (8 steps per segment for high quality)
  return subdividePolyline(pts, 8);
}

/**
 * Get trail width at a specific point (can vary for visual interest)
 * @param normalizedT - Position along trail (0 = south, 1 = north)
 * @returns Half-width in meters
 */
export function getTrailWidthAt(normalizedT: number): number {
  // Slightly wider in the middle (switchback area) for gameplay
  const widthVariation = 0.5 + Math.sin(normalizedT * Math.PI) * 0.3;
  return 5.0 * widthVariation; // Base 5m half-width, 4.5-5.8m range
}
