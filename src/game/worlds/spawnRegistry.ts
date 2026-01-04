/**
 * Spawn Registry - Single Source of Truth for World Spawns
 * 
 * Centralizes spawn logic by computing spawn points from gate anchors.
 * Each world defines:
 *   - Default spawn (new game / no entry gate)
 *   - Gate anchors (position + forward direction)
 * 
 * Spawn is computed from gate anchor:
 *   spawnPos = anchor.position + normalize(anchor.forward) * inset
 *   spawnForward = normalize(anchor.forward)
 */

import { Vector3 } from '@babylonjs/core';
import type { AreaId } from '../content/areas';
import type { InteractableId } from '../content/interactableIds';
import { INTERACTABLE_ID } from '../content/interactableIds';
import type { SpawnPoint } from './helpers';

/**
 * Default spawn inset distance from gate (in world units)
 * Adjust this to tune how far players spawn from gates globally
 */
const DEFAULT_INSET = 4;

/**
 * Gate anchor - defines gate position and forward direction into world
 */
export interface GateAnchor {
  position: Vector3;
  forwardIntoWorld: Vector3;  // Direction player should face when entering
  spawnInset?: number;  // Distance from gate (default: DEFAULT_INSET)
}

/**
 * World spawn configuration
 */
export interface WorldSpawnConfig {
  defaultSpawn: SpawnPoint;
  gateAnchors: Partial<Record<InteractableId, GateAnchor>>;
}

/**
 * Compute spawn point from gate anchor
 */
function computeSpawnFromAnchor(anchor: GateAnchor): SpawnPoint {
  const inset = anchor.spawnInset ?? DEFAULT_INSET;
  
  // Clone and normalize forward vector
  const forward: Vector3 = anchor.forwardIntoWorld.clone();
  forward.normalize();
  
  // Compute position: anchor + forward * inset
  const offset: Vector3 = forward.scale(inset);
  const position: Vector3 = anchor.position.clone();
  position.addInPlace(offset);
  
  return {
    position,
    forward,
  };
}

/**
 * Spawn registry for all worlds
 */
const SPAWN_REGISTRY: Partial<Record<AreaId, WorldSpawnConfig>> = {
  // === BACKYARD ===
  backyard: {
    defaultSpawn: {
      position: new Vector3(0, 0, 20), // Center-front near house
      forward: new Vector3(0, 0, -1),  // Face north toward house
    },
    gateAnchors: {
      [INTERACTABLE_ID.BACKYARD_GATE]: {
        position: new Vector3(0, 0, -30),
        forwardIntoWorld: new Vector3(0, 0, 1), // Enter from north, face south into backyard
      },
    },
  },

  // === WOODLINE ===
  woodline: {
    defaultSpawn: {
      position: new Vector3(0, 0, 30), // South side of clearing
      forward: new Vector3(0, 0, -1),  // Face north into clearing
    },
    gateAnchors: {
      [INTERACTABLE_ID.WOODLINE_BACKYARD_GATE]: {
        position: new Vector3(0, 0, 40),
        forwardIntoWorld: new Vector3(0, 0, -1), // Enter from south, face north
      },
      [INTERACTABLE_ID.WOODLINE_CREEK_GATE]: {
        position: new Vector3(0, 0, -25),
        forwardIntoWorld: new Vector3(0, 0, 1), // Enter from north, face south
      },
    },
  },

  // === CREEK ===
  creek: {
    defaultSpawn: {
      position: new Vector3(-25, 0, 55), // South on west bank
      forward: new Vector3(0, 0, -1),    // Face north along creek
    },
    gateAnchors: {
      [INTERACTABLE_ID.CREEK_WOODLINE_GATE]: {
        position: new Vector3(-25, 0, 65),
        forwardIntoWorld: new Vector3(0, 0, -1), // Enter from south, face north
      },
      [INTERACTABLE_ID.CREEK_PINE_GATE]: {
        position: new Vector3(-25, 0, -65),
        forwardIntoWorld: new Vector3(0, 0, 1), // Enter from north, face south
      },
    },
  },

  // === PINE ===
  pine: {
    defaultSpawn: {
      // Note: Pine uses terrain-adjusted Y via atTerrain helper
      // This position is used as XZ coordinates, Y is overridden by atTerrain
      position: new Vector3(0, 0, 60),   // South side
      forward: new Vector3(0, 0, -1),    // Face north
    },
    gateAnchors: {
      [INTERACTABLE_ID.PINE_CREEK_GATE]: {
        position: new Vector3(0, 0, 70),
        forwardIntoWorld: new Vector3(0, 0, -1), // Enter from south, face north
      },
      [INTERACTABLE_ID.PINE_DUSK_GATE]: {
        position: new Vector3(0, 0, -60),
        forwardIntoWorld: new Vector3(0, 0, 1), // Enter from north, face south
      },
    },
  },

  // === DUSK ===
  dusk: {
    defaultSpawn: {
      position: new Vector3(0, 0.9, 42),  // South side of meadow
      forward: new Vector3(0, 0, -1),     // Face north
    },
    gateAnchors: {
      [INTERACTABLE_ID.DUSK_PINE_GATE]: {
        position: new Vector3(0, 0, 52),
        forwardIntoWorld: new Vector3(0, 0, -1), // Enter from south, face north
      },
      [INTERACTABLE_ID.DUSK_NIGHT_GATE]: {
        position: new Vector3(0, 0, -52),
        forwardIntoWorld: new Vector3(0, 0, 1), // Enter from north, face south
      },
    },
  },

  // === NIGHT ===
  night: {
    defaultSpawn: {
      position: new Vector3(0, 0.9, 37),  // South side under stars
      forward: new Vector3(0, 0, -1),     // Face north
    },
    gateAnchors: {
      [INTERACTABLE_ID.NIGHT_DUSK_GATE]: {
        position: new Vector3(0, 0.5, 47),
        forwardIntoWorld: new Vector3(0, 0, -1), // Enter from south, face north
      },
      [INTERACTABLE_ID.NIGHT_BEACH_GATE]: {
        position: new Vector3(0, 0.5, -45),
        forwardIntoWorld: new Vector3(0, 0, 1), // Enter from north, face south
      },
    },
  },

  // === BEACH ===
  beach: {
    defaultSpawn: {
      position: new Vector3(0, 0.9, 27),  // Near south gate (only entry)
      forward: new Vector3(0, 0, -1),     // Face north toward ocean
    },
    gateAnchors: {
      [INTERACTABLE_ID.BEACH_NIGHT_GATE]: {
        position: new Vector3(0, 0.5, 37),
        forwardIntoWorld: new Vector3(0, 0, -1), // Enter from south, face north toward ocean
      },
    },
  },
};

/**
 * Get spawn point for a world, optionally using a specific entry gate
 * 
 * @param worldId - Which world to spawn in
 * @param entryGateId - Optional gate ID to spawn from (if undefined, uses default)
 * @returns SpawnPoint with position and forward direction
 */
export function getSpawnForWorld(worldId: AreaId, entryGateId?: InteractableId): SpawnPoint {
  const config = SPAWN_REGISTRY[worldId];
  
  if (!config) {
    console.error(`[SpawnRegistry] No spawn config for world: ${worldId}`);
    // Fallback to origin
    return {
      position: new Vector3(0, 0, 0),
      forward: new Vector3(0, 0, 1),
    };
  }

  // If entryGateId provided, try to compute from gate anchor
  if (entryGateId && config.gateAnchors) {
    const anchor = config.gateAnchors[entryGateId];
    if (anchor) {
      // Babylon Vector3 methods can appear as error types in strict mode - safe to use
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const spawn: SpawnPoint = computeSpawnFromAnchor(anchor);
      console.log(`[SpawnRegistry] ${worldId} spawn from gate ${entryGateId}:`, spawn);
      return spawn;
    } else {
      console.warn(`[SpawnRegistry] ⚠️ No gate anchor for ${entryGateId} in ${worldId}, using default`);
      if (import.meta.env.DEV) {
        console.error(`[SpawnRegistry] Missing anchor for ${entryGateId} - add to SPAWN_REGISTRY[${worldId}].gateAnchors`);
      }
    }
  }

  // Fall back to default spawn
  if (config.defaultSpawn) {
    console.log(`[SpawnRegistry] ${worldId} default spawn`);
    return config.defaultSpawn;
  }

  // Fallback if somehow default spawn is missing
  console.error(`[SpawnRegistry] No default spawn for ${worldId}!`);
  return {
    position: new Vector3(0, 0, 0),
    forward: new Vector3(0, 0, 1),
  };
}

/**
 * Validate all gate anchors have corresponding gates
 * DEV-only sanity check
 */
export function validateSpawnRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [worldId, config] of Object.entries(SPAWN_REGISTRY)) {
    // Check default spawn exists
    if (!config || !config.defaultSpawn) {
      errors.push(`${worldId}: Missing default spawn`);
      continue;
    }

    // Check gate anchors
    if (config.gateAnchors) {
      for (const [gateId, anchor] of Object.entries(config.gateAnchors)) {
        if (!anchor) {
          errors.push(`${worldId}: Missing anchor for gate ${gateId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
