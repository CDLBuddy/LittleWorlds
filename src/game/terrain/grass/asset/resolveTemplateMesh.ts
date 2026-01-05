/**
 * Grass asset resolution helper
 * Pure function to find the template mesh from an AssetContainer
 */

import type { AbstractMesh } from '@babylonjs/core';

export interface ResolveTemplateMeshOptions {
  /** Exact mesh name to search for */
  meshName?: string;
  /** Custom predicate to identify template mesh */
  predicate?: (m: AbstractMesh) => boolean;
}

/**
 * Resolve the template mesh from a loaded AssetContainer's meshes
 * 
 * Resolution order:
 * 1. If meshName provided: exact match first, then case-insensitive match
 * 2. If predicate provided: first mesh where predicate returns true
 * 3. Fallback: first mesh with vertices and material
 * 4. If none found: throw with diagnostic info
 * 
 * @param meshes - Array of meshes from AssetContainer
 * @param opts - Optional resolution strategy
 * @returns The resolved template mesh
 * @throws Error if no suitable mesh found
 */
export function resolveTemplateMesh(
  meshes: AbstractMesh[],
  opts?: ResolveTemplateMeshOptions
): AbstractMesh {
  if (!meshes || meshes.length === 0) {
    throw new Error('[resolveTemplateMesh] No meshes provided');
  }

  // Strategy 1: Exact mesh name match
  if (opts?.meshName) {
    // Try exact match first
    const exactMatch = meshes.find(m => m.name === opts.meshName);
    if (exactMatch) {
      return exactMatch;
    }

    // Try case-insensitive match
    const lowerName = opts.meshName.toLowerCase();
    const caseInsensitiveMatch = meshes.find(m => m.name.toLowerCase() === lowerName);
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch;
    }

    throw new Error(
      `[resolveTemplateMesh] No mesh found with name "${opts.meshName}". ` +
      `Available: ${meshes.map(m => m.name).join(', ')}`
    );
  }

  // Strategy 2: Custom predicate
  if (opts?.predicate) {
    const predicateMatch = meshes.find(opts.predicate);
    if (predicateMatch) {
      return predicateMatch;
    }

    throw new Error(
      `[resolveTemplateMesh] No mesh matched predicate. ` +
      `Available: ${meshes.map(m => m.name).join(', ')}`
    );
  }

  // Strategy 3: Fallback heuristic - first mesh with vertices and material
  const fallbackMatch = meshes.find(m => {
    // Check if mesh has geometry
    const hasVertices = 'getTotalVertices' in m && 
                       typeof m.getTotalVertices === 'function' && 
                       m.getTotalVertices() > 0;
    
    // Check if mesh has material
    const hasMaterial = !!m.material;
    
    return hasVertices && hasMaterial;
  });

  if (fallbackMatch) {
    return fallbackMatch;
  }

  // No suitable mesh found - provide diagnostic info
  const diagnostic = meshes.map(m => {
    const vertCount = 'getTotalVertices' in m && typeof m.getTotalVertices === 'function' 
                     ? m.getTotalVertices() 
                     : 0;
    return `${m.name} (verts: ${vertCount}, mat: ${!!m.material})`;
  }).join(', ');

  throw new Error(
    `[resolveTemplateMesh] No suitable template mesh found. ` +
    `Loaded ${meshes.length} mesh(es): ${diagnostic}`
  );
}
