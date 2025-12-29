/**
 * Performance snapshot utility for measuring rendering metrics
 * DEV-only tool for performance analysis
 */

import type { Scene } from '@babylonjs/core/scene';

export interface PerfSnapshot {
  meshesTotal: number;
  meshesActive: number;
  materials: number;
  textures: number;
  fps: number;
}

/**
 * Capture current scene performance metrics
 * @param scene - Babylon scene to analyze
 * @returns Performance snapshot with mesh/material/texture counts
 */
export function snapshotPerf(scene: Scene): PerfSnapshot {
  const activeMeshes = scene.getActiveMeshes();
  
  return {
    meshesTotal: scene.meshes.length,
    meshesActive: activeMeshes.length,
    materials: scene.materials.length,
    textures: scene.textures.length,
    fps: Math.round(scene.getEngine().getFps()),
  };
}

/**
 * Log performance snapshot to console (DEV only)
 * @param label - Label for the log entry
 * @param snapshot - Performance snapshot to log
 */
export function logPerfSnapshot(label: string, snapshot: PerfSnapshot): void {
  if (import.meta.env.DEV) {
    console.log(`[Perf] ${label}:`, {
      'Total Meshes': snapshot.meshesTotal,
      'Active Meshes': snapshot.meshesActive,
      'Materials': snapshot.materials,
      'Textures': snapshot.textures,
      'FPS': snapshot.fps,
    });
  }
}
