/**
 * Save data migrations for version upgrades
 */

import type { SaveData, RoleProgress } from './SaveSystem';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Migration = (data: any) => any;

export const migrations: Record<number, Migration> = {
  // Migrate from version 0 to 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  1: (data: any) => {
    return {
      ...data,
      version: 1,
      worldId: data.worldId || 'forest',
    };
  },
  
  // Migrate from version 1 to 2 (dual-role progression)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  2: (data: any) => {
    // If already has roles structure, just update version
    if (data.roles) {
      return {
        ...data,
        version: 2,
        // Ensure both roles have all required fields
        roles: {
          boy: {
            unlockedAreas: data.roles.boy?.unlockedAreas || ['backyard'],
            completedAreas: data.roles.boy?.completedAreas || [],
            completedTasks: data.roles.boy?.completedTasks || [],
            inventory: data.roles.boy?.inventory || [],
            lastAreaId: data.roles.boy?.lastAreaId || 'backyard',
          },
          girl: {
            unlockedAreas: data.roles.girl?.unlockedAreas || ['backyard'],
            completedAreas: data.roles.girl?.completedAreas || [],
            completedTasks: data.roles.girl?.completedTasks || [],
            inventory: data.roles.girl?.inventory || [],
            lastAreaId: data.roles.girl?.lastAreaId || 'backyard',
          },
        },
        lastSelectedRole: data.lastSelectedRole || null,
      };
    }
    
    // Migrate from v1 format
    const defaultRoleProgress: RoleProgress = {
      unlockedAreas: ['backyard'],
      completedAreas: [],
      completedTasks: data.completedTasks || [],
      inventory: data.inventory || [],
      lastAreaId: 'backyard',
    };
    
    return {
      version: 2,
      timestamp: data.timestamp || Date.now(),
      slotId: data.slotId || 'main',
      roles: {
        boy: { ...defaultRoleProgress },
        girl: { ...defaultRoleProgress },
      },
      lastSelectedRole: null,
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSaveData(data: any, targetVersion: number): SaveData {
  let currentData = { ...data };
  const currentVersion = currentData.version || 0;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    if (migrations[v]) {
      currentData = migrations[v](currentData);
    }
  }

  return currentData as SaveData;
}
