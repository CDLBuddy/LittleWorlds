/**
 * GLTF/GLB loading utilities with AssetContainer support
 */

import { 
  Scene, 
  AssetContainer, 
  SceneLoader, 
  TransformNode, 
  AbstractMesh, 
  AnimationGroup 
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export type GltfLoadResult = {
  root: TransformNode;
  meshes: AbstractMesh[];
  animationGroups: AnimationGroup[];
};

/**
 * Load a GLB file and return a unified root with all meshes and animations
 * @param scene Babylon scene
 * @param url Full URL to GLB file
 * @param opts Optional configuration
 * @returns Root transform node with all imported content
 */
export async function loadGlb(
  scene: Scene,
  url: string,
  opts?: { name?: string; isPickable?: boolean; receiveShadows?: boolean }
): Promise<GltfLoadResult> {
  const name = opts?.name || 'imported';
  const isPickable = opts?.isPickable ?? false;
  const receiveShadows = opts?.receiveShadows ?? true;
  
  try {
    // Import the mesh
    const result = await SceneLoader.ImportMeshAsync('', '', url, scene);
    
    // Create a root transform node to parent everything
    const root = new TransformNode(`${name}_root`, scene);
    
    // Parent all imported meshes to the root
    const meshes: AbstractMesh[] = [];
    result.meshes.forEach((mesh) => {
      if (mesh.parent === null) {
        mesh.parent = root;
      }
      if (mesh instanceof AbstractMesh) {
        mesh.isPickable = isPickable;
        mesh.receiveShadows = receiveShadows;
        meshes.push(mesh);
      }
    });
    
    // Collect animation groups
    const animationGroups = result.animationGroups || [];
    
    // console.log(`[GLB Loader] Loaded ${url}:`, {
    //   meshes: meshes.length,
    //   animations: animationGroups.length,
    //   animationNames: animationGroups.map(g => g.name)
    // });
    
    return {
      root,
      meshes,
      animationGroups
    };
  } catch (error) {
    console.error(`Failed to load GLB: ${url}`, error);
    throw error;
  }
}

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
