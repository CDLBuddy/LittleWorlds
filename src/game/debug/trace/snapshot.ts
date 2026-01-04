/**
 * snapshot - Capture role state across all systems for invariant checking
 * 
 * Purpose: Before/after any save write, capture the "current role" from every
 * system that tracks it. This allows detecting desync bugs like:
 * "save wrote to boy while TaskSystem says girl"
 */

import type { TaskSystem } from '@game/systems/tasks/TaskSystem';
import type { ProgressionSystem } from '@game/systems/progression/ProgressionSystem';
import type { WorldResult } from '@game/worlds/types';

// Phase 2.9: AutosaveSystem.roleId is now private (used for logging only)
// We can still access it for snapshot purposes via bracket notation
type AutosaveSystemRef = {
  roleId?: 'boy' | 'girl';  // May be private, accessed via bracket notation
};

export interface RoleSnapshot {
  /** TaskSystem.getCurrentRole() */
  taskRole: 'boy' | 'girl' | null;
  /** World.getActivePlayer().getRoleId() */
  worldRole: 'boy' | 'girl' | null;
  /** ProgressionSystem.getRoleId() */
  progressRole: 'boy' | 'girl' | null;
  /** AutosaveSystem internal roleId (not exposed, use reflection) */
  autosaveRole: 'boy' | 'girl' | null;
  /** TaskSystem.getInventory().length */
  inventoryCount: number;
  /** ProgressionSystem.getCurrentTask()?.id */
  currentTaskId: string | null;
}

// Global references (set by GameApp during system creation)
let taskSystemRef: TaskSystem | null = null;
let worldRef: WorldResult | null = null;
let progressionSystemRef: ProgressionSystem | null = null;
let autosaveSystemRef: AutosaveSystemRef | null = null;

/**
 * Set system references for snapshot capture
 * Called by GameApp after all systems are created
 */
export function setSnapshotRefs(
  taskSystem: TaskSystem,
  world: WorldResult,
  progressionSystem: ProgressionSystem,
  autosaveSystem: AutosaveSystemRef
): void {
  taskSystemRef = taskSystem;
  worldRef = world;
  progressionSystemRef = progressionSystem;
  autosaveSystemRef = autosaveSystem;

  // if (import.meta.env.DEV) {
  //   console.log('[snapshot] System references set for invariant checking');
  // }
}

/**
 * Capture current role state from all systems
 */
export function captureSnapshot(): RoleSnapshot {
  const snapshot: RoleSnapshot = {
    taskRole: null,
    worldRole: null,
    progressRole: null,
    autosaveRole: null,
    inventoryCount: 0,
    currentTaskId: null,
  };

  // Capture TaskSystem role
  if (taskSystemRef) {
    try {
      snapshot.taskRole = taskSystemRef.getCurrentRole();
      snapshot.inventoryCount = taskSystemRef.getInventory().length;
    } catch (e) {
      console.warn('[snapshot] Failed to read TaskSystem', e);
    }
  }

  // Capture World active role
  if (worldRef) {
    try {
      const activePlayer = worldRef.getActivePlayer();
      // Access roleId via reflection (Player has getRoleId method)
      if (activePlayer && 'getRoleId' in activePlayer && typeof activePlayer.getRoleId === 'function') {
        snapshot.worldRole = activePlayer.getRoleId() as 'boy' | 'girl';
      }
    } catch (e) {
      console.warn('[snapshot] Failed to read World role', e);
    }
  }

  // Capture ProgressionSystem role
  if (progressionSystemRef) {
    try {
      snapshot.progressRole = progressionSystemRef.getRoleId();
      // Try to get current task (may not be exposed, handle gracefully)
      if ('getCurrentTask' in progressionSystemRef && typeof (progressionSystemRef as unknown as Record<string, unknown>).getCurrentTask === 'function') {
        const task = (progressionSystemRef as unknown as { getCurrentTask: () => { id: string } | null }).getCurrentTask();
        snapshot.currentTaskId = task?.id ?? null;
      }
    } catch (e) {
      console.warn('[snapshot] Failed to read ProgressionSystem', e);
    }
  }

  // Capture AutosaveSystem role (private property, use reflection)
  if (autosaveSystemRef) {
    try {
      // Access private roleId property (TypeScript allows at runtime, cast for type safety)
      snapshot.autosaveRole = (autosaveSystemRef as any).roleId ?? null;
    } catch (e) {
      console.warn('[snapshot] Failed to read AutosaveSystem role', e);
    }
  }

  return snapshot;
}

/**
 * Check if snapshot shows role agreement across all systems
 */
export function isSnapshotConsistent(snapshot: RoleSnapshot): boolean {
  const roles = [
    snapshot.taskRole,
    snapshot.worldRole,
    snapshot.progressRole,
    snapshot.autosaveRole,
  ].filter(r => r !== null);

  if (roles.length === 0) return true; // No systems initialized yet

  const firstRole = roles[0];
  return roles.every(r => r === firstRole);
}

/**
 * Get a human-readable summary of snapshot inconsistencies
 */
export function getSnapshotMismatches(snapshot: RoleSnapshot): string[] {
  const mismatches: string[] = [];

  if (!snapshot.taskRole) return ['TaskSystem not initialized'];

  if (snapshot.worldRole && snapshot.worldRole !== snapshot.taskRole) {
    mismatches.push(`World=${snapshot.worldRole} vs Task=${snapshot.taskRole}`);
  }

  if (snapshot.progressRole && snapshot.progressRole !== snapshot.taskRole) {
    mismatches.push(`Progress=${snapshot.progressRole} vs Task=${snapshot.taskRole}`);
  }

  if (snapshot.autosaveRole && snapshot.autosaveRole !== snapshot.taskRole) {
    mismatches.push(`Autosave=${snapshot.autosaveRole} vs Task=${snapshot.taskRole}`);
  }

  return mismatches;
}
