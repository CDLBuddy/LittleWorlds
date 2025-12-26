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
  const direction = targetPos.subtract(currentPos);
  direction.y = 0; // Keep on ground plane
  const distance = direction.length();
  
  if (distance < arrivalRadius) {
    return { velocity: Vector3.Zero(), arrived: true };
  }
  
  direction.normalize();
  const moveDistance = Math.min(maxSpeed * dt, distance);
  
  return {
    velocity: direction.scale(moveDistance / dt),
    arrived: false,
  };
}
