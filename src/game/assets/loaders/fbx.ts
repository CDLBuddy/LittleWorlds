/**
 * FBX loading utilities with AssetContainer support
 */

import { 
  Scene, 
  SceneLoader, 
  TransformNode, 
  AbstractMesh, 
  AnimationGroup 
} from '@babylonjs/core';
// Import loaders - FBX support should be auto-detected
import '@babylonjs/loaders';

export type FbxLoadResult = {
  root: TransformNode;
  meshes: AbstractMesh[];
  animationGroups: AnimationGroup[];
};

/**
 * Load an FBX file and return a unified root with all meshes and animations
 * @param scene Babylon scene
 * @param url Full URL to FBX file
 * @param opts Optional configuration
 * @returns Root transform node with all imported content
 */
export async function loadFbx(
  scene: Scene,
  url: string,
  opts?: { name?: string; isPickable?: boolean; receiveShadows?: boolean }
): Promise<FbxLoadResult> {
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
    
    console.log(`[FBX Loader] Loaded ${url}:`, {
      meshes: meshes.length,
      animations: animationGroups.length,
      animationNames: animationGroups.map(g => g.name)
    });
    
    return {
      root,
      meshes,
      animationGroups
    };
  } catch (error) {
    console.error(`Failed to load FBX: ${url}`, error);
    throw error;
  }
}
