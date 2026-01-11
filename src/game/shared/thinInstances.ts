/**
 * Thin Instance Helper Utilities
 * 
 * Efficient batch creation of thin instances for high-volume static meshes
 * (grass, flowers, fence pickets, etc.)
 * 
 * Thin instances don't create scene nodes - they're render-only.
 * This trades per-instance manipulation for massive performance gains.
 */

import { Matrix, Mesh, Quaternion, Vector3 } from '@babylonjs/core';

/**
 * Transform parameters for a single thin instance
 */
export interface ThinInstanceTransform {
  position: Vector3;
  rotation?: Quaternion; // Optional: use for terrain-aligned instances
  rotationY?: number;    // Optional: use for simple yaw-only rotation
  scale?: Vector3 | number; // Optional: uniform scale (number) or per-axis (Vector3)
}

/**
 * Build a matrix array from transform parameters
 * Optimized for batch creation
 */
export function buildThinInstanceMatrices(transforms: ThinInstanceTransform[]): Float32Array {
  const count = transforms.length;
  const data = new Float32Array(count * 16);
  
  const tempMatrix = Matrix.Identity();
  const tempPosition = Vector3.Zero();
  const tempRotation = Quaternion.Identity();
  const tempScale = Vector3.One();
  
  for (let i = 0; i < count; i++) {
    const t = transforms[i];
    
    // Position
    tempPosition.copyFrom(t.position);
    
    // Rotation (quaternion if provided, else from Y rotation, else identity)
    if (t.rotation) {
      tempRotation.copyFrom(t.rotation);
    } else if (t.rotationY !== undefined) {
      Quaternion.RotationYawPitchRollToRef(t.rotationY, 0, 0, tempRotation);
    } else {
      tempRotation.set(0, 0, 0, 1);
    }
    
    // Scale (uniform, per-axis, or default)
    if (typeof t.scale === 'number') {
      tempScale.set(t.scale, t.scale, t.scale);
    } else if (t.scale) {
      tempScale.copyFrom(t.scale);
    } else {
      tempScale.set(1, 1, 1);
    }
    
    // Compose matrix
    Matrix.ComposeToRef(tempScale, tempRotation, tempPosition, tempMatrix);
    
    // Write to buffer
    tempMatrix.copyToArray(data, i * 16);
  }
  
  return data;
}

/**
 * Apply thin instances to a mesh in one batch operation
 * 
 * @param mesh - Template mesh (must remain enabled for rendering)
 * @param transforms - Array of transform parameters
 * @param refreshBounds - Whether to refresh bounding info (default: true)
 */
export function applyThinInstances(
  mesh: Mesh,
  transforms: ThinInstanceTransform[],
  refreshBounds = true
): void {
  if (transforms.length === 0) {
    console.warn('[applyThinInstances] No transforms provided');
    return;
  }
  
  // Build matrix buffer
  const matrices = buildThinInstanceMatrices(transforms);
  
  // Apply to mesh (single buffer write)
  mesh.thinInstanceSetBuffer('matrix', matrices, 16, true);
  
  // Refresh bounds so culling works correctly
  if (refreshBounds) {
    mesh.thinInstanceRefreshBoundingInfo(true);
  }
}

/**
 * Helper to create a simple yaw-only transform
 * Common case for grass/flowers with random rotation
 */
export function createYawTransform(
  x: number,
  y: number,
  z: number,
  yaw: number,
  scale: number | Vector3 = 1
): ThinInstanceTransform {
  return {
    position: new Vector3(x, y, z),
    rotationY: yaw,
    scale,
  };
}

/**
 * Helper to create a quaternion-based transform
 * Use for terrain-aligned instances
 */
export function createQuaternionTransform(
  position: Vector3,
  rotation: Quaternion,
  scale: number | Vector3 = 1
): ThinInstanceTransform {
  return {
    position,
    rotation,
    scale,
  };
}
