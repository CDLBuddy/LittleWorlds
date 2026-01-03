/**
 * Task System - toddler-friendly task chains
 *
 * Robustness upgrades:
 * - Single inventory broadcast per step completion (no spam per item).
 * - Switch-safe step completion (ignores work if role changed mid-call).
 * - Clears task state on role switch to avoid stale task display during transition.
 * - DEV logging is still helpful, but less noisy and more structured.
 */

import type { Task } from '@game/content/tasks';
import type { AppEvent } from '@game/shared/events';
import { switchContext } from '../characters/SwitchContext';

type RoleId = 'boy' | 'girl';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

export class TaskSystem {
  private currentTask: Task | null = null;
  private currentStepIndex = 0;

  private inventory = new Set<string>();
  private currentRole: RoleId = 'boy';

  // Increments on every role switch. Used to invalidate in-flight operations safely.
  private roleEpoch = 0;

  private eventBusSub: (() => void) | null = null;

  // Used to avoid broadcasting identical inventory payloads back-to-back.
  private lastInventorySignature = '';

  constructor(private eventBus: EventBus) {
    this.eventBusSub = this.eventBus.on((evt) => {
      if (evt.type === 'ui/getInventory') {
        if (import.meta.env.DEV) {
          console.log(
            '[TaskSystem] UI requested inventory:',
            { role: this.currentRole, count: this.inventory.size, epoch: this.roleEpoch }
          );
        }
        this.broadcastInventory();
      }
    });
  }

  /**
   * Get current character role
   */
  getCurrentRole(): RoleId {
    return this.currentRole;
  }

  /**
   * Get the current role epoch (increments on every switch)
   * Used for transaction safety - pending operations can check if role changed.
   */
  getRoleEpoch(): number {
    return this.roleEpoch;
  }

  /**
   * Get current inventory as array
   */
  getInventory(): string[] {
    return Array.from(this.inventory);
  }

  /**
   * Set inventory from array (for restoring from save)
   */
  setInventory(items: string[]): void {
    this.inventory = new Set(items);
    this.broadcastInventory(true);
  }

  /**
   * Switch character role and inventory.
   * NOTE: We clear task state here to prevent stale task display during the switch transaction.
   * ProgressionSystem is responsible for starting the correct task for the new role.
   */
  switchCharacter(roleId: RoleId, items: string[]): void {
    this.currentRole = roleId;
    this.roleEpoch++;

    // Clear any active task view immediately during switch.
    this.currentTask = null;
    this.currentStepIndex = 0;

    this.inventory = new Set(items);
    this.lastInventorySignature = ''; // force broadcast even if same payload

    this.broadcastInventory(true);

    if (import.meta.env.DEV) {
      console.log(
        `[TaskSystem] Switched to ${roleId} with ${items.length} items (epoch ${this.roleEpoch})`
      );
    }
  }

  /**
   * Add an item to inventory (single broadcast)
   */
  addItem(itemId: string): void {
    const before = this.inventory.size;
    this.inventory.add(itemId);
    if (this.inventory.size !== before) this.broadcastInventory();
  }

  /**
   * Start a task at step 0
   */
  startTask(task: Task): void {
    this.currentTask = task;
    this.currentStepIndex = 0;
    this.emitTaskEvent();
  }

  /**
   * Clear current task (for completed areas or role switches)
   */
  clearTask(): void {
    if (import.meta.env.DEV) console.log('[TaskSystem] Clearing current task');
    this.currentTask = null;
    this.currentStepIndex = 0;

    // We intentionally do NOT emit a task event here because there is no taskId.
    // Consumers that care about task display should read TaskSystem state or wait for next startTask().
  }

  getCurrentTargetId(): string | null {
    const step = this.getCurrentStep();
    return step?.targetId ?? null;
  }

  getCurrentStep(): Task['steps'][number] | null {
    if (!this.currentTask) return null;
    if (this.currentStepIndex < 0 || this.currentStepIndex >= this.currentTask.steps.length) return null;
    return this.currentTask.steps[this.currentStepIndex];
  }

  canInteract(targetId: string): boolean {
    const step = this.getCurrentStep();
    if (!step) return false;
    if (step.targetId !== targetId) return false;

    if (step.requiresItems) {
      for (const itemId of step.requiresItems) {
        if (!this.inventory.has(itemId)) return false;
      }
    }

    return true;
  }

  completeCurrentStep(): void {
    // Snapshot state for switch-safety
    const epochAtStart = this.roleEpoch;
    const roleAtStart = this.currentRole;

    const task = this.currentTask;
    if (!task) return;

    const step = this.getCurrentStep();
    if (!step) return;

    let inventoryChanged = false;

    // Apply grants (batch, one broadcast at end)
    if (step.grantsItems?.length) {
      for (const itemId of step.grantsItems) {
        const before = this.inventory.size;
        this.inventory.add(itemId);
        if (this.inventory.size !== before) inventoryChanged = true;
      }

      // Toast for item gains (still ok even if inventory didn’t change due to duplicates)
      const itemNames = step.grantsItems.map((id) => this.formatItemName(id));
      const message =
        itemNames.length === 1
          ? `You found: ${itemNames[0]}!`
          : `You found: ${itemNames.slice(0, 2).join(' + ')}!`;

      // Emit toast notification (cast because ui/toast isn't in strict union)
      (this.eventBus as any).emit({
        type: 'ui/toast',
        level: 'info',
        message,
      });
    }

    // Apply consumes (batch)
    if (step.consumesItems?.length) {
      for (const itemId of step.consumesItems) {
        if (this.inventory.delete(itemId)) inventoryChanged = true;
      }
    }

    // If we switched roles mid-step, abort without emitting wrong-role task events.
    if (this.roleEpoch !== epochAtStart || this.currentRole !== roleAtStart) {
      if (import.meta.env.DEV) {
        console.warn('[TaskSystem] Step completion aborted (role switched mid-call)', {
          roleAtStart,
          roleNow: this.currentRole,
          epochAtStart,
          epochNow: this.roleEpoch,
          taskId: task.id,
        });
      }
      // Still broadcast inventory if it changed (it belongs to the new active role now),
      // but keep it safe and explicit.
      if (inventoryChanged) this.broadcastInventory(true);
      return;
    }

    // Single inventory broadcast after step modifications
    if (inventoryChanged) this.broadcastInventory();

    // Advance step index
    this.currentStepIndex++;

    // Task complete?
    if (this.currentStepIndex >= task.steps.length) {
      this.eventBus.emit({
        type: 'game/task',
        taskId: task.id,
        stepIndex: this.currentStepIndex,
        complete: true,
        roleId: this.currentRole,
        switchSeq: import.meta.env.DEV ? switchContext.getSeq() : undefined,
      });

      if (import.meta.env.DEV) {
        console.log('[TaskSystem] Task complete (inventory preserved)', {
          role: this.currentRole,
          taskId: task.id,
          steps: task.steps.length,
          epoch: this.roleEpoch,
        });
      }

      // Do NOT clear currentTask here; ProgressionSystem starts the next task.
      return;
    }

    // Not complete: emit step update
    this.emitTaskEvent();
  }

  /**
   * Emit current task event (step update)
   */
  private emitTaskEvent(): void {
    if (!this.currentTask) return;

    this.eventBus.emit({
      type: 'game/task',
      taskId: this.currentTask.id,
      stepIndex: this.currentStepIndex,
      roleId: this.currentRole,
      switchSeq: import.meta.env.DEV ? switchContext.getSeq() : undefined,
    });
  }

  private broadcastInventory(force = false): void {
    const items = Array.from(this.inventory);
    // Signature avoids identical payload spam (common during UI polling or repeated calls)
    const sig = `${this.currentRole}|${items.length}|${items.join(',')}`;

    if (!force && sig === this.lastInventorySignature) return;
    this.lastInventorySignature = sig;

    if (import.meta.env.DEV) {
      console.log('[TaskSystem] Broadcasting inventory:', {
        role: this.currentRole,
        count: items.length,
        epoch: this.roleEpoch,
      });
    }

    this.eventBus.emit({
      type: 'game/inventoryUpdate',
      roleId: this.currentRole,
      items,
    });
  }

  /**
   * Format item ID into display name (slingshot -> Slingshot, steel_balls -> Steel Balls)
   */
  private formatItemName(itemId: string): string {
    return itemId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  dispose(): void {
    this.currentTask = null;
    this.currentStepIndex = 0;
    this.inventory.clear();

    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }

    this.lastInventorySignature = '';
  }
}
