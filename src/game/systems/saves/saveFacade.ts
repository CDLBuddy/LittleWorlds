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
}

// Export singleton instance
export const saveFacade = new SaveFacade();
