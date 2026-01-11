/**
 * Template mesh preparation for instancing
 * Handles pivot corrections for circular patches
 */

import { Mesh, Vector3 } from '@babylonjs/core';
import type { AbstractMesh } from '@babylonjs/core';

export interface PrepareTemplateMeshOptions {
  /** Center pivot in XZ plane (prevents offset scatter for circular patches) */
  centerPivotXZ?: boolean;
}

/**
 * Prepare template mesh for thin instancing
 * Applies optional pivot corrections to ensure instances spawn correctly
 * 
 * @param mesh - Template mesh to prepare
 * @param opts - Preparation options
 */
export function prepareTemplateMeshForInstancing(
  mesh: AbstractMesh,
  opts?: PrepareTemplateMeshOptions
): void {
  if (!(mesh instanceof Mesh)) {
    return;
  }

  // Center pivot in XZ plane (keeps Y pivot at base)
  if (opts?.centerPivotXZ) {
    // Compute bounding box in LOCAL space
    const boundingInfo = mesh.getBoundingInfo();
    const center = boundingInfo.boundingBox.center;

    // Set pivot to XZ center, keep Y at base (0)
    mesh.setPivotPoint(new Vector3(center.x, 0, center.z));

    if (import.meta.env.DEV) {
      console.log(`[prepareTemplateMesh] Centered XZ pivot for "${mesh.name}"`);
    }
  }
}
