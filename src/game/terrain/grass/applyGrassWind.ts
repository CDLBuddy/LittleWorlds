/**
 * Grass wind application helpers
 * Utilities to apply wind animation to meshes and materials with proper deduplication
 */

import type { AbstractMesh, Material } from '@babylonjs/core';
import { MaterialPluginManager } from '@babylonjs/core/Materials/materialPluginManager';
import { GrassWindPlugin } from './GrassWindPlugin';
import type { GrassWindOptions } from './types';

/**
 * WeakMap to track which materials already have wind plugins attached
 * Prevents duplicate plugin attachments and allows reuse
 */
const pluginByMaterial = new WeakMap<Material, GrassWindPlugin>();

/**
 * Apply grass wind plugin directly to a material
 * Reuses existing plugin if already attached, otherwise creates new one
 * 
 * @param material - Material to attach wind plugin to
 * @param options - Wind configuration options
 * @returns The wind plugin instance (new or existing)
 */
export function applyGrassWindToMaterial(material: Material, options?: GrassWindOptions): GrassWindPlugin {
  // Check if plugin already exists for this material
  let plugin = pluginByMaterial.get(material);

  if (plugin) {
    // Reuse existing plugin, update parameters if provided
    if (options) {
      if (typeof options.enabled === 'boolean') plugin.enabled = options.enabled;
      if (options.windDir) plugin.windDir = options.windDir;
      // Note: Other properties don't have public setters, plugin would need to be recreated
      // For now, existing plugin is reused as-is
    }
    
    if (import.meta.env.DEV) {
      console.log(`[GrassWind] Reusing existing plugin for material: ${material.name}`);
    }
    
    return plugin;
  }

  // Ensure the material has a plugin manager
  if (!material.pluginManager) {
    material.pluginManager = new MaterialPluginManager(material);
    if (import.meta.env.DEV) {
      console.log(`[GrassWind] Created plugin manager for material: ${material.name}`);
    }
  }

  // Create new plugin and store in WeakMap
  plugin = new GrassWindPlugin(material, options);
  pluginByMaterial.set(material, plugin);

  // Force material recompilation to apply shader changes
  material.markAsDirty(1);

  if (import.meta.env.DEV) {
    console.log(`[GrassWind] Attached new plugin to material: ${material.name}`);
  }

  return plugin;
}

/**
 * Apply grass wind animation to a mesh and its children
 * Processes materials hierarchically and deduplicates by material instance
 * 
 * @param mesh - Root mesh (will process children recursively)
 * @param options - Wind configuration options
 */
export function applyGrassWindToMesh(mesh: AbstractMesh, options?: GrassWindOptions): void {
  const processedCount = { value: 0 };

  // Helper to process a single mesh
  const processMesh = (m: AbstractMesh): void => {
    if (!m.material) {
      return;
    }

    const material = m.material;

    // Apply to material (deduplication handled by applyGrassWindToMaterial)
    const existingPlugin = pluginByMaterial.get(material);
    applyGrassWindToMaterial(material, options);
    
    // Only increment count if this was a new plugin attachment
    if (!existingPlugin) {
      processedCount.value++;
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
    console.log(`[GrassWind] Processed mesh hierarchy, attached ${processedCount.value} new plugin(s)`);
  }
}
