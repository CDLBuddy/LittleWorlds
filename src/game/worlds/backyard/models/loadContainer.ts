/**
 * Backyard World - Asset Container Loading Wrapper
 * Modern promise-based loading with disposal guards
 */

import { loadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import type { Scene, AssetContainer, ISceneLoaderProgressEvent } from '@babylonjs/core';

export interface LoadContainerOpts {
  scene: Scene;
  url: string;
  rootUrl?: string;
  onProgress?: (event: ISceneLoaderProgressEvent) => void;
  addToScene?: boolean;
  /** Optional callback to check if world is still alive before adding to scene */
  getIsAlive?: () => boolean;
}

/**
 * Load a .glb/.gltf model as an AssetContainer with proper disposal guards
 * 
 * Benefits:
 * - Tree-shakeable (module-level function)
 * - Promise-based (no callbacks)
 * - Prevents ghost meshes if world disposed during load
 * - Container pattern allows instancing without re-loading
 */
export async function loadContainer(opts: LoadContainerOpts): Promise<AssetContainer> {
  const { scene, url, rootUrl = 'assets/models/', onProgress, addToScene = true, getIsAlive } = opts;

  // Load the asset container (does NOT add to scene yet)
  const container = await loadAssetContainerAsync(
    rootUrl + url,
    scene,
    { onProgress }
  );

  // Guard: if world was disposed during await, clean up and bail
  if (getIsAlive && !getIsAlive()) {
    console.warn(`[loadContainer] World disposed during load of ${url}, cleaning up`);
    container.dispose();
    throw new Error('World disposed during asset load');
  }

  // Add to scene if requested (default behavior)
  if (addToScene) {
    container.addAllToScene();
  }

  return container;
}
