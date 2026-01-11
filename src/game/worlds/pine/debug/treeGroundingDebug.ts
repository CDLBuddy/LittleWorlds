/**
 * Pine World - Tree Grounding Debug Overlay
 * 
 * PHASE 9: DEV-only visualization for tree placement issues
 * 
 * Press Shift+G to toggle:
 * - Yellow spheres: relocated trees (moved from original position due to slope)
 * - Red spheres: skipped trees (no valid placement found after relocation attempts)
 */

import { Color3, Mesh, MeshBuilder, StandardMaterial, type Scene } from '@babylonjs/core';

interface TreePlacementResult {
  relocated: Array<{ x: number; z: number; y: number }>;
  skipped: Array<{ x: number; z: number; y: number }>;
}

export class TreeGroundingDebug {
  private scene: Scene;
  private markers: Mesh[] = [];
  private visible = false;
  private cachedData: TreePlacementResult | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Store tree placement results for visualization
   */
  setData(data: TreePlacementResult): void {
    this.cachedData = data;
    if (this.visible) {
      this.rebuild();
    }
  }

  /**
   * Toggle visibility of debug markers
   */
  toggle(): void {
    this.visible = !this.visible;
    if (this.visible) {
      this.rebuild();
    } else {
      this.dispose();
    }
    console.log('[Pine/Debug] Tree grounding overlay:', this.visible ? 'ON' : 'OFF');
  }

  /**
   * Rebuild all markers from cached data
   */
  private rebuild(): void {
    this.dispose();
    if (!this.cachedData) return;

    const relocatedMat = new StandardMaterial('treeDebugRelocated', this.scene);
    relocatedMat.emissiveColor = Color3.Yellow();
    relocatedMat.disableLighting = true;

    const skippedMat = new StandardMaterial('treeDebugSkipped', this.scene);
    skippedMat.emissiveColor = Color3.Red();
    skippedMat.disableLighting = true;

    // Yellow spheres for relocated trees
    for (const t of this.cachedData.relocated) {
      const sphere = MeshBuilder.CreateSphere('relocatedMarker', { diameter: 0.4 }, this.scene);
      sphere.position.set(t.x, t.y + 1.0, t.z); // Slightly above ground
      sphere.material = relocatedMat;
      this.markers.push(sphere);
    }

    // Red spheres for skipped trees
    for (const t of this.cachedData.skipped) {
      const sphere = MeshBuilder.CreateSphere('skippedMarker', { diameter: 0.5 }, this.scene);
      sphere.position.set(t.x, t.y + 1.0, t.z); // Slightly above ground
      sphere.material = skippedMat;
      this.markers.push(sphere);
    }

    console.log(
      `[Pine/Debug] Tree grounding markers: ${this.cachedData.relocated.length} relocated (yellow), ${this.cachedData.skipped.length} skipped (red)`
    );
  }

  /**
   * Remove all markers
   */
  private dispose(): void {
    for (const m of this.markers) {
      m.dispose();
    }
    this.markers = [];
  }

  /**
   * Cleanup on world unload
   */
  cleanup(): void {
    this.dispose();
    this.cachedData = null;
  }
}
