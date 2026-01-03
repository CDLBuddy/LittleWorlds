// src/game/systems/saves/migrations.ts
/**
 * Save data migrations for version upgrades
 *
 * HARDENING (Phase 2.9):
 * - Prevents role-state aliasing (boy/girl sharing same arrays/objects).
 * - Normalizes role fields defensively during migrations.
 * - Repairs aliasing if it already exists in older saves.
 */

import type { SaveData, RoleProgress } from './SaveSystem';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Migration = (data: any) => any;

const ALL_AREAS = ['backyard', 'woodline', 'creek', 'pine', 'dusk', 'night', 'beach'] as const;

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? ([...value] as T[]) : [...fallback];
}

function safeClone<T>(value: T): T {
  // We’re reading JSON from localStorage. structuredClone is ideal; JSON fallback is fine here.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = (globalThis as any).structuredClone as undefined | ((x: any) => any);
    if (typeof sc === 'function') return sc(value);
  } catch {
    // ignore
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function createRoleProgressFromLoose(input: unknown): RoleProgress {
  const src = isObject(input) ? input : {};
  return {
    unlockedAreas: [...ALL_AREAS],
    completedAreas: cloneArray<string>(src.completedAreas, []),
    completedTasks: cloneArray<string>(src.completedTasks, []),
    inventory: cloneArray<string>(src.inventory, []),
    lastAreaId: typeof src.lastAreaId === 'string' && src.lastAreaId.length > 0 ? src.lastAreaId : 'backyard',
  };
}

/**
 * Repairs the classic aliasing bug where roles share the same object or arrays.
 * This is intentionally aggressive: if a shared reference is detected, we split both sides.
 */
function repairRoleAliasing(data: any): any {
  if (!data || !isObject(data)) return data;
  if (!data.roles || !isObject(data.roles)) return data;
  if (!data.roles.boy || !data.roles.girl) return data;

  const boy = data.roles.boy;
  const girl = data.roles.girl;

  // If boy/girl are literally the same object, clone girl.
  if (boy === girl) {
    data.roles.girl = safeClone(boy);
  }

  const b = data.roles.boy;
  const g = data.roles.girl;

  const fields = ['unlockedAreas', 'completedAreas', 'completedTasks', 'inventory'] as const;

  for (const f of fields) {
    if (Array.isArray(b[f]) && Array.isArray(g[f]) && b[f] === g[f]) {
      b[f] = [...b[f]];
      g[f] = [...g[f]];
    }
  }

  return data;
}

export const migrations: Record<number, Migration> = {
  // Migrate from version 0 to 1
  1: (data: any) => {
    const next = {
      ...data,
      version: 1,
      worldId: data.worldId || 'forest',
    };
    return next;
  },

  // Migrate from version 1 to 2 (dual-role progression)
  2: (data: any) => {
    // If already has roles structure, normalize it and bump version
    if (data.roles) {
      const boy = createRoleProgressFromLoose(data.roles.boy);
      const girl = createRoleProgressFromLoose(data.roles.girl);

      const next = {
        ...data,
        version: 2,
        timestamp: data.timestamp || Date.now(),
        slotId: data.slotId || 'main',
        roles: { boy, girl },
        lastSelectedRole: data.lastSelectedRole ?? null,
        // worldFlags lands in later versions, but it’s safe to seed now for consistency
        worldFlags: isObject(data.worldFlags) ? safeClone(data.worldFlags) : {},
      };

      return repairRoleAliasing(next);
    }

    // Migrate from v1 format (single-role-ish fields) → dual-role
    const completedTasks = cloneArray<string>(data.completedTasks, []);
    const inventory = cloneArray<string>(data.inventory, []);

    // IMPORTANT: each role gets its own arrays (no shared references)
    const boy: RoleProgress = {
      unlockedAreas: [...ALL_AREAS],
      completedAreas: [],
      completedTasks: [...completedTasks],
      inventory: [...inventory],
      lastAreaId: 'backyard',
    };

    const girl: RoleProgress = {
      unlockedAreas: [...ALL_AREAS],
      completedAreas: [],
      completedTasks: [...completedTasks],
      inventory: [...inventory],
      lastAreaId: 'backyard',
    };

    const next = {
      version: 2,
      timestamp: data.timestamp || Date.now(),
      slotId: data.slotId || 'main',
      roles: { boy, girl },
      lastSelectedRole: null,
      worldFlags: {}, // Initialize worldFlags registry
    };

    return repairRoleAliasing(next);
  },

  // Migrate from version 2 to 3 (unlock all areas)
  3: (data: any) => {
    const roles = isObject(data.roles) ? data.roles : {};
    const boy = createRoleProgressFromLoose(roles.boy);
    const girl = createRoleProgressFromLoose(roles.girl);

    const next = {
      ...data,
      version: 3,
      roles: {
        boy: { ...boy, unlockedAreas: [...ALL_AREAS] },
        girl: { ...girl, unlockedAreas: [...ALL_AREAS] },
      },
    };

    return repairRoleAliasing(next);
  },

  // Migrate from version 3 to 4 (add shared collections structure)
  4: (data: any) => {
    const next = {
      ...data,
      version: 4,
      shared: isObject(data.shared)
        ? safeClone(data.shared)
        : {
            findsByArea: {},
            trophiesByArea: {},
            postcardsByArea: {},
            audioByArea: {},
            campUpgrades: [],
          },
      lastSelectedRole: data.lastSelectedRole ?? null,
      worldFlags: isObject(data.worldFlags) ? safeClone(data.worldFlags) : {},
    };

    return repairRoleAliasing(next);
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSaveData(data: any, targetVersion: number): SaveData {
  // Clone to avoid mutating the caller’s object and to reduce reference carryover.
  let currentData = safeClone(data ?? {});
  const currentVersion = currentData.version || 0;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    if (migrations[v]) {
      currentData = migrations[v](currentData);
      // Safety net: if any migration reintroduces aliasing, split it immediately.
      currentData = repairRoleAliasing(currentData);
    }
  }

  return currentData as SaveData;
}
