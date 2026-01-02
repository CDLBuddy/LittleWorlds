/**
 * Phase 2.7.2: Shared World Helpers
 * 
 * Common utilities used across all world factories
 */

import { Scene, Vector3 } from '@babylonjs/core';
import { Player } from '../entities/player/Player';
import type { RoleId } from '../content/areas';

/**
 * WorldPlayers - Result from createWorldPlayers helper
 */
export interface WorldPlayers {
  boyPlayer: Player;
  girlPlayer: Player;
  activePlayer: Player;
}

/**
 * Create both boy and girl players for a world
 * This is the canonical way to set up dual-player architecture across all worlds
 * 
 * @param scene - Babylon scene
 * @param spawnPos - Where the active player spawns
 * @param roleId - Which role is active ('boy' or 'girl')
 * @returns Object with boyPlayer, girlPlayer, and activePlayer reference
 */
export function createWorldPlayers(
  scene: Scene,
  spawnPos: Vector3,
  roleId: RoleId
): WorldPlayers {
  // Create BOTH players (boy and girl) - only one is active
  const boyPlayer = new Player(scene, spawnPos, 'boy', roleId === 'boy');
  const girlPlayer = new Player(
    scene,
    spawnPos.clone().add(new Vector3(2, 0, 0)), // Offset girl player slightly
    'girl',
    roleId === 'girl'
  );

  // Return both players + active player reference for convenience
  const activePlayer = roleId === 'boy' ? boyPlayer : girlPlayer;

  return {
    boyPlayer,
    girlPlayer,
    activePlayer,
  };
}
