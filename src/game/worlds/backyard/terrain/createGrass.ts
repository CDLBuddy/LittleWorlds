/**
 * Backyard World - Grass tiling system
 * Loads Summergrass.glb and creates instanced grid with exclusion zones
 */

import { Vector3, TransformNode, type Scene, type AbstractMesh, type Mesh } from '@babylonjs/core';
import { loadContainer } from '../models/loadContainer';
import { GRASS_CONFIG, GRASS_EXCLUSION_ZONES, GRASS_WIND_CONFIG } from '../config/constants';
import { applyGrassWindToMesh } from '@game/systems/fx/applyGrassWind';

/**
 * Helper function to check if a position is in any exclusion zone
 */
function isInExclusionZone(x: number, z: number): boolean {
  return GRASS_EXCLUSION_ZONES.some(zone => {
    const halfWidth = zone.width / 2;
    const halfDepth = zone.depth / 2;
    return (
      x >= zone.centerX - halfWidth &&
      x <= zone.centerX + halfWidth &&
      z >= zone.centerZ - halfDepth &&
      z <= zone.centerZ + halfDepth
    );
  });
}

/**
 * Load and tile grass across the backyard with exclusion zones for structures
 */
export async function createGrass(
  scene: Scene,
  ground: AbstractMesh,
  getIsAlive: () => boolean
): Promise<{ grassParent: TransformNode; grassInstances: AbstractMesh[] }> {
  const grassParent = new TransformNode('grassParent', scene);
  grassParent.position = new Vector3(0, 0, 0);
  
  const grassInstances: AbstractMesh[] = [];
  const { gridSize, spacing, offset, scaleY } = GRASS_CONFIG;

  const container = await loadContainer({
    scene,
    url: 'Summergrass.glb',
    getIsAlive,
  });

  const meshes = container.meshes;
  // console.log(`[Backyard] Loaded ${meshes.length} grass meshes`);
  
  if (meshes.length > 0) {
    // Find the actual grass mesh (not the root)
    const grassMesh = meshes.find(m => m.name.includes('grass') || m.name.includes('Plane'));
    
    if (grassMesh) {
      // console.log(`[Backyard] Using grass mesh: ${grassMesh.name}`);
      
      // Apply wind animation to the grass material before creating instances
      applyGrassWindToMesh(grassMesh, GRASS_WIND_CONFIG);
      
      // DEV: Verify shader compilation and catch errors
      if (import.meta.env.DEV && grassMesh.material) {
        const mat: any = grassMesh.material;
        
        // Listen for successful compilation
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mat.onCompiledObservable?.add((eff: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const vs = eff?._vertexSourceCode ?? '';
          console.log('[GrassWind] Shader compiled!');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          console.log('[GrassWind] Has uniforms:', vs.includes('grassWindTime'), vs.includes('grassWindAmplitude'));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          console.log('[GrassWind] Defines:', eff?.defines);
        });
        
        // Listen for compilation errors
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        mat.onErrorObservable?.add((_eff: any, errors: string) => {
          console.error('[GrassWind] Shader compilation error:', errors);
        });
        
        // Flush effect cache to force recompilation
        scene.getEngine().releaseEffects();
        console.log('[GrassWind] Effect cache flushed, forcing recompilation');
      }
      
      // Disable the template (don't render it)
      grassMesh.setEnabled(false);
      
      // Create a grid of grass instances to tile across the 80x80 backyard
      for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
          const posX = offset + (x * spacing) + spacing / 2;
          const posZ = offset + (z * spacing) + spacing / 2;
          
          // Skip this grass patch if it's in an exclusion zone
          if (isInExclusionZone(posX, posZ)) {
            // console.log(`[Backyard] Skipping grass at (${posX.toFixed(1)}, ${posZ.toFixed(1)}) - in exclusion zone`);
            continue;
          }
          
          // Use createInstance instead of clone for better performance
          const instance = (grassMesh as Mesh).createInstance(`grass_${x}_${z}`);
          if (instance) {
            instance.position = new Vector3(posX, 0, posZ);
            instance.scaling.y = scaleY; // Reduce grass height
            instance.isPickable = false; // Grass is not interactive
            instance.parent = grassParent;
            grassInstances.push(instance);
          }
        }
      }
      
      // Hide the basic ground since we have grass now
      ground.visibility = 0;
      ground.setEnabled(false);
    }
  }

  return { grassParent, grassInstances };
}
