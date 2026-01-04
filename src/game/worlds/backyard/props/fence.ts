/**
 * Backyard World - White picket fence with instancing
 * PERFORMANCE: Uses template + instances instead of 200+ individual meshes
 */

import { Vector3, MeshBuilder, StandardMaterial, TransformNode, type Scene, type AbstractMesh, type Mesh } from '@babylonjs/core';
import { FENCE_CONFIG, FENCE_SECTIONS, COLORS } from '../config/constants';

/**
 * Create a picket fence section with instanced pickets and simplified collision
 */
function createPicketFence(
  name: string,
  position: Vector3,
  width: number,
  depth: number,
  picketTemplate: Mesh,
  fenceMat: StandardMaterial,
  scene: Scene
): { parent: AbstractMesh; pickets: AbstractMesh[]; collisionBox: AbstractMesh } {
  const { height, picketSpacing, railHeight } = FENCE_CONFIG;
  const pickets: AbstractMesh[] = [];
  
  const parent = new TransformNode(`${name}_parent`, scene);
  parent.position = position;
  
  // Determine if this is a horizontal or vertical fence
  const isHorizontal = width > depth;
  const fenceLength = isHorizontal ? width : depth;
  const numPickets = Math.floor(fenceLength / picketSpacing);
  
  // Create horizontal rails (visual only, collision handled separately)
  const topRail = MeshBuilder.CreateBox(`${name}_topRail`, { 
    width: width, 
    height: railHeight, 
    depth: depth 
  }, scene);
  topRail.position = new Vector3(0, height - 0.2, 0);
  topRail.parent = parent;
  topRail.material = fenceMat;
  topRail.checkCollisions = false; // Rails are just visual
  
  const bottomRail = MeshBuilder.CreateBox(`${name}_bottomRail`, { 
    width: width, 
    height: railHeight, 
    depth: depth 
  }, scene);
  bottomRail.position = new Vector3(0, 0.4, 0);
  bottomRail.parent = parent;
  bottomRail.material = fenceMat;
  bottomRail.checkCollisions = false; // Rails are just visual
  
  // Create picket instances (visual only)
  for (let i = 0; i < numPickets; i++) {
    const picket = picketTemplate.createInstance(`${name}_picket_${i}`);
    
    const offset = (i - numPickets / 2) * picketSpacing;
    if (isHorizontal) {
      picket.position = new Vector3(offset, height / 2, 0);
    } else {
      picket.position = new Vector3(0, height / 2, offset);
      picket.rotation.y = Math.PI / 2; // Rotate for vertical fence
    }
    picket.parent = parent;
    picket.checkCollisions = false; // Pickets are just visual
    picket.isPickable = false;
    pickets.push(picket);
  }
  
  // Create simplified collision box for the entire fence section
  // This replaces 200+ individual colliders with just 4 boxes (one per side)
  const collisionBox = MeshBuilder.CreateBox(`${name}_collision`, {
    width: width,
    height: height,
    depth: depth
  }, scene);
  collisionBox.position = new Vector3(0, height / 2, 0);
  collisionBox.parent = parent;
  collisionBox.setEnabled(false); // Not visible, but still collides
  collisionBox.checkCollisions = true;
  
  return { parent: parent as unknown as AbstractMesh, pickets, collisionBox };
}

/**
 * Create all fence sections around the backyard perimeter
 */
export function createFence(scene: Scene) {
  const { height, picketWidth, picketDepth } = FENCE_CONFIG;
  const fenceMat = new StandardMaterial('fenceMat', scene);
  fenceMat.diffuseColor = COLORS.fence.clone();

  // Create picket template (disabled, used for instancing only)
  const picketTemplate = MeshBuilder.CreateBox('picket_template', { 
    width: picketWidth, 
    height: height, 
    depth: picketDepth 
  }, scene);
  picketTemplate.material = fenceMat;
  picketTemplate.setEnabled(false); // Template is not rendered

  const fencePosts: AbstractMesh[] = [];
  const picketInstances: AbstractMesh[] = [];

  // Create all fence sections
  FENCE_SECTIONS.forEach(section => {
    const { parent, pickets } = createPicketFence(
      section.name,
      section.position,
      section.width,
      section.depth,
      picketTemplate,
      fenceMat,
      scene
    );
    fencePosts.push(parent);
    picketInstances.push(...pickets);
  });

  return { fencePosts, picketInstances, picketTemplate, fenceMat };
}
