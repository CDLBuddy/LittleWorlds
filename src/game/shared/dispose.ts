/**
 * Safe disposal utilities for Babylon.js resources
 */

import { Scene, Mesh, Material, Texture } from '@babylonjs/core';

export function disposeMesh(mesh: Mesh | null | undefined): void {
  if (!mesh) return;
  mesh.dispose(false, true);
}

export function disposeMaterial(material: Material | null | undefined): void {
  if (!material) return;
  material.dispose(true, true);
}

export function disposeTexture(texture: Texture | null | undefined): void {
  if (!texture) return;
  texture.dispose();
}

export function disposeScene(scene: Scene | null | undefined): void {
  if (!scene) return;
  scene.dispose();
}

export class DisposableGroup {
  private disposables: Array<() => void> = [];

  add(disposeFn: () => void): void {
    this.disposables.push(disposeFn);
  }

  addMesh(mesh: Mesh): void {
    this.add(() => disposeMesh(mesh));
  }

  addMaterial(material: Material): void {
    this.add(() => disposeMaterial(material));
  }

  disposeAll(): void {
    this.disposables.forEach((fn) => fn());
    this.disposables = [];
  }
}
