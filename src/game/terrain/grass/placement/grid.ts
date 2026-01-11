/**
 * Grass grid placement calculator
 * Pure function to compute grid positions for grass instances
 */

import type { GrassGridPlacement } from '../types';

export interface GridPosition {
  /** World X coordinate */
  x: number;
  /** World Z coordinate */
  z: number;
  /** Grid index i (0 to gridSize-1) */
  i: number;
  /** Grid index j (0 to gridSize-1) */
  j: number;
}

/**
 * Build grid positions for grass placement
 * Supports regular grid and staggered (offset row) patterns
 * 
 * Pure function - no side effects, returns new array
 * 
 * Grid layout:
 * - Creates gridSize × gridSize positions
 * - Each cell has spacing × spacing world units (or spacingX/spacingZ if specified)
 * - offset parameter shifts the entire grid origin
 *   (Backyard uses offset: -40 to center 6×6 grid with 13m spacing)
 * - pattern:'staggered' shifts odd rows by spacingX/2 for better coverage
 * 
 * Position calculation (matching Backyard behavior):
 * - posX = offset + (i * spacing) + spacing/2
 * - posZ = offset + (j * spacing) + spacing/2
 * 
 * This centers each instance within its grid cell.
 * 
 * @param placement - Grid placement configuration
 * @returns Array of grid positions with indices
 */
export function buildGridPositions(placement: GrassGridPlacement): GridPosition[] {
  const { gridSize = 0, spacing, spacingX, spacingZ, offset = 0, mode } = placement;
  
  // If no gridSize specified (hex mode uses buildHexPositions instead), return empty
  if (!gridSize) {
    return [];
  }
  
  // Determine actual spacing per axis
  const dx = spacingX ?? spacing;
  const dz = spacingZ ?? spacing;
  
  // Check if staggered pattern requested via old 'pattern' field (backward compat)
  // or new mode.kind field
  const isStaggered = (placement as any).pattern === 'staggered' || mode?.kind === 'staggered';
  
  const positions: GridPosition[] = [];

  for (let i = 0; i < gridSize; i++) {
    // Staggered pattern: offset odd rows by half spacing
    const rowOffset = isStaggered && (i % 2 === 1) ? dx * 0.5 : 0;
    
    for (let j = 0; j < gridSize; j++) {
      // Match Backyard's exact calculation
      // offset + (index * spacing) + half_spacing centers within cell
      const x = offset + (i * dx) + dx / 2 + rowOffset;
      const z = offset + (j * dz) + dz / 2;

      positions.push({ x, z, i, j });
    }
  }

  return positions;
}
