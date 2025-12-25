/**
 * GLTF/GLB loading utilities with AssetContainer support
 */

import { Scene, AssetContainer, SceneLoader } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export async function loadGltf(
  scene: Scene,
  path: string,
  filename: string
): Promise<AssetContainer> {
  try {
    const container = await SceneLoader.LoadAssetContainerAsync(
      path,
      filename,
      scene
    );
    return container;
  } catch (error) {
    console.error(`Failed to load GLTF: ${path}${filename}`, error);
    throw error;
  }
}

export async function loadGltfFromUrl(
  scene: Scene,
  url: string
): Promise<AssetContainer> {
  const lastSlash = url.lastIndexOf('/');
  const path = url.substring(0, lastSlash + 1);
  const filename = url.substring(lastSlash + 1);
  return loadGltf(scene, path, filename);
}
