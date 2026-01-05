/**
 * Terrain conforming - Quaternion alignment utility
 * Aligns grass instances to terrain normal while preserving random yaw
 */

import { Quaternion, Vector3 } from '@babylonjs/core';

/**
 * Compute rotation quaternion that tilts from world Up to terrain normal,
 * then applies yaw rotation around the normal
 * 
 * @param normal - Terrain surface normal (should be normalized)
 * @param yawRad - Yaw rotation in radians around the normal axis
 * @returns Quaternion representing tilt + yaw rotation
 */
export function rotationFromUpToNormalWithYaw(
  normal: Vector3,
  yawRad: number
): Quaternion {
  const up = Vector3.Up();
  const normalNorm = normal.clone().normalize();

  // Compute rotation axis (perpendicular to both Up and normal)
  const axis = Vector3.Cross(up, normalNorm);
  const axisLengthSq = axis.lengthSquared();

  let qTilt: Quaternion;

  if (axisLengthSq < 1e-6) {
    // Up and normal are parallel (or anti-parallel)
    const dot = Vector3.Dot(up, normalNorm);
    if (dot > 0.999) {
      // Already aligned
      qTilt = Quaternion.Identity();
    } else {
      // 180° flip - choose arbitrary perpendicular axis
      qTilt = Quaternion.RotationAxis(Vector3.Right(), Math.PI);
    }
  } else {
    // Compute tilt angle
    const dot = Vector3.Dot(up, normalNorm);
    const dotClamped = Math.max(-1, Math.min(1, dot));
    const angle = Math.acos(dotClamped);
    
    axis.normalize();
    qTilt = Quaternion.RotationAxis(axis, angle);
  }

  // Apply yaw rotation around the terrain normal
  const qYaw = Quaternion.RotationAxis(normalNorm, yawRad);

  // Combine: yaw * tilt (order matters for quaternions)
  return qYaw.multiply(qTilt);
}
