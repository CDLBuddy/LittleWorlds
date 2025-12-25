/**
 * Axe interactable
 */

import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, AbstractMesh } from '@babylonjs/core';

export class Axe {
  id: string;
  mesh: AbstractMesh;
  private onInteractCallback: (() => void) | null = null;

  constructor(scene: Scene, position: Vector3, id: string) {
    this.id = id;
    
    // Create simple axe mesh (box for now)
    this.mesh = MeshBuilder.CreateBox(
      id, // Use id as mesh name for easy lookup
      { width: 0.3, height: 1.0, depth: 0.1 },
      scene
    );
    this.mesh.position = position.clone();
    this.mesh.position.y = 0.5; // Hover above ground
    
    const mat = new StandardMaterial('axeMat', scene);
    mat.diffuseColor = new Color3(0.6, 0.4, 0.2); // Wood handle
    mat.emissiveColor = new Color3(0.2, 0.15, 0.1);
    this.mesh.material = mat;
  }

  onInteract(callback: () => void): void {
    this.onInteractCallback = callback;
  }

  interact(): void {
    this.onInteractCallback?.();
    this.mesh.setEnabled(false); // Hide after pickup
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
