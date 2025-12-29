/**
 * Progression System - Manages area -> tasks -> unlock next
 */

import type { TaskSystem } from '../tasks/TaskSystem';
import type { AreaId, RoleId } from '@game/content/areas';
import { AREAS } from '@game/content/areas';
import { TASKS_BY_ID, campfire_v1 } from '@game/content/tasks';
import { saveFacade } from '../saves/saveFacade';
import { eventBus } from '@game/shared/events';

interface ProgressionOptions {
  devBootFallback?: boolean;
}

export class ProgressionSystem {
  private taskIds: string[] = [];
  private currentTaskIndex = 0;
  private usingBootFallback = false;

  constructor(
    private taskSystem: TaskSystem,
    private roleId: RoleId,
    private areaId: AreaId,
    options: ProgressionOptions = {}
  ) {
    // Check if we should use BootWorld fallback
    if (options.devBootFallback && areaId === 'backyard') {
      console.log('[ProgressionSystem] Using BootWorld fallback for Backyard');
      this.usingBootFallback = true;
      this.taskIds = [campfire_v1.id];
    } else {
      // Load tasks for this area and role
      const area = AREAS[areaId];
      if (!area) {
        console.error(`[ProgressionSystem] Unknown area: ${areaId}`);
        this.taskIds = [];
        return;
      }

      const taskIds = area.tasksByRole[roleId];
      if (!taskIds || taskIds.length === 0) {
        console.warn(`[ProgressionSystem] No tasks defined for ${roleId} in ${areaId}`);
        this.taskIds = [];
        return;
      }

      // Filter out missing tasks (dev safety)
      this.taskIds = taskIds.filter((id) => {
        if (!TASKS_BY_ID[id]) {
          console.warn(`[ProgressionSystem] Task ${id} not found in TASKS_BY_ID`);
          return false;
        }
        return true;
      });
    }

    console.log(`[ProgressionSystem] Initialized for ${roleId} in ${areaId}:`, this.taskIds);
  }

  /**
   * Start the progression (load first task)
   */
  start(): void {
    if (this.taskIds.length === 0) {
      console.warn('[ProgressionSystem] No tasks to start');
      return;
    }

    this.currentTaskIndex = 0;
    this.loadCurrentTask();
  }

  /**
   * Handle task completion event
   */
  handleTaskEvent(taskId: string, complete: boolean): void {
    if (!complete) return;

    console.log(`[ProgressionSystem] Task complete: ${taskId}`);

    // Mark task as complete in save
    saveFacade.markTaskComplete(this.roleId, taskId);

    // If using boot fallback, treat campfire completion as Backyard complete
    if (this.usingBootFallback && taskId === campfire_v1.id) {
      console.log('[ProgressionSystem] BootWorld fallback: Marking Backyard complete');
      this.completeArea();
      return;
    }

    // Advance to next task
    this.currentTaskIndex++;

    if (this.currentTaskIndex >= this.taskIds.length) {
      // All tasks in area complete
      console.log(`[ProgressionSystem] All tasks complete in ${this.areaId}`);
      this.completeArea();
    } else {
      // Load next task
      this.loadCurrentTask();
    }
  }

  /**
   * Mark area as complete and unlock next
   */
  private completeArea(): void {
    const area = AREAS[this.areaId];
    const nextAreaId = area?.next;

    console.log(`[ProgressionSystem] Completing area ${this.areaId}, next: ${nextAreaId || 'none'}`);

    // Mark area complete and unlock next
    saveFacade.markAreaComplete(this.roleId, this.areaId, nextAreaId);

    // Save inventory state
    const inventory = this.taskSystem.getInventory();
    saveFacade.setInventory(this.roleId, inventory);
    
    // Emit toast for area completion (cast to any as ui/toast is not in GameToUi union)
    if (nextAreaId) {
      const nextArea = AREAS[nextAreaId];
      const areaName = nextArea?.name || nextAreaId;
      (eventBus as any).emit({
        type: 'ui/toast',
        level: 'info',
        message: `${areaName} unlocked!`,
      });
    } else {
      // Final area completed
      (eventBus as any).emit({
        type: 'ui/toast',
        level: 'info',
        message: 'Chapter complete!',
      });
    }

    console.log('[ProgressionSystem] Area progression complete');
  }

  /**
   * Load the current task
   */
  private loadCurrentTask(): void {
    const taskId = this.taskIds[this.currentTaskIndex];
    
    // Special case: use campfire_v1 directly for boot fallback
    const task = this.usingBootFallback && taskId === campfire_v1.id
      ? campfire_v1
      : TASKS_BY_ID[taskId];

    if (!task) {
      console.error(`[ProgressionSystem] Task not found: ${taskId}`);
      return;
    }

    console.log(`[ProgressionSystem] Starting task ${this.currentTaskIndex + 1}/${this.taskIds.length}: ${task.name}`);
    this.taskSystem.startTask(task);
  }

  getRoleId(): RoleId {
    return this.roleId;
  }

  getAreaId(): AreaId {
    return this.areaId;
  }
}
