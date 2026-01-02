/**
 * Save System - save slots, versioning
 */

import { migrateSaveData } from './migrations';

// Old v1 format (for reference during migration)
export interface SaveDataV1 {
  version: number;
  timestamp: number;
  slotId: string;
  playerPosition: { x: number; y: number; z: number };
  inventory: string[];
  completedTasks: string[];
  worldId: string;
}

// v2+ format with dual-role progression
export interface RoleProgress {
  unlockedAreas: string[];      // AreaId[]
  completedAreas: string[];     // AreaId[]
  completedTasks: string[];     // task ids
  inventory: string[];          // persistent per role
  lastAreaId: string;           // AreaId
}

// Shared state across both roles (collections, upgrades)
export interface SharedState {
  findsByArea: Record<string, string[]>;      // areaId -> findIds[]
  trophiesByArea: Record<string, boolean>;    // areaId -> collected
  postcardsByArea: Record<string, boolean>;   // areaId -> collected
  audioByArea: Record<string, boolean>;       // areaId -> unlocked
  campUpgrades: string[];                     // upgradeIds[]
}

export interface SaveData {
  version: number;
  timestamp: number;
  slotId: string;
  roles: Record<'boy' | 'girl', RoleProgress>;
  lastSelectedRole: 'boy' | 'girl' | null;
  shared: SharedState;                       // Shared collections/progression
  worldFlags?: Record<string, Record<string, any>>; // Per-world persistent flags
}

export class SaveSystem {
  private currentSlot: string | null = null;
  private readonly SAVE_VERSION = 4; // Bumped for shared collections
  private readonly STORAGE_PREFIX = 'littleworlds_save_';

  /**
   * Create default role progress
   */
  createDefaultRoleProgress(): RoleProgress {
    return {
      unlockedAreas: ['backyard', 'woodline', 'creek', 'pine', 'dusk', 'night', 'beach'],
      completedAreas: [],
      completedTasks: [],
      inventory: [],
      lastAreaId: 'backyard',
    };
  }

  /**
   * Create default save data
   */
  createDefaultSave(slotId: string): SaveData {
    return {
      version: this.SAVE_VERSION,
      timestamp: Date.now(),
      slotId,
      roles: {
        boy: this.createDefaultRoleProgress(),
        girl: this.createDefaultRoleProgress(),
      },
      lastSelectedRole: null,
      shared: {
        findsByArea: {},
        trophiesByArea: {},
        postcardsByArea: {},
        audioByArea: {},
        campUpgrades: [],
      },
      worldFlags: {}, // Empty world flags registry
    };
  }

  loadSlot(slotId: string): SaveData | null {
    try {
      const key = this.STORAGE_PREFIX + slotId;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const rawData = JSON.parse(data);
      
      // Migrate to current version
      const migratedData = migrateSaveData(rawData, this.SAVE_VERSION);
      
      // If version changed, persist migrated data
      if (migratedData.version !== rawData.version) {
        console.log(`[SaveSystem] Migrated save from v${rawData.version} to v${migratedData.version}`);
        this.write(slotId, migratedData);
      }
      
      this.currentSlot = slotId;
      return migratedData;
    } catch (error) {
      console.error('Failed to load save:', error);
      return null;
    }
  }

  /**
   * Load or create a save slot
   */
  loadOrCreate(slotId: string): SaveData {
    const existing = this.loadSlot(slotId);
    if (existing) return existing;
    
    const defaultSave = this.createDefaultSave(slotId);
    this.write(slotId, defaultSave);
    return defaultSave;
  }

  /**
   * Write save data to storage
   */
  write(slotId: string, data: SaveData): boolean {
    try {
      const saveData: SaveData = {
        ...data,
        timestamp: Date.now(),
      };

      const key = this.STORAGE_PREFIX + slotId;
      localStorage.setItem(key, JSON.stringify(saveData));
      this.currentSlot = slotId;
      
      return true;
    } catch (error) {
      console.error('Failed to save:', error);
      return false;
    }
  }

  /**
   * Legacy save method (deprecated, use write instead)
   */
  saveSlot(slotId: string, data: Omit<SaveData, 'version' | 'timestamp' | 'slotId'>): boolean {
    const fullData: SaveData = {
      ...(data as SaveData),
      version: this.SAVE_VERSION,
      timestamp: Date.now(),
      slotId,
    };
    return this.write(slotId, fullData);
  }

  deleteSlot(slotId: string): void {
    const key = this.STORAGE_PREFIX + slotId;
    localStorage.removeItem(key);
  }

  getCurrentSlot(): string | null {
    return this.currentSlot;
  }
}
