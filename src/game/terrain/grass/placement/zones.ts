/**
 * Grass placement exclusion zones
 * Pure functions for testing whether positions are excluded
 */

import type { ExclusionZone } from '../types';

/**
 * Compute squared distance from point (px, pz) to line segment (ax, az) -> (bx, bz) in XZ plane
 * @param px - Point X coordinate
 * @param pz - Point Z coordinate
 * @param ax - Segment start X
 * @param az - Segment start Z
 * @param bx - Segment end X
 * @param bz - Segment end Z
 * @returns Squared distance to closest point on segment
 */
function distSqPointToSegmentXZ(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq < 1e-10) {
    // Degenerate segment (point)
    const dpx = px - ax;
    const dpz = pz - az;
    return dpx * dpx + dpz * dpz;
  }

  // Project point onto line, clamp to segment
  const dpx = px - ax;
  const dpz = pz - az;
  const dot = dpx * dx + dpz * dz;
  const t = Math.max(0, Math.min(1, dot / lengthSq));

  // Closest point on segment
  const closestX = ax + t * dx;
  const closestZ = az + t * dz;

  // Squared distance
  const distX = px - closestX;
  const distZ = pz - closestZ;
  return distX * distX + distZ * distZ;
}

/**
 * Test whether a position (x, z) is excluded by any exclusion zone
 * 
 * Pure function - no side effects, allocation-free
 * 
 * @param x - World X coordinate
 * @param z - World Z coordinate
 * @param zones - Array of exclusion zones (optional)
 * @returns true if position is excluded, false otherwise
 */
export function isExcludedXZ(x: number, z: number, zones?: ExclusionZone[]): boolean {
  if (!zones || zones.length === 0) {
    return false;
  }

  for (const zone of zones) {
    if (zone.kind === 'rect') {
      // Rectangular exclusion zone
      const halfWidth = zone.width / 2;
      const halfDepth = zone.depth / 2;
      
      const inX = Math.abs(x - zone.centerX) <= halfWidth;
      const inZ = Math.abs(z - zone.centerZ) <= halfDepth;
      
      if (inX && inZ) {
        return true;
      }
    } else if (zone.kind === 'circle') {
      // Circular exclusion zone
      const dx = x - zone.centerX;
      const dz = z - zone.centerZ;
      const distSq = dx * dx + dz * dz;
      
      if (distSq <= zone.radius * zone.radius) {
        return true;
      }
    } else if (zone.kind === 'corridor') {
      // Corridor exclusion zone (polyline with width)
      const points = zone.points;
      if (points.length < 2) {
        continue; // Invalid corridor, skip
      }

      const halfWidth = zone.width / 2;
      const halfWidthSq = halfWidth * halfWidth;

      // Check distance to all segments
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const distSq = distSqPointToSegmentXZ(x, z, a.x, a.z, b.x, b.z);
        
        if (distSq <= halfWidthSq) {
          return true;
        }
      }
    }
  }

  return false;
}
