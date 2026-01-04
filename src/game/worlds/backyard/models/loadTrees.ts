/**
 * Backyard World - Trees and bushes loader with random variety
 */

import { Vector3, TransformNode, type Scene } from '@babylonjs/core';
import { loadContainer } from './loadContainer';
import { TREE_POSITIONS } from '../config/constants';

/**
 * Load TreesBushes.glb and place with random variety at specified positions
 */
export async function loadTrees(scene: Scene, getIsAlive: () => boolean): Promise<void> {
  const container = await loadContainer({
    scene,
    url: 'TreesBushes.glb',
    getIsAlive,
  });

  const meshes = container.meshes;
  // console.log('[Backyard] Loaded trees, mesh count:', meshes.length);
  
  if (meshes.length > 0) {
    // Find parent nodes that have geometry children (tree1, tree2, Plano.* etc)
    const treeRoots = meshes.filter(m => {
      const hasRootParent = m.parent?.name === '__root__';
      const hasGeometryChildren = m.getChildMeshes().some(child => child.getTotalVertices() > 0);
      return hasRootParent && hasGeometryChildren;
    });
    
    // console.log('[Backyard] Found tree parent nodes:', treeRoots.length, treeRoots.map(m => m.name));
    
    if (treeRoots.length > 0) {
      // Disable originals
      treeRoots.forEach(root => {
        root.setEnabled(false);
        root.getChildMeshes().forEach(child => child.setEnabled(false));
      });
      
      // Create tree instances at specified positions with random variety
      TREE_POSITIONS.forEach((tree, idx) => {
        // Randomly pick a tree parent for variety
        const randomRoot = treeRoots[Math.floor(Math.random() * treeRoots.length)];
        
        // Create a new parent node at our desired position
        const newParent = new TransformNode(`tree_parent_${idx}`, scene);
        newParent.position = tree.pos.clone();
        newParent.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        newParent.scaling = new Vector3(tree.scale, tree.scale, tree.scale);
        
        // Clone all children of the selected tree/bush into our new parent
        randomRoot.getChildMeshes(false).forEach((child, childIdx) => {
          const childClone = child.clone(`tree_${idx}_child_${childIdx}`, newParent);
          if (childClone) {
            // Store the child's local transform relative to its original parent
            const localPos = child.position.clone();
            const localRot = child.rotation.clone();
            const localScale = child.scaling.clone();
            
            // Apply those local transforms to the clone
            childClone.position = localPos;
            childClone.rotation = localRot;
            childClone.scaling = localScale;
            childClone.setEnabled(true);
          }
        });
        
        newParent.setEnabled(true);
      });
    }
  }
}
