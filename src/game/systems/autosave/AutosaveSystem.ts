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
  private paused = false; // Transaction safety: block saves during switch
  private debounceTimer: NodeJS.Timeout | null = null;
  // private scheduledEpoch: number | null = null; // Epoch when save was scheduled - currently unused
  
  constructor(
    private eventBus: EventBus,
    private taskSystem: TaskSystem,
    private roleId: RoleId, // Keep for logging only, not for writes
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
      }
      // Note: Removed 'interaction/complete' trigger to prevent race condition
      // where autosave happens before items are added to inventory
    });
    
    // Interval autosave every 60 seconds (15s in dev)
    const intervalMs = import.meta.env.DEV ? 15000 : 60000;
    this.intervalHandle = setInterval(() => {
      this.triggerSave('interval');
    }, intervalMs);
    
    // console.log(`[AutosaveSystem] Autosave interval: ${intervalMs}ms`);
  }

  /**
   * Update the role ID (called when switching characters)
   */
  setRole(roleId: RoleId): void {
    console.log(`[AutosaveSystem] Updating role from ${this.roleId} to ${roleId}`);
    this.roleId = roleId;
  }

  /**
   * Cancel any pending debounced save (Phase 2.9 transaction safety)
   */
  cancelPending(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      // this.scheduledEpoch = null; // Currently unused
      if (import.meta.env.DEV) {
        console.log('[AutosaveSystem] Canceled pending save');
      }
    }
  }

  /**
   * Pause saves during character switch (Phase 2.9 transaction safety)
   */
  pause(): void {
    this.paused = true;
    if (import.meta.env.DEV) {
      console.log('[AutosaveSystem] Paused (transaction in progress)');
    }
  }

  /**
   * Resume saves after character switch (Phase 2.9 transaction safety)
   */
  resume(): void {
    this.paused = false;
    if (import.meta.env.DEV) {
      console.log('[AutosaveSystem] Resumed');
    }
  }
  
  /**
   * Trigger a save (debounced to prevent rapid saves)
   */
  private triggerSave(reason: string): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Capture current epoch when scheduling
    const epoch = this.taskSystem.getRoleEpoch();
    
    // Debounce: save after 500ms of inactivity
    this.debounceTimer = setTimeout(() => {
      this.performSave(reason, epoch);
      this.debounceTimer = null;
    }, 500);
  }
  
  /**
   * Perform the actual save operation
   * @param reason - Why the save was triggered
   * @param scheduledEpoch - The role epoch when save was scheduled
   */
  private performSave(_reason: string, scheduledEpoch: number): void {
    // TRANSACTION SAFETY: Block saves during switch
    if (this.paused) {
      if (import.meta.env.DEV) {
        console.log('[AutosaveSystem] Save blocked (paused during switch)');
      }
      return;
    }
    
    // EPOCH SAFETY: Reject if role changed since scheduling
    const currentEpoch = this.taskSystem.getRoleEpoch();
    if (scheduledEpoch !== currentEpoch) {
      if (import.meta.env.DEV) {
        console.warn(
          `[AutosaveSystem] ⚠️  Save cancelled (role changed): scheduled@epoch${scheduledEpoch}, now@epoch${currentEpoch}`
        );
      }
      return;
    }
    
    try {
      // ROLE SAFETY: Derive role at write-time (never use cached this.roleId)
      const currentRole = this.taskSystem.getCurrentRole();
      const inventory = this.taskSystem.getInventory();
      
      saveFacade.syncInventory(currentRole, inventory);
      saveFacade.syncLastArea(currentRole, this.areaId);
    } catch (error) {
      console.error('[AutosaveSystem] Save failed:', error);
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
   * Force an immediate save (called after switch completes)
   */
  forceSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    // Use current epoch for immediate save
    const currentEpoch = this.taskSystem.getRoleEpoch();
    this.performSave('force', currentEpoch);
  }
  
  dispose(): void {
    // Just stop - don't save on dispose as inventory may be stale
    // ProgressionSystem handles final save on area complete
    this.stop();
  }
}
