/**
 * Gate Pairs - Canonical Mapping
 * 
 * Single source of truth for bidirectional gate connections.
 * Maps each gate to its corresponding entry gate in the target world.
 * 
 * Usage:
 *   When traveling via fromGateId, compute entryGateId = GATE_PAIR[fromGateId]
 */

import { INTERACTABLE_ID, type InteractableId } from './interactableIds';

/**
 * Bidirectional gate pair mapping
 * Each gate maps to exactly one partner gate in the connected world
 * Only includes gate interactables (not all interactable IDs)
 */
export const GATE_PAIR: Partial<Record<InteractableId, InteractableId>> = {
  // Backyard ↔ Woodline
  [INTERACTABLE_ID.BACKYARD_GATE]: INTERACTABLE_ID.WOODLINE_BACKYARD_GATE,
  [INTERACTABLE_ID.WOODLINE_BACKYARD_GATE]: INTERACTABLE_ID.BACKYARD_GATE,
  
  // Woodline ↔ Creek
  [INTERACTABLE_ID.WOODLINE_CREEK_GATE]: INTERACTABLE_ID.CREEK_WOODLINE_GATE,
  [INTERACTABLE_ID.CREEK_WOODLINE_GATE]: INTERACTABLE_ID.WOODLINE_CREEK_GATE,
  
  // Creek ↔ Pine
  [INTERACTABLE_ID.CREEK_PINE_GATE]: INTERACTABLE_ID.PINE_CREEK_GATE,
  [INTERACTABLE_ID.PINE_CREEK_GATE]: INTERACTABLE_ID.CREEK_PINE_GATE,
  
  // Pine ↔ Dusk
  [INTERACTABLE_ID.PINE_DUSK_GATE]: INTERACTABLE_ID.DUSK_PINE_GATE,
  [INTERACTABLE_ID.DUSK_PINE_GATE]: INTERACTABLE_ID.PINE_DUSK_GATE,
  
  // Dusk ↔ Night
  [INTERACTABLE_ID.DUSK_NIGHT_GATE]: INTERACTABLE_ID.NIGHT_DUSK_GATE,
  [INTERACTABLE_ID.NIGHT_DUSK_GATE]: INTERACTABLE_ID.DUSK_NIGHT_GATE,
  
  // Night ↔ Beach
  [INTERACTABLE_ID.NIGHT_BEACH_GATE]: INTERACTABLE_ID.BEACH_NIGHT_GATE,
  [INTERACTABLE_ID.BEACH_NIGHT_GATE]: INTERACTABLE_ID.NIGHT_BEACH_GATE,
} as const;

/**
 * Validate gate pairs are symmetric
 * DEV-only sanity check
 */
export function validateGatePairs(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [fromGate, toGate] of Object.entries(GATE_PAIR)) {
    // Check reverse mapping exists
    if (!GATE_PAIR[toGate]) {
      errors.push(`Gate ${toGate} has no reverse mapping (expected to map back from ${fromGate})`);
      continue;
    }
    
    // Check symmetry: GATE_PAIR[GATE_PAIR[id]] === id
    const reverse = GATE_PAIR[toGate];
    if (reverse !== fromGate) {
      errors.push(`Gate pair asymmetry: ${fromGate} → ${toGate} → ${reverse} (expected ${fromGate})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
