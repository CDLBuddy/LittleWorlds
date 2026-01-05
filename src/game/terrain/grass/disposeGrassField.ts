/**
 * Grass field disposal helper
 * Safe, idempotent teardown for grass field instances
 */

import type { GrassFieldResult } from './types';

/**
 * Options for grass field disposal
 */
export type GrassFieldDisposeOptions = {
  /** 
   * Dispose the AssetContainer (default: false)
   * Only set to true if the container is exclusively owned by this grass field
   * and not shared/cached across worlds
   */
  disposeContainer?: boolean;
  
  /** 
   * Dispose the template mesh (default: false)
   * Template is typically owned by the container, so leave false
   */
  disposeTemplate?: boolean;
  
  /** Debug logging options */
  debug?: { log?: boolean };
};

/**
 * Dispose a grass field and its resources
 * 
 * Disposal order (safe and predictable):
 * 1. Dispose instances (via parent disposal - parent owns children)
 * 2. Dispose parent TransformNode
 * 3. Optionally dispose container (only if explicitly requested)
 * 
 * Idempotent: Safe to call multiple times (catches and logs errors in DEV)
 * 
 * @param field - The grass field result from createGrassField
 * @param opts - Disposal options (container disposal defaults to false)
 */
export function disposeGrassField(
  field: GrassFieldResult | undefined | null,
  opts?: GrassFieldDisposeOptions
): void {
  // Defensive: Handle missing field
  if (!field) {
    if (opts?.debug?.log && import.meta.env.DEV) {
      console.warn('[disposeGrassField] Called with null/undefined field, skipping');
    }
    return;
  }

  const debug = opts?.debug?.log && import.meta.env.DEV;

  if (debug) {
    console.log(`[disposeGrassField] Disposing grass field with ${field.instances?.length ?? 0} instances`);
  }

  try {
    // Step 1: Dispose parent TransformNode (this also disposes all children/instances)
    if (field.parent) {
      field.parent.dispose();
      if (debug) {
        console.log('[disposeGrassField] Disposed parent TransformNode');
      }
    }

    // Step 2: Optionally dispose template mesh (usually not needed, container owns it)
    if (opts?.disposeTemplate && field.templateMesh) {
      try {
        field.templateMesh.dispose();
        if (debug) {
          console.log('[disposeGrassField] Disposed template mesh');
        }
      } catch (err) {
        if (debug) {
          console.warn('[disposeGrassField] Error disposing template mesh (may already be disposed):', err);
        }
      }
    }

    // Step 3: Optionally dispose container (only if explicitly requested)
    if (opts?.disposeContainer && field.container) {
      try {
        field.container.dispose();
        if (debug) {
          console.log('[disposeGrassField] Disposed AssetContainer');
        }
      } catch (err) {
        if (debug) {
          console.warn('[disposeGrassField] Error disposing container (may already be disposed):', err);
        }
      }
    }
  } catch (err) {
    if (debug) {
      console.error('[disposeGrassField] Unexpected error during disposal:', err);
    }
    // Don't rethrow - disposal should be safe
  }
}
