/**
 * Pine World - Polyline subdivision
 * Smoothly subdivide polylines for high-quality curves
 */

import { Vector3 } from '@babylonjs/core';

/**
 * Subdivide a polyline with linear interpolation
 * Creates smooth curves from control points
 * 
 * @param points - Control points defining the polyline
 * @param stepsPerSeg - Number of interpolation steps per segment
 * @returns High-resolution point array
 */
export function subdividePolyline(points: Vector3[], stepsPerSeg: number): Vector3[] {
  if (points.length < 2) return [...points];
  
  const out: Vector3[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    
    // Add interpolated points
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg;
      out.push(Vector3.Lerp(a, b, t));
    }
  }
  
  // Add final point
  out.push(points[points.length - 1]);
  
  return out;
}
