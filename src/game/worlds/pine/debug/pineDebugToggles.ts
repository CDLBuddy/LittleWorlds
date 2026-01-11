/**
 * Pine World - Debug Toggles
 * 
 * Hotkeys:
 * - Shift+T: Toggle tree mesh culling (force always active)
 * - Shift+B: Toggle bounds visualization
 * - Shift+G: Toggle tree grounding debug (relocated/skipped trees)
 * 
 * Purpose: Debug tree placement vs culling issues
 */

import { Color3, MeshBuilder, StandardMaterial, type Scene, type Mesh } from '@babylonjs/core';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import { TreeGroundingDebug } from './treeGroundingDebug';

export interface PineDebugTogglesOptions {
  scene: Scene;
  sampler: TerrainSamplerWithBounds;
  /** Optional: provide tree meshes to toggle culling */
  getTreeMeshes?: () => Mesh[];
  /** Optional: tree grounding debug instance */
  treeGroundingDebug?: TreeGroundingDebug;
}

export class PineDebugToggles {
  private scene: Scene;
  private sampler: TerrainSamplerWithBounds;
  private getTreeMeshes: (() => Mesh[]) | null = null;
  private treeGroundingDebug: TreeGroundingDebug | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  // Toggle states
  private treeCullingDisabled = false;
  private boundsVisible = false;

  // Bounds visualization meshes
  private boundsVisualization: Mesh[] = [];

  constructor(options: PineDebugTogglesOptions) {
    this.scene = options.scene;
    this.sampler = options.sampler;
    this.getTreeMeshes = options.getTreeMeshes || null;
    this.treeGroundingDebug = options.treeGroundingDebug || null;

    if (!import.meta.env.DEV) {
      console.log('[PineDebugToggles] Skipped (PROD mode)');
      return;
    }

    this.setupKeyboardControls();
    console.log('[PineDebugToggles] Enabled. Hotkeys: Shift+T (trees), Shift+B (bounds), Shift+G (grounding)');
  }

  private setupKeyboardControls(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;

      switch (e.key.toUpperCase()) {
        case 'T':
          this.toggleTreeCulling();
          break;
        case 'B':
          this.toggleBoundsVisualization();
          break;
        case 'G':
          this.toggleTreeGroundingDebug();
          break;
      }
    };

    window.addEventListener('keydown', this.keyHandler);
  }

  private toggleTreeCulling(): void {
    if (!this.getTreeMeshes) {
      console.warn('[PineDebugToggles] No tree meshes provided, cannot toggle culling');
      return;
    }

    this.treeCullingDisabled = !this.treeCullingDisabled;
    const treeMeshes = this.getTreeMeshes();

    for (const mesh of treeMeshes) {
      if (this.treeCullingDisabled) {
        mesh.alwaysSelectAsActiveMesh = true;
        mesh.thinInstanceRefreshBoundingInfo(true);
      } else {
        mesh.alwaysSelectAsActiveMesh = false;
      }
    }

    console.log(
      `[PineDebugToggles] Tree culling ${this.treeCullingDisabled ? 'DISABLED' : 'ENABLED'} (${treeMeshes.length} meshes)`
    );
  }

  private toggleBoundsVisualization(): void {
    this.boundsVisible = !this.boundsVisible;

    if (this.boundsVisible) {
      this.createBoundsVisualization();
    } else {
      this.disposeBoundsVisualization();
    }

    console.log(`[PineDebugToggles] Bounds visualization ${this.boundsVisible ? 'ON' : 'OFF'}`);
  }

  private toggleTreeGroundingDebug(): void {
    if (!this.treeGroundingDebug) {
      console.warn('[PineDebugToggles] Tree grounding debug not provided');
      return;
    }
    this.treeGroundingDebug.toggle();
  }

  private createBoundsVisualization(): void {
    const bounds = this.sampler.bounds;

    // Material for bounds lines
    const mat = new StandardMaterial('boundsDebugMat', this.scene);
    mat.emissiveColor = new Color3(1, 0, 1); // Magenta
    mat.disableLighting = true;

    // Rectangle outline at terrain bounds (XZ plane, at terrain surface)
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.z - bounds.min.z;
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;
    const y = bounds.max.y + 0.5; // Slightly above terrain

    // Four lines forming rectangle
    const lines = [
      // North edge
      MeshBuilder.CreateBox('boundsN', { width, height: 0.5, depth: 0.2 }, this.scene),
      // South edge
      MeshBuilder.CreateBox('boundsS', { width, height: 0.5, depth: 0.2 }, this.scene),
      // West edge
      MeshBuilder.CreateBox('boundsW', { width: 0.2, height: 0.5, depth }, this.scene),
      // East edge
      MeshBuilder.CreateBox('boundsE', { width: 0.2, height: 0.5, depth }, this.scene),
    ];

    lines[0].position.set(centerX, y, bounds.min.z);
    lines[1].position.set(centerX, y, bounds.max.z);
    lines[2].position.set(bounds.min.x, y, centerZ);
    lines[3].position.set(bounds.max.x, y, centerZ);

    for (const line of lines) {
      line.material = mat;
      line.checkCollisions = false;
      this.boundsVisualization.push(line);
    }

    // Corner markers (spheres)
    const markerSize = 2;
    const corners = [
      { x: bounds.min.x, z: bounds.min.z },
      { x: bounds.max.x, z: bounds.min.z },
      { x: bounds.min.x, z: bounds.max.z },
      { x: bounds.max.x, z: bounds.max.z },
    ];

    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      const marker = MeshBuilder.CreateSphere(`boundsCorner${i}`, { diameter: markerSize }, this.scene);
      marker.position.set(corner.x, y, corner.z);
      marker.material = mat;
      marker.checkCollisions = false;
      this.boundsVisualization.push(marker);
    }

    console.log('[PineDebugToggles] Created bounds visualization:', {
      width,
      depth,
      corners: 4,
      edges: 4,
    });
  }

  private disposeBoundsVisualization(): void {
    for (const mesh of this.boundsVisualization) {
      mesh.dispose();
    }
    this.boundsVisualization = [];
  }

  dispose(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    this.disposeBoundsVisualization();
  }
}
