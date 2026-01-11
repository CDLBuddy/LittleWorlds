/**
 * Hex Grid Placement Builder
 * Generates hexagonal packing positions for grass patches
 */

export interface HexBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface GridPosition {
  x: number;
  z: number;
  i: number;  // row index
  j: number;  // column index
}

/**
 * Build hexagonal grid positions within bounds
 * Uses staggered row layout for optimal packing density
 * 
 * @param spacing - Center-to-center distance between patches
 * @param bounds - World-space rectangular bounds
 * @returns Array of grid positions with stable indices
 */
export function buildHexPositions(args: {
  spacing: number;
  bounds: HexBounds;
}): GridPosition[] {
  const { spacing, bounds } = args;
  const positions: GridPosition[] = [];

  // Hex packing: staggered rows
  // Row step: sqrt(3)/2 * spacing ≈ 0.8660254
  const rowStep = spacing * 0.8660254;
  const colStep = spacing;
  const colOffset = spacing * 0.5; // Offset for odd rows

  let i = 0;
  for (let z = bounds.minZ; z <= bounds.maxZ; z += rowStep, i++) {
    const xOffset = (i % 2) === 1 ? colOffset : 0;
    let j = 0;
    
    for (let x = bounds.minX + xOffset; x <= bounds.maxX; x += colStep, j++) {
      positions.push({ x, z, i, j });
    }
  }

  return positions;
}
