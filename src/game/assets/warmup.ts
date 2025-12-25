/**
 * Shader precompilation and first-frame smoothing
 */

import { Scene, Material, Mesh } from '@babylonjs/core';

export async function warmupShaders(scene: Scene, materials: Material[]): Promise<void> {
  // Force shader compilation
  for (const material of materials) {
    if (material.needAlphaBlending()) {
      // Create a temporary mesh for compilation
      const meshes = scene.meshes.filter((m): m is Mesh => m instanceof Mesh);
      if (meshes.length > 0) {
        await material.forceCompilationAsync(meshes[0]);
      }
    }
  }

  // Wait a frame for compilation
  await new Promise((resolve) => setTimeout(resolve, 16));
}

export function preloadFirstFrame(scene: Scene): Promise<void> {
  return new Promise((resolve) => {
    scene.executeWhenReady(() => {
      // Render once off-screen to compile shaders
      scene.render();
      resolve();
    });
  });
}
