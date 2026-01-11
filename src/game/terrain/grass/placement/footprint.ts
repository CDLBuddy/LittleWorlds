/**
 * Mesh footprint measurement for auto-spacing
 * Measures XZ bounds to derive optimal spacing for non-square grass assets
 */

import type { AbstractMesh } from '@babylonjs/core';

export interface MeshFootprintXZ {
  /** Width in X axis (world space) */
  sizeX: number;
  /** Depth in Z axis (world space) */
  sizeZ: number;
  /** Minimum diameter (smallest dimension) */
  diameterMin: number;
  /** Maximum diameter (largest dimension) */
  diameterMax: number;
}

/**
 * Measure mesh footprint in XZ plane (world space)
 * Used for auto-spacing calculation with circular/non-square patches
 * 
 * @param mesh - Template mesh to measure
 * @returns Footprint dimensions in world space
 */
export function measureFootprintXZ(mesh: AbstractMesh): MeshFootprintXZ {
  // Ensure world matrix is up to date
  mesh.computeWorldMatrix(true);

  // Get bounding box
  const boundingInfo = mesh.getBoundingInfo();
  const extend = boundingInfo.boundingBox.extendSizeWorld;

  // Calculate sizes (extent is half-size, so double it)
  const sizeX = extend.x * 2;
  const sizeZ = extend.z * 2;

  // Calculate min/max diameters
  const diameterMin = Math.min(sizeX, sizeZ);
  const diameterMax = Math.max(sizeX, sizeZ);

  return {
    sizeX,
    sizeZ,
    diameterMin,
    diameterMax,
  };
}
