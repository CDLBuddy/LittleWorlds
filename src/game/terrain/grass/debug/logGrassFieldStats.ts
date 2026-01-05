/**
 * Grass field diagnostics
 * DEV-only logging for grass field stats and plugin attachment verification
 */

import type { Scene } from '@babylonjs/core';
import type { GrassFieldResult } from '../types';

/**
 * Log grass field statistics (DEV-only)
 * 
 * Useful for verifying:
 * - Instance counts match expectations
 * - Wind plugin is properly attached
 * - Scene resource counts (leak detection)
 * 
 * @param label - Log label for identification
 * @param field - Grass field result to inspect
 * @param scene - Optional scene for total resource counts
 */
export function logGrassFieldStats(
  label: string,
  field: GrassFieldResult | undefined | null,
  scene?: Scene
): void {
  // Only log in DEV
  if (!import.meta.env.DEV) {
    return;
  }

  if (!field) {
    console.log(`[GrassFieldStats] ${label}: Field is null/undefined`);
    return;
  }

  console.group(`[GrassFieldStats] ${label}`);

  try {
    // Instance count
    const instanceCount = field.instances?.length ?? 0;
    console.log(`Instances: ${instanceCount}`);

    // Template mesh info
    if (field.templateMesh) {
      console.log(`Template mesh: ${field.templateMesh.name}`);

      // Material info
      if (field.templateMesh.material) {
        const mat = field.templateMesh.material;
        console.log(`Material: ${mat.name}`);

        // Check for GrassWind plugin (defensive)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          const pluginManager = (mat as any).pluginManager;
          if (pluginManager) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const plugins = pluginManager.plugins ?? [];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const hasGrassWind = plugins.some((p: any) => p.name === 'GrassWind');
            console.log(`GrassWind plugin: ${hasGrassWind ? '✅ attached' : '❌ not found'}`);
          } else {
            console.log('GrassWind plugin: ⚠️ no plugin manager');
          }
        } catch {
          console.log('GrassWind plugin: ⚠️ unable to check');
        }
      } else {
        console.log('Material: none');
      }
    } else {
      console.log('Template mesh: none');
    }

    // Scene totals (for leak detection)
    if (scene) {
      console.log(`Scene totals: meshes=${scene.meshes.length}, materials=${scene.materials.length}, textures=${scene.textures.length}`);
    }

    // First instance position (sanity check)
    if (field.instances && field.instances.length > 0) {
      const first = field.instances[0];
      console.log(`First instance: ${first.name} at (${first.position.x.toFixed(1)}, ${first.position.z.toFixed(1)})`);
    }
  } catch (err) {
    console.warn(`[GrassFieldStats] ${label}: Error gathering stats:`, err);
  } finally {
    console.groupEnd();
  }
}
