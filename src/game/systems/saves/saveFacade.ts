/**
 * Save Facade - High-level API for save operations
 */

import { SaveSystem, type SaveData } from './SaveSystem';
import type { AreaId } from '@game/content/areas';

class SaveFacade {
  private saveSystem = new SaveSystem();
  private readonly MAIN_SLOT = 'main';

  /**
   * Load main save slot
   */
  loadMain(): SaveData {
    return this.saveSystem.loadOrCreate(this.MAIN_SLOT);
  }

  /**
   * Write to main save slot
   */
  writeMain(save: SaveData): boolean {
    return this.saveSystem.write(this.MAIN_SLOT, save);
  }

  /**
   * Reset a specific role's progress to defaults
   */
  resetRole(roleId: 'boy' | 'girl'): SaveData {
    const save = this.loadMain();
    save.roles[roleId] = this.saveSystem.createDefaultRoleProgress();
    this.writeMain(save);
    return save;
  }

  /**
   * Set the last selected role
   */
  setLastSelectedRole(roleId: 'boy' | 'girl'): SaveData {
    const save = this.loadMain();
    save.lastSelectedRole = roleId;
    this.writeMain(save);
    return save;
  }

  /**
   * Get unlocked areas for a role
   */
  getUnlockedAreas(roleId: 'boy' | 'girl'): string[] {
    const save = this.loadMain();
    return save.roles[roleId].unlockedAreas;
  }

  /**
   * Mark an area as complete and unlock the next area
   */
  markAreaComplete(roleId: 'boy' | 'girl', areaId: AreaId, nextAreaId?: AreaId): SaveData {
    const save = this.loadMain();
    const role = save.roles[roleId];
    
    // Add to completed if not already there
    if (!role.completedAreas.includes(areaId)) {
      role.completedAreas.push(areaId);
    }
    
    // Unlock next area if provided and not already unlocked
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
   * Mark a task as complete
   */
  markTaskComplete(roleId: 'boy' | 'girl', taskId: string): SaveData {
    const save = this.loadMain();
    const role = save.roles[roleId];
    
    if (!role.completedTasks.includes(taskId)) {
      role.completedTasks.push(taskId);
    }
    
    this.writeMain(save);
    return save;
  }

  /**
   * Update inventory for a role
   */
  setInventory(roleId: 'boy' | 'girl', inventory: string[]): SaveData {
    const save = this.loadMain();
    save.roles[roleId].inventory = inventory;
    this.writeMain(save);
    return save;
  }

  /**
   * Get inventory for a role
   */
  getInventory(roleId: 'boy' | 'girl'): string[] {
    const save = this.loadMain();
    return save.roles[roleId].inventory;
  }
  
  /**
   * Sync inventory without full area completion (for autosave)
   */
  syncInventory(roleId: 'boy' | 'girl', inventory: string[]): SaveData {
    const save = this.loadMain();
    save.roles[roleId].inventory = inventory;
    this.writeMain(save);
    return save;
  }
  
  /**
   * Sync last area ID for a role (for autosave)
   */
  syncLastArea(roleId: 'boy' | 'girl', areaId: AreaId): SaveData {
    const save = this.loadMain();
    save.roles[roleId].lastAreaId = areaId;
    this.writeMain(save);
    return save;
  }

  /**
   * Get a world flag value (persistent per-world state)
   * @param areaId - The area/world ID (e.g., 'woodline')
   * @param key - The flag key (e.g., 'campfireLit')
   * @returns The flag value or undefined if not set
   */
  getWorldFlag<T = any>(areaId: string, key: string): T | undefined {
    const save = this.loadMain();
    // Defensive: ensure worldFlags exists (backward compatibility)
    if (!save.worldFlags) {
      save.worldFlags = {};
      this.writeMain(save); // Persist the structure
    }
    return save.worldFlags[areaId]?.[key] as T | undefined;
  }

  /**
   * Set a world flag value (persistent per-world state)
   * @param areaId - The area/world ID (e.g., 'woodline')
   * @param key - The flag key (e.g., 'campfireLit')
   * @param value - The value to store
   */
  setWorldFlag(areaId: string, key: string, value: any): SaveData {
    const save = this.loadMain();
    // Defensive: ensure worldFlags structure exists at all levels
    if (!save.worldFlags) {
      save.worldFlags = {};
    }
    if (!save.worldFlags[areaId]) {
      save.worldFlags[areaId] = {};
    }
    save.worldFlags[areaId][key] = value;
    this.writeMain(save); // Atomic write - won't corrupt other save sections
    return save;
  }

  /**
   * Clear all world flags for a specific area
   */
  clearWorldFlags(areaId: string): SaveData {
    const save = this.loadMain();
    if (save.worldFlags) {
      delete save.worldFlags[areaId];
    }
    this.writeMain(save);
    return save;
  }
}

// Export singleton instance
export const saveFacade = new SaveFacade();
