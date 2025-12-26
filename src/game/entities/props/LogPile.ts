/**
 * Log pile interactable
 */

import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, AbstractMesh } from '@babylonjs/core';

export class LogPile {
  id: string;
  mesh: AbstractMesh;
  private onInteractCallback: (() => void) | null = null;

  constructor(scene: Scene, position: Vector3, id: string) {
    this.id = id;
    
    // Create log pile mesh (cylinder stack)
    this.mesh = MeshBuilder.CreateCylinder(
      id, // Use id as mesh name
      { height: 0.8, diameter: 1.5 },
      scene
    );
    this.mesh.position = position.clone();
    this.mesh.position.y = 0.4;
    
    const mat = new StandardMaterial('logpileMat', scene);
    mat.diffuseColor = new Color3(0.5, 0.3, 0.1); // Dark wood
    mat.emissiveColor = new Color3(0.15, 0.1, 0.05);
    this.mesh.material = mat;
  }

  onInteract(callback: () => void): void {
    this.onInteractCallback = callback;
  }

  interact(): void {
    this.onInteractCallback?.();
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
