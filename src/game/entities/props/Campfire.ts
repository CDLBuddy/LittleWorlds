/**
 * Campfire interactable
 */

import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, AbstractMesh } from '@babylonjs/core';

export class Campfire {
  id: string;
  mesh: AbstractMesh;
  private onInteractCallback: (() => void) | null = null;
  private isLit = false;

  constructor(scene: Scene, position: Vector3, id: string) {
    this.id = id;
    
    // Reuse existing campfire mesh or create new one
    const existing = scene.getMeshByName(id);
    if (existing) {
      this.mesh = existing;
      this.mesh.position = position.clone();
    } else {
      this.mesh = MeshBuilder.CreateCylinder(
        id, // Use id as mesh name
        { height: 0.5, diameter: 1.2 },
        scene
      );
      this.mesh.position = position.clone();
      this.mesh.position.y = 0.25;
      
      const mat = new StandardMaterial('campfireMat', scene);
      mat.diffuseColor = new Color3(0.8, 0.3, 0.1);
      mat.emissiveColor = new Color3(0.4, 0.15, 0.05);
      this.mesh.material = mat;
    }
  }

  onInteract(callback: () => void): void {
    this.onInteractCallback = callback;
  }

  interact(): void {
    if (!this.isLit) {
      this.isLit = true;
      // Brighten emissive when lit
      const mat = this.mesh.material as StandardMaterial;
      if (mat) {
        mat.emissiveColor = new Color3(1.0, 0.4, 0.1);
      }
    }
    this.onInteractCallback?.();
  }

  dispose(): void {
    // Don't dispose mesh if it's the existing one
  }
}
