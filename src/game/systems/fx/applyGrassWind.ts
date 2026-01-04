/**
 * Helper to apply grass wind animation to meshes
 * Deduplicates by material to avoid attaching multiple plugins to the same material
 */

import type { AbstractMesh } from '@babylonjs/core';
import { MaterialPluginManager } from '@babylonjs/core/Materials/materialPluginManager';
import { GrassWindPlugin, type GrassWindOptions } from './GrassWindPlugin';

/**
 * Apply grass wind animation to a mesh and its children
 * Attaches the wind plugin once per unique material
 * 
 * @param mesh - Root mesh (will process children recursively)
 * @param options - Wind configuration options
 */
export function applyGrassWindToMesh(mesh: AbstractMesh, options?: GrassWindOptions): void {
  const processedMaterials = new Set<string>();

  // Helper to process a single mesh
  const processMesh = (m: AbstractMesh): void => {
    if (!m.material) {
      return;
    }

    const material = m.material;
    const materialId = material.uniqueId.toString();

    // Skip if we've already attached the plugin to this material
    if (processedMaterials.has(materialId)) {
      return;
    }

    // Ensure the material has a plugin manager - create one if it doesn't exist
    if (!material.pluginManager) {
      material.pluginManager = new MaterialPluginManager(material);
      if (import.meta.env.DEV) {
        console.log(`[GrassWind] Created plugin manager for material: ${material.name}`);
      }
    }

    // Attach the wind plugin
    new GrassWindPlugin(material, options);

    // Force material to recompile
    material.markAsDirty(1);

    // Mark this material as processed
    processedMaterials.add(materialId);

    if (import.meta.env.DEV) {
      console.log(`[GrassWind] Attached plugin to material: ${material.name || materialId}`);
    }
  };

  // Process the root mesh
  processMesh(mesh);

  // Process all children recursively
  const processChildren = (parent: AbstractMesh): void => {
    if (parent.getChildMeshes) {
      const children = parent.getChildMeshes(false); // Direct children only
      for (const child of children) {
        processMesh(child);
        processChildren(child);
      }
    }
  };

  processChildren(mesh);

  if (import.meta.env.DEV) {
    console.log(`[GrassWind] Processed ${processedMaterials.size} unique material(s)`);
  }
}
