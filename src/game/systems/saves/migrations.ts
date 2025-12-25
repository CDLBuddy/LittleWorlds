/**
 * Save data migrations for version upgrades
 */

import { SaveData } from './SaveSystem';

export type Migration = (data: any) => any;

export const migrations: Record<number, Migration> = {
  // Example: migrate from version 0 to 1
  1: (data: any) => {
    return {
      ...data,
      version: 1,
      // Add new fields with defaults
      worldId: data.worldId || 'forest',
    };
  },
};

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
