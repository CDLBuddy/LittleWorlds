/// src/game/systems/saves/saveFacade.ts
/**
 * Save Facade - High-level API for save operations
 *
 * HARDENING NOTES (Phase 2.9):
 * - Never store arrays by reference (prevents cross-role aliasing).
 * - Never return internal arrays by reference (prevents accidental mutation).
 * - DEV-only role isolation audit + auto-repair if boy/girl share object/array refs.
 */

import { SaveSystem, type SaveData, type SharedState } from './SaveSystem';
import type { AreaId, RoleId } from '@game/content/areas';

const DEV = import.meta.env.DEV;

function copyArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? [...arr] : [];
}

function shallowClone<T extends object>(obj: T | undefined | null): T {
  return (obj ? { ...(obj as any) } : ({} as T));
}

/**
 * Detect and repair the classic JS footgun:
 * boy and girl role progress pointing to the same object / same arrays.
 *
 * We keep this local to saveFacade because:
 * - This is where most reads/writes happen.
 * - Even if SaveSystem defaults are broken, we can auto-heal on load.
 */
function auditAndRepairRoleIsolation(save: SaveData): { repaired: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let repaired = false;

  // Defensive checks: roles must exist
  const roles: any = (save as any).roles;
  if (!roles) return { repaired: false, reasons: [] };

  const boy: any = roles.boy;
  const girl: any = roles.girl;

  if (!boy || !girl) return { repaired: false, reasons: [] };

  // Severe: role objects are the same reference
  if (boy === girl) {
    reasons.push('roles.boy and roles.girl reference the same object');
    // Split them by cloning girl from boy (then re-clone arrays below)
    roles.girl = { ...boy };
    repaired = true;
  }

  const b: any = roles.boy;
  const g: any = roles.girl;

  // Array fields we know exist in your save model
  const arrayFields = ['inventory', 'completedTasks', 'completedAreas', 'unlockedAreas'] as const;

  for (const field of arrayFields) {
    const bv = b[field];
    const gv = g[field];

    if (Array.isArray(bv) && Array.isArray(gv) && bv === gv) {
      reasons.push(`roles.boy.${field} and roles.girl.${field} share the same array reference`);
      // Split by cloning BOTH to guarantee isolation
      b[field] = [...bv];
      g[field] = [...gv];
      repaired = true;
    }
  }

  // Ensure arrays are arrays (not undefined) and not aliased via weird assignments
  for (const field of arrayFields) {
    if (!Array.isArray(b[field])) b[field] = [];
    if (!Array.isArray(g[field])) g[field] = [];
  }

  return { repaired, reasons };
}

class SaveFacade {
  private saveSystem = new SaveSystem();
  private readonly MAIN_SLOT = 'main';

  private assertValidRole(roleId: RoleId): void {
    if (roleId !== 'boy' && roleId !== 'girl') {
      // If RoleId ever expands, update this guard
      throw new Error(`[saveFacade] Unsupported roleId: ${String(roleId)}`);
    }
  }

  /**
   * Load main save slot.
   * DEV: audits for role aliasing and auto-repairs if found.
   */
  loadMain(): SaveData {
    const save = this.saveSystem.loadOrCreate(this.MAIN_SLOT);

    if (DEV) {
      const { repaired, reasons } = auditAndRepairRoleIsolation(save);
      if (repaired) {
        console.error('[saveFacade] 🔥 ROLE STATE ALIASING DETECTED (auto-repaired)', { reasons });
        // Persist the repaired structure immediately to prevent the bug from recurring
        this.saveSystem.write(this.MAIN_SLOT, save);
      }
    }

    return save;
  }

  /**
   * Write to main save slot (single choke point).
   * DEV: audits again before write so we catch bugs introduced by callers.
   */
  writeMain(save: SaveData): boolean {
    if (DEV) {
      const { repaired, reasons } = auditAndRepairRoleIsolation(save);
      if (repaired) {
        console.error('[saveFacade] 🔥 ROLE STATE ALIASING DETECTED DURING WRITE (auto-repaired)', { reasons });
      }
    }
    return this.saveSystem.write(this.MAIN_SLOT, save);
  }

  /**
   * Reset a specific role's progress to defaults.
   * IMPORTANT: Never assign the default role object by reference if SaveSystem reuses it.
   */
  resetRole(roleId: RoleId): SaveData {
    this.assertValidRole(roleId);

    const save = this.loadMain();

    // Create default and then force-copy all arrays to avoid shared references.
    const next = this.saveSystem.createDefaultRoleProgress() as any;

    save.roles[roleId] = {
      ...next,
      inventory: copyArray(next.inventory),
      completedTasks: copyArray(next.completedTasks),
      completedAreas: copyArray(next.completedAreas),
      unlockedAreas: copyArray(next.unlockedAreas),
    };

    this.writeMain(save);
    return save;
  }

  /**
   * Set the last selected role.
   */
  setLastSelectedRole(roleId: RoleId): SaveData {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    save.lastSelectedRole = roleId;
    this.writeMain(save);
    return save;
  }

  /**
   * Get the last selected role.
   */
  getLastSelectedRole(): RoleId | null {
    const save = this.loadMain();
    return save.lastSelectedRole ?? null;
  }

  /**
   * Get unlocked areas for a role.
   * Returns a COPY (callers can’t mutate saved state).
   */
  getUnlockedAreas(roleId: RoleId): AreaId[] {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    return copyArray(save.roles[roleId]?.unlockedAreas) as AreaId[];
  }

  /**
   * Mark an area as complete and unlock the next area.
   */
  markAreaComplete(roleId: RoleId, areaId: AreaId, nextAreaId?: AreaId): SaveData {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    const role: any = save.roles[roleId];

    role.completedAreas = copyArray(role.completedAreas);
    role.unlockedAreas = copyArray(role.unlockedAreas);

    if (!role.completedAreas.includes(areaId)) {
      role.completedAreas.push(areaId);
    }

    if (nextAreaId && !role.unlockedAreas.includes(nextAreaId)) {
      role.unlockedAreas.push(nextAreaId);
    }

    // Update last area
    if (nextAreaId) {
      role.lastAreaId = nextAreaId;
    }

    this.writeMain(save);
    return save;
  }

  /**
   * Mark a task as complete.
   */
  markTaskComplete(roleId: RoleId, taskId: string): SaveData {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    const role: any = save.roles[roleId];

    role.completedTasks = copyArray(role.completedTasks);

    if (!role.completedTasks.includes(taskId)) {
      role.completedTasks.push(taskId);
      console.log(
        `[saveFacade] Marked task ${taskId} complete for ${roleId}. Total completed: ${role.completedTasks.length}`
      );
    } else {
      console.log(`[saveFacade] Task ${taskId} already complete for ${roleId}`);
    }

    this.writeMain(save);
    return save;
  }

  /**
   * Get completed tasks for a role (COPY).
   * Useful for ProgressionSystem resume logic.
   */
  getCompletedTasks(roleId: RoleId): string[] {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    return copyArray((save.roles as any)?.[roleId]?.completedTasks);
  }

  /**
   * Update inventory for a role.
   * CRITICAL: store a COPY to avoid reference aliasing across roles/systems.
   */
  setInventory(roleId: RoleId, inventory: string[]): SaveData {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    (save.roles as any)[roleId].inventory = copyArray(inventory);
    this.writeMain(save);
    return save;
  }

  /**
   * Get inventory for a role (COPY).
   */
  getInventory(roleId: RoleId): string[] {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    return copyArray((save.roles as any)?.[roleId]?.inventory);
  }

  /**
   * Sync inventory without full area completion (for autosave).
   * Same behavior as setInventory but kept as a distinct API.
   */
  syncInventory(roleId: RoleId, inventory: string[]): SaveData {
    return this.setInventory(roleId, inventory);
  }

  /**
   * Sync last area ID for a role (for autosave).
   */
  syncLastArea(roleId: RoleId, areaId: AreaId): SaveData {
    this.assertValidRole(roleId);

    const save = this.loadMain();
    (save.roles as any)[roleId].lastAreaId = areaId;
    this.writeMain(save);
    return save;
  }

  /**
   * Get a world flag value (persistent per-world state).
   */
  getWorldFlag<T = any>(areaId: string, key: string): T | undefined {
    const save: any = this.loadMain();

    // Defensive: ensure worldFlags exists (backward compatibility)
    if (!save.worldFlags) {
      save.worldFlags = {};
      this.writeMain(save);
    }

    return save.worldFlags?.[areaId]?.[key] as T | undefined;
  }

  /**
   * Set a world flag value (persistent per-world state).
   */
  setWorldFlag(areaId: string, key: string, value: any): SaveData {
    const save: any = this.loadMain();

    if (!save.worldFlags) save.worldFlags = {};
    if (!save.worldFlags[areaId]) save.worldFlags[areaId] = {};

    save.worldFlags[areaId][key] = value;
    this.writeMain(save);
    return save;
  }

  /**
   * Clear all world flags for a specific area.
   */
  clearWorldFlags(areaId: string): SaveData {
    const save: any = this.loadMain();

    if (save.worldFlags) {
      delete save.worldFlags[areaId];
    }

    this.writeMain(save);
    return save;
  }

  /**
   * Get shared collections state (COPY).
   */
  getShared(): SharedState {
    const save: any = this.loadMain();
    // Shallow clone is usually enough for UI read usage.
    return shallowClone(save.shared) as SharedState;
  }

  /**
   * Update shared collections state and emit event.
   */
  setShared(nextShared: Partial<SharedState>): SaveData {
    const save: any = this.loadMain();
    save.shared = { ...save.shared, ...nextShared };
    this.writeMain(save);

    // Emit collections update event if eventBus is available
    if (typeof window !== 'undefined' && (window as any).__lwEventBus) {
      (window as any).__lwEventBus.emit({
        type: 'game/collectionsUpdate',
        shared: save.shared,
      });
    }

    return save;
  }
}

// Export singleton instance
export const saveFacade = new SaveFacade();
