/**
 * Debug gizmos - show radii, nav hints, spawn points
 */

import { Scene, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export class DebugGizmos {
  private scene: Scene;
  private enabled = false;
  private gizmos: any[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.gizmos.forEach((gizmo) => gizmo.setEnabled(enabled));
  }

  showRadius(x: number, y: number, z: number, radius: number, color = Color3.Yellow()): void {
    const circle = MeshBuilder.CreateTorus(
      'radiusGizmo',
      { diameter: radius * 2, thickness: 0.1, tessellation: 32 },
      this.scene
    );
    circle.position.set(x, y, z);
    circle.rotation.x = Math.PI / 2;

    const material = new StandardMaterial('gizmoMat', this.scene);
    material.emissiveColor = color;
    material.wireframe = true;
    circle.material = material;

    circle.setEnabled(this.enabled);
    this.gizmos.push(circle);
  }

  showSpawnPoint(x: number, y: number, z: number): void {
    const marker = MeshBuilder.CreateSphere('spawnMarker', { diameter: 0.5 }, this.scene);
    marker.position.set(x, y, z);

    const material = new StandardMaterial('spawnMat', this.scene);
    material.emissiveColor = Color3.Green();
    marker.material = material;

    marker.setEnabled(this.enabled);
    this.gizmos.push(marker);
  }

  clear(): void {
    this.gizmos.forEach((gizmo) => gizmo.dispose());
    this.gizmos = [];
  }
}
