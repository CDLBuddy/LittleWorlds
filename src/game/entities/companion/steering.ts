/**
 * Companion steering - lightweight movement/avoid
 */

import { Vector3 } from '@babylonjs/core';

export interface SteeringResult {
  velocity: Vector3;
  arrived: boolean;
}

export function seek(
  currentPos: Vector3,
  targetPos: Vector3,
  maxSpeed: number,
  dt: number,
  arrivalRadius = 1.0
): SteeringResult {
  // Guard against invalid dt (first frame can be 0)
  if (dt <= 0.0001) {
    return { velocity: Vector3.Zero(), arrived: false };
  }
  
  const direction = targetPos.subtract(currentPos);
  direction.y = 0; // Keep on ground plane
  const distance = direction.length();
  
  // Check if already at target or distance too small to calculate direction
  if (distance < arrivalRadius || distance < 0.001) {
    return { velocity: Vector3.Zero(), arrived: true };
  }
  
  direction.normalize();
  const moveDistance = Math.min(maxSpeed * dt, distance);
  
  return {
    velocity: direction.scale(moveDistance / dt),
    arrived: false,
  };
}
