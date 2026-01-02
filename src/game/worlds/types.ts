/**
 * Phase 2.7.1: World Contract Hardening
 * 
 * Unified interface that all world factories must return.
 * Eliminates guessing with optional fields and provides clean accessor methods.
 */

import type { Player } from '../entities/player/Player';
import type { RoleId } from '../content/areas';
import type { TransformNode } from '@babylonjs/core';

/**
 * WorldResult - Contract that all world factories must implement
 * 
 * This replaces the previous pattern where some fields were optional
 * and callers had to guess which player was active.
 */
export interface WorldResult {
  /**
   * Get the currently active player (boy or girl)
   * This is the canonical source of truth for which player is active
   */
  getActivePlayer(): Player;

  /**
   * Get the active player's mesh (convenience method)
   */
  getActiveMesh(): TransformNode;

  /**
   * Switch the active role (updates internal state)
   * @param roleId - The role to make active ('boy' or 'girl')
   */
  setActiveRole(roleId: RoleId): void;

  /**
   * Reference to the boy player entity (always exists)
   */
  boyPlayer: Player;

  /**
   * Reference to the girl player entity (always exists)
   */
  girlPlayer: Player;
}
