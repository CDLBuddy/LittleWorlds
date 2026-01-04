//src/game/worlds/helpers.ts
/**
 * Phase 2.7.2: Shared World Helpers
 * 
 * Common utilities used across all world factories
 */

import { Scene, Vector3, Quaternion } from '@babylonjs/core';
import { Player } from '../entities/player/Player';
import type { RoleId } from '../content/areas';

/**
 * SpawnPoint - Position and forward direction for player spawn
 */
export interface SpawnPoint {
  position: Vector3;
  forward: Vector3;  // Normalized direction into the world
}

/**
 * WorldPlayers - Result from createWorldPlayers helper
 */
export interface WorldPlayers {
  boyPlayer: Player;
  girlPlayer: Player;
  activePlayer: Player;
}

/**
 * Create both boy and girl players for a world with proper positioning and rotation
 * This is the canonical way to set up dual-player architecture across all worlds
 * 
 * @param scene - Babylon scene
 * @param spawn - Spawn point with position and forward direction (or legacy Vector3 position)
 * @param roleId - Which role is active ('boy' or 'girl')
 * @returns Object with boyPlayer, girlPlayer, and activePlayer reference
 */
export function createWorldPlayers(
  scene: Scene,
  spawn: SpawnPoint | Vector3,
  roleId: RoleId
): WorldPlayers {
  // Handle legacy Vector3 input during migration
  let spawnPoint: SpawnPoint;
  if (spawn instanceof Vector3) {
    spawnPoint = {
      position: spawn,
      forward: new Vector3(0, 0, 1), // Default forward (positive Z)
    };
  } else {
    spawnPoint = {
      position: spawn.position,
      forward: spawn.forward.clone().normalize(), // Ensure normalized
    };
  }

  // Compute yaw from forward vector
  // Babylon's default forward is (0, 0, 1), rotation is around Y-axis
  const yaw = Math.atan2(spawnPoint.forward.x, spawnPoint.forward.z);

  // Compute local right vector for inactive player offset
  // right = forward × up, where up = (0, 1, 0)
  const up = new Vector3(0, 1, 0);
  const right = Vector3.Cross(spawnPoint.forward, up).normalize();

  // Create BOTH players
  // Active player at spawn point, inactive player offset to the right
  const activePos = spawnPoint.position.clone();
  const inactivePos = spawnPoint.position.clone().add(right.scale(2));

  const boyPlayer = new Player(
    scene,
    roleId === 'boy' ? activePos : inactivePos,
    'boy',
    roleId === 'boy'
  );

  const girlPlayer = new Player(
    scene,
    roleId === 'girl' ? activePos : inactivePos,
    'girl',
    roleId === 'girl'
  );

  // Apply rotation to BOTH players
  applyPlayerRotation(boyPlayer, yaw);
  applyPlayerRotation(girlPlayer, yaw);

  // Return both players + active player reference for convenience
  const activePlayer = roleId === 'boy' ? boyPlayer : girlPlayer;

  return {
    boyPlayer,
    girlPlayer,
    activePlayer,
  };
}

/**
 * Apply yaw rotation to a player
 * Handles both quaternion and euler rotation based on what the mesh uses
 */
function applyPlayerRotation(player: Player, yaw: number): void {
  const mesh = player.mesh;
  
  if (mesh.rotationQuaternion) {
    // Use quaternion if present - FromEulerAngles is the correct Babylon API
    mesh.rotationQuaternion = Quaternion.FromEulerAngles(0, yaw, 0);
  } else {
    // Otherwise use euler angles
    mesh.rotation.y = yaw;
  }
}
