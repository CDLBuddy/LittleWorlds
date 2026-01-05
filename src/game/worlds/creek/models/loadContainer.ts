/**
 * Creek World - Asset container loader
 * Thin wrapper around SceneLoader for container-based loading
 */

import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { AssetContainer, Scene } from '@babylonjs/core';

export interface LoadContainerParams {
  scene: Scene;
  url: string;
  getIsAlive: () => boolean;
}

/**
 * Load asset container from file
 * Returns undefined if world is disposed during async load
 */
export async function loadContainer(params: LoadContainerParams): Promise<AssetContainer | undefined> {
  const { scene, url, getIsAlive } = params;

  // Check if world still alive before async operation
  if (!getIsAlive()) {
    return undefined;
  }

  const container = await SceneLoader.LoadAssetContainerAsync(
    'assets/models/',
    url,
    scene
  );

  // Check again after async load
  if (!getIsAlive()) {
    container.dispose();
    return undefined;
  }

  return container;
}
