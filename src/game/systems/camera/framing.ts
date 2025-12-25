/**
 * Camera framing - "look at target" nudge for guidance
 */

import { Vector3 } from '@babylonjs/core';

export function calculateFramingOffset(
  cameraTarget: Vector3,
  pointOfInterest: Vector3,
  strength = 0.3
): Vector3 {
  const direction = pointOfInterest.subtract(cameraTarget);
  return direction.scale(strength);
}

export function smoothFraming(
  current: Vector3,
  target: Vector3,
  smoothing = 0.05
): Vector3 {
  return Vector3.Lerp(current, target, smoothing);
}
