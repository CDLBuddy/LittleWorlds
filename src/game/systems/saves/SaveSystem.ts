/**
 * Save System - save slots, versioning
 *
 * HARDENING (Phase 2.9):
 * - Normalizes loaded/migrated data into a safe shape.
 * - Repairs the classic aliasing bug: roles.boy and roles.girl sharing the same object/arrays.
 * - Ensures writes always persist current version + slotId + safe structures.
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
  unlockedAreas: string[]; // AreaId[]
  completedAreas: string[]; // AreaId[]
  completedTasks: string[]; // task ids
  inventory: string[]; // persistent per role
  lastAreaId: string; // AreaId
}

// Shared state across both roles (collections, upgrades)
export interface SharedState {
  findsByArea: Record<string, string[]>; // areaId -> findIds[]
  trophiesByArea: Record<string, boolean>; // areaId -> collected
  postcardsByArea: Record<string, boolean>; // areaId -> collected
  audioByArea: Record<string, boolean>; // areaId -> unlocked
  campUpgrades: string[]; // upgradeIds[]
}

export interface SaveData {
  version: number;
  timestamp: number;
  slotId: string;
  roles: Record<'boy' | 'girl', RoleProgress>;
  lastSelectedRole: 'boy' | 'girl' | null;
  shared: SharedState; // Shared collections/progression
  worldFlags?: Record<string, Record<string, any>>; // Per-world persistent flags
}

const DEV = import.meta.env.DEV;

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function copyArray<T>(arr: unknown, fallback: T[] = []): T[] {
  return Array.isArray(arr) ? ([...arr] as T[]) : [...fallback];
}

function copyRecord<T extends Record<string, any>>(obj: unknown, fallback: T): T {
  return isObject(obj) ? ({ ...(obj as any) } as T) : { ...(fallback as any) };
}

function deepCloneJson<T>(value: T): T {
  // Data is JSON-shaped (localStorage). This is safe and cheap enough.
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

export class SaveSystem {
  private currentSlot: string | null = null;
  private readonly SAVE_VERSION = 4; // Bumped for shared collections
  private readonly STORAGE_PREFIX = 'littleworlds_save_';

  // Keep this as a constant template, but ALWAYS clone it per role to avoid aliasing.
  private readonly DEFAULT_UNLOCKED_AREAS = [
    'backyard',
    'woodline',
    'creek',
    'pine',
    'dusk',
    'night',
    'beach',
  ] as const;

  private storageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
      const testKey = `${this.STORAGE_PREFIX}__test__`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create default role progress (MUST be fresh objects/arrays per call)
   */
  createDefaultRoleProgress(): RoleProgress {
    return {
      unlockedAreas: [...this.DEFAULT_UNLOCKED_AREAS],
      completedAreas: [],
      completedTasks: [],
      inventory: [],
      lastAreaId: 'backyard',
    };
  }

  private normalizeRoleProgress(input: unknown): RoleProgress {
    const fallback = this.createDefaultRoleProgress();
    if (!isObject(input)) return fallback;

    return {
      unlockedAreas: copyArray<string>(input.unlockedAreas, fallback.unlockedAreas),
      completedAreas: copyArray<string>(input.completedAreas, fallback.completedAreas),
      completedTasks: copyArray<string>(input.completedTasks, fallback.completedTasks),
      inventory: copyArray<string>(input.inventory, fallback.inventory),
      lastAreaId: typeof input.lastAreaId === 'string' && input.lastAreaId.length > 0 ? input.lastAreaId : fallback.lastAreaId,
    };
  }

  private normalizeShared(input: unknown): SharedState {
    const fallback: SharedState = {
      findsByArea: {},
      trophiesByArea: {},
      postcardsByArea: {},
      audioByArea: {},
      campUpgrades: [],
    };

    if (!isObject(input)) return deepCloneJson(fallback);

    const findsByAreaRaw = input.findsByArea;
    const findsByArea: Record<string, string[]> = {};
    if (isObject(findsByAreaRaw)) {
      for (const [areaId, ids] of Object.entries(findsByAreaRaw)) {
        findsByArea[areaId] = copyArray<string>(ids, []);
      }
    }

    return {
      findsByArea,
      trophiesByArea: copyRecord<Record<string, boolean>>(input.trophiesByArea, {}),
      postcardsByArea: copyRecord<Record<string, boolean>>(input.postcardsByArea, {}),
      audioByArea: copyRecord<Record<string, boolean>>(input.audioByArea, {}),
      campUpgrades: copyArray<string>(input.campUpgrades, []),
    };
  }

  /**
   * Repairs role aliasing (boy/girl sharing same object/arrays).
   * Returns true if any repair happened.
   */
  private ensureRoleIsolation(save: SaveData): boolean {
    let repaired = false;

    // Extreme case: the entire role progress object is the same ref
    if (save.roles.boy === save.roles.girl) {
      save.roles.girl = deepCloneJson(save.roles.boy);
      repaired = true;
    }

    const b = save.roles.boy as any;
    const g = save.roles.girl as any;

    const fields = ['unlockedAreas', 'completedAreas', 'completedTasks', 'inventory'] as const;

    for (const f of fields) {
      if (Array.isArray(b[f]) && Array.isArray(g[f]) && b[f] === g[f]) {
        // Split both sides to guarantee isolation
        b[f] = [...b[f]];
        g[f] = [...g[f]];
        repaired = true;
      }
    }

    // Also guarantee each field is a real array (migration safety)
    for (const f of fields) {
      if (!Array.isArray(b[f])) {
        b[f] = [];
        repaired = true;
      }
      if (!Array.isArray(g[f])) {
        g[f] = [];
        repaired = true;
      }
    }

    return repaired;
  }

  private normalizeSaveData(input: unknown, slotId: string): { save: SaveData; changed: boolean } {
    const now = Date.now();
    const raw = isObject(input) ? input : {};

    const rolesRaw = raw.roles;
    const rolesObj = isObject(rolesRaw) ? rolesRaw : {};

    const normalized: SaveData = {
      version: typeof raw.version === 'number' ? raw.version : this.SAVE_VERSION,
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : now,
      slotId: typeof raw.slotId === 'string' && raw.slotId.length > 0 ? raw.slotId : slotId,
      roles: {
        boy: this.normalizeRoleProgress((rolesObj as any).boy),
        girl: this.normalizeRoleProgress((rolesObj as any).girl),
      },
      lastSelectedRole:
        raw.lastSelectedRole === 'boy' || raw.lastSelectedRole === 'girl' ? raw.lastSelectedRole : null,
      shared: this.normalizeShared(raw.shared),
      worldFlags: isObject(raw.worldFlags) ? deepCloneJson(raw.worldFlags) : {},
    };

    // Enforce current version + slotId
    let changed =
      normalized.version !== this.SAVE_VERSION ||
      normalized.slotId !== slotId;

    normalized.version = this.SAVE_VERSION;
    normalized.slotId = slotId;

    // Repair aliasing if any
    const repaired = this.ensureRoleIsolation(normalized);
    if (repaired) changed = true;

    // If timestamp was missing/invalid, normalize it (does not force rewrite alone)
    if (typeof raw.timestamp !== 'number') {
      normalized.timestamp = now;
    }

    if (DEV && repaired) {
      console.error('[SaveSystem] 🔥 Role state aliasing detected and repaired during normalize()', {
        slotId,
      });
    }

    return { save: normalized, changed };
  }

  /**
   * Create default save data (MUST be fresh objects/arrays per role)
   */
  createDefaultSave(slotId: string): SaveData {
    const base: SaveData = {
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
      worldFlags: {},
    };

    // Paranoia: guarantee isolation even in defaults
    this.ensureRoleIsolation(base);
    return base;
  }

  loadSlot(slotId: string): SaveData | null {
    try {
      if (!this.storageAvailable()) {
        console.warn('[SaveSystem] Storage unavailable (localStorage blocked). Using volatile defaults.');
        const { save } = this.normalizeSaveData(this.createDefaultSave(slotId), slotId);
        this.currentSlot = slotId;
        return save;
      }

      const key = this.STORAGE_PREFIX + slotId;
      const data = localStorage.getItem(key);

      if (!data) return null;

      const rawData = JSON.parse(data);

      // Migrate to current version (migration may still produce aliasing — we normalize after)
      const migratedData = migrateSaveData(rawData, this.SAVE_VERSION);

      // Normalize + repair + enforce version/slotId
      const { save: normalized, changed } = this.normalizeSaveData(migratedData, slotId);

      // Persist if:
      // - version changed during migration OR
      // - normalization/repair changed anything important
      const versionChanged = migratedData?.version !== rawData?.version;
      if (versionChanged || changed) {
        const fromV = rawData?.version ?? 'unknown';
        const toV = normalized.version;
        console.log(`[SaveSystem] Persisting normalized save (migrate:${versionChanged} normalize:${changed}) v${fromV} → v${toV}`);
        this.write(slotId, normalized);
      }

      this.currentSlot = slotId;
      return normalized;
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
   * Write save data to storage (always enforces safe shape).
   */
  write(slotId: string, data: SaveData): boolean {
    try {
      if (!this.storageAvailable()) {
        // Still set current slot so the rest of the game can proceed in-memory.
        this.currentSlot = slotId;
        return true;
      }

      // Normalize before writing to guarantee no aliasing + correct version/slotId
      const { save: normalized } = this.normalizeSaveData(data, slotId);

      const saveData: SaveData = {
        ...normalized,
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
    if (!this.storageAvailable()) return;
    const key = this.STORAGE_PREFIX + slotId;
    localStorage.removeItem(key);
  }

  getCurrentSlot(): string | null {
    return this.currentSlot;
  }
}
