/**
 * AutosaveSystem - Automatic progress persistence
 * Saves inventory and progress at key moments to prevent data loss
 */

import type { TaskSystem } from '../tasks/TaskSystem';
import type { RoleId, AreaId } from '@game/content/areas';
import { saveFacade } from '../saves/saveFacade';

interface EventBus {
  on(handler: (event: any) => void): () => void;
}

export class AutosaveSystem {
  private unsub: (() => void) | null = null;
  private intervalHandle: NodeJS.Timeout | null = null;
  private pendingSave = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  
  constructor(
    private eventBus: EventBus,
    private taskSystem: TaskSystem,
    private roleId: RoleId,
    private areaId: AreaId
  ) {}
  
  /**
   * Start autosave system
   */
  start(): void {
    console.log('[AutosaveSystem] Starting for', this.roleId, 'in', this.areaId);
    
    // Subscribe to relevant events
    this.unsub = this.eventBus.on((event: any) => {
      if (event.type === 'game/task' && event.complete) {
        // Task completed - save progress
        this.triggerSave('task complete');
      } else if (event.type === 'ui/pause') {
        // Pause menu opened - save progress
        this.triggerSave('pause');
      } else if (event.type === 'interaction/complete') {
        // Interaction completed (item gained) - save progress
        this.triggerSave('interaction');
      }
    });
    
    // Interval autosave every 60 seconds (15s in dev)
    const intervalMs = import.meta.env.DEV ? 15000 : 60000;
    this.intervalHandle = setInterval(() => {
      this.triggerSave('interval');
    }, intervalMs);
    
    console.log(`[AutosaveSystem] Autosave interval: ${intervalMs}ms`);
  }
  
  /**
   * Trigger a save (debounced to prevent rapid saves)
   */
  private triggerSave(reason: string): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Debounce: save after 500ms of inactivity
    this.debounceTimer = setTimeout(() => {
      this.performSave(reason);
      this.debounceTimer = null;
    }, 500);
  }
  
  /**
   * Perform the actual save operation
   */
  private performSave(reason: string): void {
    if (this.pendingSave) {
      return; // Already saving
    }
    
    this.pendingSave = true;
    
    try {
      const inventory = this.taskSystem.getInventory();
      saveFacade.syncInventory(this.roleId, inventory);
      saveFacade.syncLastArea(this.roleId, this.areaId);
      
      if (import.meta.env.DEV) {
        console.log(`[AutosaveSystem] Saved (${reason}):`, inventory.length, 'items');
      }
    } catch (error) {
      console.error('[AutosaveSystem] Save failed:', error);
    } finally {
      this.pendingSave = false;
    }
  }
  
  /**
   * Stop autosave and cleanup
   */
  stop(): void {
    console.log('[AutosaveSystem] Stopping');
    
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
    
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
  
  /**
   * Force an immediate save (called on dispose)
   */
  forceSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.performSave('force');
  }
  
  dispose(): void {
    // Force one final save before cleanup
    this.forceSave();
    this.stop();
  }
}
