import { AbstractMesh, Mesh, Quaternion } from '@babylonjs/core';

/**
 * Normalizes meshes for thin instances by baking transforms into vertices.
 * This removes root/child transform weirdness and makes thin-instance matrices
 * behave as normal world matrices.
 */
export function normalizeMeshesForThinInstances(meshes: AbstractMesh[]): Mesh[] {
  const out: Mesh[] = [];

  for (const m of meshes) {
    if (!(m instanceof Mesh)) continue;
    if (!m.geometry) continue; // thin instances need geometry

    // Make sure world matrix is up to date (includes parent/root transforms)
    m.computeWorldMatrix(true);

    // Bake *current* transform (including parent) into vertices
    m.bakeCurrentTransformIntoVertices();

    // Detach from any root after baking
    m.setParent(null);

    // Hard reset transforms to identity
    m.position.copyFromFloats(0, 0, 0);
    m.scaling.copyFromFloats(1, 1, 1);
    m.rotationQuaternion = Quaternion.Identity();
    m.rotation.copyFromFloats(0, 0, 0);

    m.computeWorldMatrix(true);
    m.refreshBoundingInfo(true);

    out.push(m);
  }

  return out;
}

/**
 * Computes foot offset Y so trees sit on the ground.
 * Uses trunk mesh as grounding reference.
 */
export function computeFootOffsetY(trunk: Mesh): number {
  trunk.refreshBoundingInfo(true);
  // local-space min Y; negative means geometry extends below origin
  const minY = trunk.getBoundingInfo().boundingBox.minimum.y;
  return -minY;
}
