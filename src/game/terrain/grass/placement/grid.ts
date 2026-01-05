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
 * 
 * Pure function - no side effects, returns new array
 * 
 * Grid layout:
 * - Creates gridSize × gridSize positions
 * - Each cell has spacing × spacing world units
 * - offset parameter shifts the entire grid origin
 *   (Backyard uses offset: -40 to center 6×6 grid with 13m spacing)
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
  const { gridSize, spacing, offset = 0 } = placement;
  const positions: GridPosition[] = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Match Backyard's exact calculation
      // offset + (index * spacing) + half_spacing centers within cell
      const x = offset + (i * spacing) + spacing / 2;
      const z = offset + (j * spacing) + spacing / 2;

      positions.push({ x, z, i, j });
    }
  }

  return positions;
}
