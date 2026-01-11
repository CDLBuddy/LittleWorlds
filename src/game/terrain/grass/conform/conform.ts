/**
 * Terrain conforming helper with tilt clamping
 * Unified interface for heightFn and raycast-based terrain sampling
 */

import { Scene, Ray, Vector3 } from '@babylonjs/core';
import type { AbstractMesh } from '@babylonjs/core';

// Reusable vectors to avoid allocations
const tempRayOrigin = new Vector3();
const tempRayDir = Vector3.Down();
const tempUp = Vector3.Up();

export type ConformConfig =
  | { kind: 'none' }
  | {
      kind: 'raycast';
      pickMeshes: AbstractMesh[];
      rayStartY?: number;
      rayLength?: number;
      yOffset?: number;
      alignToNormal?: boolean;
      maxTiltDeg?: number;
    }
  | {
      kind: 'heightFn';
      heightAtXZ: (x: number, z: number) => number | null;
      normalAtXZ?: (x: number, z: number) => Vector3 | null;
      normalEps?: number;
      yOffset?: number;
      alignToNormal?: boolean;
      maxTiltDeg?: number;
    };

export interface ConformResult {
  y: number;
  normal: Vector3;
}

/**
 * Sample terrain at XZ position with optional tilt clamping
 * @param scene - Babylon scene (for raycasting)
 * @param x - World X coordinate
 * @param z - World Z coordinate
 * @param conform - Conform configuration
 * @returns Conform result with y and normal, or null if no valid ground
 */
export function conformAtXZ(
  scene: Scene,
  x: number,
  z: number,
  conform: ConformConfig | undefined
): ConformResult | null {
  if (!conform || conform.kind === 'none') {
    return null;
  }

  let y = 0;
  let normal = tempUp.clone();

  if (conform.kind === 'raycast') {
    const rayStartY = conform.rayStartY ?? 50;
    const rayLength = conform.rayLength ?? 200;

    tempRayOrigin.set(x, rayStartY, z);
    const ray = new Ray(tempRayOrigin, tempRayDir, rayLength);

    const hit = scene.pickWithRay(
      ray,
      (mesh) => conform.pickMeshes.some((m) => m === mesh)
    );

    if (!hit || !hit.hit || !hit.pickedPoint) {
      return null;
    }

    y = hit.pickedPoint.y + (conform.yOffset ?? 0);
    normal = hit.getNormal(true, false) ?? tempUp.clone();
  } else if (conform.kind === 'heightFn') {
    const y0 = conform.heightAtXZ(x, z);
    if (y0 === null) {
      return null;
    }

    y = y0 + (conform.yOffset ?? 0);

    // Get or estimate normal
    if (conform.normalAtXZ) {
      const n = conform.normalAtXZ(x, z);
      if (n) {
        normal = n.clone();
      }
    } else {
      // Estimate normal via central differences
      const eps = conform.normalEps ?? 0.75;
      const yN = conform.heightAtXZ(x, z + eps) ?? y0;
      const yS = conform.heightAtXZ(x, z - eps) ?? y0;
      const yE = conform.heightAtXZ(x + eps, z) ?? y0;
      const yW = conform.heightAtXZ(x - eps, z) ?? y0;

      // Cross product of tangent vectors
      const dx = new Vector3(2 * eps, yE - yW, 0);
      const dz = new Vector3(0, yN - yS, 2 * eps);
      normal = Vector3.Cross(dz, dx).normalize();
    }
  }

  // Clamp tilt if maxTiltDeg specified
  if (conform.maxTiltDeg !== undefined && conform.alignToNormal !== false) {
    const maxTiltRad = (conform.maxTiltDeg * Math.PI) / 180;
    const dot = Vector3.Dot(normal, tempUp);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    if (angle > maxTiltRad) {
      // Blend toward Up to reduce tilt
      const blend = maxTiltRad / angle;
      normal = Vector3.Lerp(tempUp, normal, blend).normalize();
    }
  }

  return { y, normal };
}
