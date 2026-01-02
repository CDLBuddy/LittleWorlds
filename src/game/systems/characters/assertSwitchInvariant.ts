/**
 * Phase 2.7.4: Switch Invariants
 * 
 * Runtime assertions to catch character switch desync bugs early
 */

import type { Player } from '@game/entities/player/Player';
import type { RoleId } from '@game/content/areas';

/**
 * Assert that character switch invariants hold
 * Throws error if state is inconsistent (should crash in dev, log in prod)
 * 
 * Invariants checked:
 * 1. Exactly ONE player is active
 * 2. Active player matches roleId
 * 3. Inactive player is properly de-physicalized
 * 
 * @param boyPlayer - Boy player entity
 * @param girlPlayer - Girl player entity  
 * @param roleId - Expected active role
 * @param context - Where this check is happening (for error messages)
 */
export function assertSwitchInvariant(
  boyPlayer: Player,
  girlPlayer: Player,
  roleId: RoleId,
  context: string
): void {
  const errors: string[] = [];

  // Invariant 1: Exactly ONE player is active
  const boyActive = boyPlayer.isActive;
  const girlActive = girlPlayer.isActive;
  
  if (boyActive && girlActive) {
    errors.push('Both players are active (should be mutually exclusive)');
  } else if (!boyActive && !girlActive) {
    errors.push('No player is active (exactly one should be active)');
  }

  // Invariant 2: Active player matches roleId
  if (roleId === 'boy' && !boyActive) {
    errors.push(`roleId is 'boy' but boy player is not active`);
  } else if (roleId === 'girl' && !girlActive) {
    errors.push(`roleId is 'girl' but girl player is not active`);
  }

  // Invariant 3: Inactive player is de-physicalized
  const inactivePlayer = boyActive ? girlPlayer : boyPlayer;
  const inactiveMesh = inactivePlayer.mesh as any; // TransformNode doesn't have isPickable, but FBX nodes do
  if (inactiveMesh.isPickable) {
    errors.push(`Inactive player (${boyActive ? 'girl' : 'boy'}) has isPickable=true (should be false)`);
  }
  if (inactiveMesh.checkCollisions) {
    errors.push(`Inactive player (${boyActive ? 'girl' : 'boy'}) has checkCollisions=true (should be false)`);
  }

  // If any errors, throw or log
  if (errors.length > 0) {
    const errorMsg = `[SwitchInvariant] ${context} - Invariant violations:\n${errors.map(e => `  • ${e}`).join('\n')}`;
    
    if (import.meta.env.DEV) {
      // In dev, throw to crash immediately and surface the bug
      throw new Error(errorMsg);
    } else {
      // In prod, log error but don't crash (graceful degradation)
      console.error(errorMsg);
    }
  }
}
