/**
 * Pine World - Terrain creation
 * Creates the main Pine Trails terrain mesh using heightmap-based system
 */

import {
  Color3,
  type Scene,
  StandardMaterial,
  type GroundMesh,
} from '@babylonjs/core';
import { createTerrain as createTerrainShared } from '../../../terrain/createTerrain';
import { createGroundSampler, type TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import { PINE_TERRAIN_CONFIG } from './terrainConfig';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export interface PineTerrainResult {
  ground: GroundMesh;
  /** Promise that resolves when terrain is ready for height queries */
  onReady: Promise<TerrainSamplerWithBounds>;
}

export function createTerrain(scene: Scene, bag: DisposableBag, mats: MaterialCache): PineTerrainResult {
  // Use shared heightmap-based terrain system
  const terrainHandle = createTerrainShared(scene, PINE_TERRAIN_CONFIG);
  
  const ground = bag.trackMesh(terrainHandle.mesh) as GroundMesh;
  
  // Store sampler for player/grass height queries
  bag.trackOther({
    dispose: () => terrainHandle.dispose(),
  });

  // Configure mesh properties
  ground.isPickable = true;
  ground.checkCollisions = true;
  ground.receiveShadows = true;
  ground.metadata = { walkable: true };

  // === Material ===
  const mat = mats.get('pineTerrainMat', () => {
    const m = new StandardMaterial('pineTerrainMat', scene);
    m.diffuseColor = new Color3(0.35, 0.28, 0.22);
    m.specularColor = new Color3(0.1, 0.08, 0.06);
    m.ambientColor = new Color3(0.25, 0.2, 0.15);
    return m;
  });

  ground.material = mat;

  // Create sampler once ground is ready (critical for correct height queries)
  const onReady = new Promise<TerrainSamplerWithBounds>((resolve) => {
    // For heightmap terrain, must wait for mesh to be fully ready
    // Use scene's next render to ensure bounding box is computed
    scene.onAfterRenderObservable.addOnce(() => {
      const sampler = createGroundSampler(ground);
      console.log('[Pine] Terrain sampler ready:', {
        bounds: {
          min: sampler.bounds.min,
          max: sampler.bounds.max,
        },
      });
      resolve(sampler);
    });
  });

  return { ground, onReady };
}
