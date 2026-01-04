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

    if (import.meta.env.DEV) {
      console.log(`[ProgressionSystem] Initialized for ${roleId} in ${areaId}:`, this.taskIds);
    }
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
   * @param taskId - The task that was completed
   * @param complete - Whether the task is complete
   * @param roleId - The role that completed the task (from event stamp)
   */
  handleTaskEvent(taskId: string, complete: boolean, roleId?: RoleId): void {
    if (!complete) return;

    // Determine effective role (prefer stamped role from event)
    const effectiveRole = roleId ?? this.roleId;

    // SAFETY: Reject stale role completions (task was for a different role)
    if (roleId && roleId !== this.roleId) {
      console.warn(
        `[ProgressionSystem] ⚠️  Ignoring task event for ${roleId} while current role is ${this.roleId}`,
        { taskId, effectiveRole, currentRole: this.roleId }
      );
      return;
    }

    // SAFETY: Reject out-of-order completions (prevents duplicate/stale task events)
    const expectedId = this.taskIds[this.currentTaskIndex];
    if (taskId !== expectedId) {
      console.warn(
        `[ProgressionSystem] ⚠️  Ignoring stale/out-of-order completion`,
        { expected: expectedId, got: taskId, index: this.currentTaskIndex }
      );
      return;
    }

    console.log(`[ProgressionSystem] Task complete: ${taskId} (role: ${effectiveRole})`);

    // Mark task as complete in save (using effective role)
    saveFacade.markTaskComplete(effectiveRole, taskId);

    // If using boot fallback, treat campfire completion as Backyard complete
    if (this.usingBootFallback && taskId === campfire_v1.id) {
      console.log('[ProgressionSystem] BootWorld fallback: Marking Backyard complete');
      this.completeArea(effectiveRole);
      return;
    }

    // Advance to next task
    this.currentTaskIndex++;

    if (this.currentTaskIndex >= this.taskIds.length) {
      // All tasks in area complete
      console.log(`[ProgressionSystem] All tasks complete in ${this.areaId}`);
      this.completeArea(effectiveRole);
    } else {
      // Load next task
      this.loadCurrentTask();
    }
  }

  /**
   * Mark area as complete and unlock next
   * @param roleId - The role completing the area (defaults to this.roleId)
   */
  private completeArea(roleId: RoleId = this.roleId): void {
    const area = AREAS[this.areaId];
    const nextAreaId = area?.next;

    console.log(`[ProgressionSystem] Completing area ${this.areaId} for ${roleId}, next: ${nextAreaId || 'none'}`);

    // Mark area complete and unlock next (using explicit roleId)
    saveFacade.markAreaComplete(roleId, this.areaId, nextAreaId);

    // Save inventory state (using explicit roleId)
    const inventory = this.taskSystem.getInventory();
    saveFacade.setInventory(roleId, inventory);
    
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

    if (import.meta.env.DEV) {
      console.log(`[ProgressionSystem] Starting task ${this.currentTaskIndex + 1}/${this.taskIds.length}: ${task.name}`);
    }
    this.taskSystem.startTask(task);
  }

  getRoleId(): RoleId {
    return this.roleId;
  }

  getAreaId(): AreaId {
    return this.areaId;
  }

  /**
   * Switch to a different role and reload tasks for current area
   */
  switchRole(newRoleId: RoleId): void {
    console.log(`[ProgressionSystem] Switching from ${this.roleId} to ${newRoleId}`);
    
    // Reload task list for new role
    const area = AREAS[this.areaId];
    if (!area) {
      console.error(`[ProgressionSystem] Unknown area: ${this.areaId}`);
      this.roleId = newRoleId; // Update role even on error
      return;
    }

    const taskIds = area.tasksByRole[newRoleId];
    if (!taskIds || taskIds.length === 0) {
      console.warn(`[ProgressionSystem] No tasks defined for ${newRoleId} in ${this.areaId}`);
      this.taskIds = [];
      this.roleId = newRoleId; // Update role even with no tasks
      return;
    }

    // Filter out missing tasks
    this.taskIds = taskIds.filter((id) => {
      if (!TASKS_BY_ID[id]) {
        console.warn(`[ProgressionSystem] Task ${id} not found in TASKS_BY_ID`);
        return false;
      }
      return true;
    });

    // Check which tasks are already complete
    const savedProgress = saveFacade.loadMain();
    const completedTasks = savedProgress.roles[newRoleId].completedTasks;
    
    // Find first incomplete task
    this.currentTaskIndex = this.taskIds.findIndex(id => !completedTasks.includes(id));
    
    // Update role BEFORE any operations that touch TaskSystem
    // This prevents desync when debug overlay samples state mid-switch
    this.roleId = newRoleId;
    
    if (this.currentTaskIndex === -1) {
      // All tasks complete for this area/role
      console.log(`[ProgressionSystem] All ${this.taskIds.length} tasks already complete for ${newRoleId} in ${this.areaId}`);
      // Clear any active task in TaskSystem when area is complete
      this.taskSystem.clearTask();
      return;
    }

    console.log(`[ProgressionSystem] Loaded ${this.taskIds.length} tasks for ${newRoleId}, starting at index ${this.currentTaskIndex}`);
    
    // Load the current task
    this.loadCurrentTask();
  }}