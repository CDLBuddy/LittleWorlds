/**
 * sessionFacade - Game-side session access without React hooks
 * Wraps Zustand store for use in game code
 */

import { useGameSession } from './useGameSession';
import type { RoleId, AreaId } from '@game/content/areas';

/**
 * Get current session state
 */
export function getSession(): {
  roleId: RoleId | null;
  areaId: AreaId | null;
  slotId: string;
} {
  const state = useGameSession.getState();
  return {
    roleId: state.roleId,
    areaId: state.areaId,
    slotId: state.slotId,
  };
}

/**
 * Set current area (triggers GameHost remount)
 */
export function setArea(areaId: AreaId): void {
  useGameSession.getState().setArea(areaId);
}

/**
 * Set current role
 */
export function setRole(roleId: RoleId): void {
  useGameSession.getState().setRole(roleId);
}
