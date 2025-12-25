/**
 * Companion steering - lightweight movement/avoid
 */

import { Vector3 } from '@babylonjs/core';

export class SteeringBehavior {
  seek(current: Vector3, target: Vector3, speed: number): Vector3 {
    const direction = target.subtract(current);
    direction.normalize();
    return direction.scale(speed);
  }

  follow(current: Vector3, target: Vector3, followDistance: number, speed: number): Vector3 {
    const distance = Vector3.Distance(current, target);
    
    if (distance > followDistance) {
      return this.seek(current, target, speed);
    }
    
    return Vector3.Zero();
  }

  avoid(current: Vector3, obstacle: Vector3, avoidRadius: number): Vector3 {
    const toObstacle = obstacle.subtract(current);
    const distance = toObstacle.length();
    
    if (distance < avoidRadius && distance > 0) {
      const avoidDirection = toObstacle.scale(-1 / distance);
      return avoidDirection;
    }
    
    return Vector3.Zero();
  }
}
