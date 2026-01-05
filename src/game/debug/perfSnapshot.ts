/**
 * Performance snapshot utility for measuring rendering metrics
 * DEV-only tool for performance analysis
 */

import type { Scene } from '@babylonjs/core/scene';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

export interface PerfSnapshot {
  meshesTotal: number;
  meshesActive: number;
  meshesRendered: number;
  instanceCount: number;
  materials: number;
  textures: number;
  fps: number;
  playerPosition?: { x: number; y: number; z: number };
}

/**
 * Capture current scene performance metrics
 * @param scene - Babylon scene to analyze
 * @param playerMesh - Optional player mesh to capture position
 * @returns Performance snapshot with rendering stats and player position
 */
export function snapshotPerf(scene: Scene, playerMesh?: AbstractMesh): PerfSnapshot {
  const activeMeshes = scene.getActiveMeshes();
  const engine = scene.getEngine();
  
  // Count instances vs unique meshes
  let instanceCount = 0;
  let renderedCount = 0;
  for (const mesh of activeMeshes.data) {
    if (mesh.isEnabled() && mesh.isVisible) {
      renderedCount++;
      // Check if this is an instance (has a source mesh)
      if ('sourceMesh' in mesh && (mesh as any).sourceMesh) {
        instanceCount++;
      }
    }
  }

  const snapshot: PerfSnapshot = {
    meshesTotal: scene.meshes.length,
    meshesActive: activeMeshes.length,
    meshesRendered: renderedCount,
    instanceCount,
    materials: scene.materials.length,
    textures: scene.textures.length,
    fps: Math.round(engine.getFps()),
  };

  // Add player position if provided
  if (playerMesh) {
    const pos = playerMesh.position;
    snapshot.playerPosition = {
      x: Math.round(pos.x * 10) / 10,  // Round to 1 decimal
      y: Math.round(pos.y * 10) / 10,
      z: Math.round(pos.z * 10) / 10,
    };
  }

  return snapshot;
}

/**
 * Log performance snapshot to console (DEV only)
 * @param label - Label for the log entry
 * @param snapshot - Performance snapshot to log
 */
export function logPerfSnapshot(label: string, snapshot: PerfSnapshot): void {
  if (import.meta.env.DEV) {
    console.group(`[Perf] ${label}`);
    
    // Rendering stats
    console.log('📊 Rendering:');
    console.log(`  • FPS: ${snapshot.fps}`);
    console.log(`  • Meshes Rendered: ${snapshot.meshesRendered} / ${snapshot.meshesActive} active`);
    console.log(`  • Instances: ${snapshot.instanceCount}`);
    
    // Scene stats
    console.log('🎨 Scene Resources:');
    console.log(`  • Total Meshes: ${snapshot.meshesTotal}`);
    console.log(`  • Materials: ${snapshot.materials}`);
    console.log(`  • Textures: ${snapshot.textures}`);
    
    // Player position
    if (snapshot.playerPosition) {
      const pos = snapshot.playerPosition;
      console.log(`📍 Player Position: (${pos.x}, ${pos.y}, ${pos.z})`);
    }
    
    console.groupEnd();
  }
}
