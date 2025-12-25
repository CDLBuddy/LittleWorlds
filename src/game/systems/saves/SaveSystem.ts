/**
 * Save System - save slots, versioning
 */

export interface SaveData {
  version: number;
  timestamp: number;
  slotId: string;
  playerPosition: { x: number; y: number; z: number };
  inventory: string[];
  completedTasks: string[];
  worldId: string;
}

export class SaveSystem {
  private currentSlot: string | null = null;
  private readonly SAVE_VERSION = 1;
  private readonly STORAGE_PREFIX = 'littleworlds_save_';

  loadSlot(slotId: string): SaveData | null {
    try {
      const key = this.STORAGE_PREFIX + slotId;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const saveData = JSON.parse(data) as SaveData;
      this.currentSlot = slotId;
      
      return saveData;
    } catch (error) {
      console.error('Failed to load save:', error);
      return null;
    }
  }

  saveSlot(slotId: string, data: Omit<SaveData, 'version' | 'timestamp' | 'slotId'>): boolean {
    try {
      const saveData: SaveData = {
        ...data,
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        slotId,
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

  deleteSlot(slotId: string): void {
    const key = this.STORAGE_PREFIX + slotId;
    localStorage.removeItem(key);
  }

  getCurrentSlot(): string | null {
    return this.currentSlot;
  }
}
