/**
 * Culling - disable heavy meshes when far
 */

import { Mesh, Vector3 } from '@babylonjs/core';

export interface CullableObject {
  mesh: Mesh;
  cullDistance: number;
  importance: 'low' | 'medium' | 'high';
}

export class CullingSystem {
  private objects: CullableObject[] = [];

  register(obj: CullableObject): void {
    this.objects.push(obj);
  }

  unregister(mesh: Mesh): void {
    this.objects = this.objects.filter((obj) => obj.mesh !== mesh);
  }

  update(cameraPosition: Vector3, aggressiveCulling = false): void {
    this.objects.forEach((obj) => {
      const distance = Vector3.Distance(cameraPosition, obj.mesh.position);
      const effectiveCullDistance = aggressiveCulling
        ? obj.cullDistance * 0.7
        : obj.cullDistance;

      obj.mesh.setEnabled(distance < effectiveCullDistance);
    });
  }

  setAllEnabled(enabled: boolean): void {
    this.objects.forEach((obj) => obj.mesh.setEnabled(enabled));
  }
}
