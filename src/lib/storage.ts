/**
 * LocalStorage wrapper with schema and versioning
 */

export interface StorageSchema {
  version: number;
  data: any;
}

export class StorageManager {
  private prefix: string;
  private currentVersion: number;

  constructor(prefix = 'littleworlds_', version = 1) {
    this.prefix = prefix;
    this.currentVersion = version;
  }

  set<T>(key: string, value: T): boolean {
    try {
      const data: StorageSchema = {
        version: this.currentVersion,
        data: value,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save to storage:', error);
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return defaultValue;

      const stored: StorageSchema = JSON.parse(item);
      
      // Version mismatch handling
      if (stored.version !== this.currentVersion) {
        console.warn(`Storage version mismatch: ${stored.version} vs ${this.currentVersion}`);
        return defaultValue;
      }

      return stored.data as T;
    } catch (error) {
      console.error('Failed to read from storage:', error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  has(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }
}

export const storage = new StorageManager();
