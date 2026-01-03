/**
 * Pine World - Polyline subdivision
 */

import { Vector3 } from '@babylonjs/core';

export function subdividePolyline(points: Vector3[], stepsPerSeg: number) {
  const out: Vector3[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg;
      out.push(Vector3.Lerp(a, b, t));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
