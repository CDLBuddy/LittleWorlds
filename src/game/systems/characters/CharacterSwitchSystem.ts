/** src/game/systems/characters/CharacterSwitchSystem.ts
 * Character Switch System - Orchestrates character role switching
 *
 * Robustness upgrades:
 * - Transaction cleanup is guaranteed (autosave resume + switchContext.end) even on failure.
 * - Single atomic save write for switch metadata (inventory + lastSelectedRole).
 * - Clones inventories before passing to TaskSystem (avoids alias/reference surprises).
 * - DEV diagnostics include per-role completedTasks counts to pinpoint the “tasks already complete” bug.
 */

import type { TaskSystem } from '../tasks/TaskSystem';
import type { ProgressionSystem } from '../progression/ProgressionSystem';
import type { InteractionSystem } from '../interactions/InteractionSystem';
import type { AutosaveSystem } from '../autosave/AutosaveSystem';
import type { AppEvent } from '@game/shared/events';
import { saveFacade } from '../saves/saveFacade';
import type { Player } from '@game/entities/player/Player';
import type { WorldResult } from '@game/worlds/types';
import { assertSwitchInvariant } from './assertSwitchInvariant';
import { switchContext } from './SwitchContext';

type RoleId = 'boy' | 'girl';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

export class CharacterSwitchSystem {
  private switching = false;
  private eventBusSub: (() => void) | null = null;

  private boyPlayer: Player | null = null;
  private girlPlayer: Player | null = null;

  private world: WorldResult | null = null;
  private progressionSystem: ProgressionSystem | null = null;
  private interactionSystem: InteractionSystem | null = null;
  private autosaveSystem: AutosaveSystem | null = null;

  constructor(
    private eventBus: EventBus,
    private taskSystem: TaskSystem
  ) {
    this.eventBusSub = this.eventBus.on((evt) => {
      if (evt.type === 'ui/switchCharacter') {
        this.switchTo(evt.roleId);
      }
    });
  }

  setPlayers(boyPlayer: Player, girlPlayer: Player): void {
    this.boyPlayer = boyPlayer;
    this.girlPlayer = girlPlayer;
  }

  setWorld(world: WorldResult): void {
    this.world = world;
  }

  setProgressionSystem(progressionSystem: ProgressionSystem): void {
    this.progressionSystem = progressionSystem;
  }

  setInteractionSystem(interactionSystem: InteractionSystem): void {
    this.interactionSystem = interactionSystem;
  }

  setAutosaveSystem(autosaveSystem: AutosaveSystem): void {
    this.autosaveSystem = autosaveSystem;
  }

  private switchTo(roleId: RoleId): void {
    if (this.switching) {
      console.warn('[CharacterSwitchSystem] Switch already in progress');
      return;
    }

    const currentRole = this.taskSystem.getCurrentRole();

    if (currentRole === roleId) {
      if (import.meta.env.DEV) {
        console.log(`[CharacterSwitchSystem] Already playing as ${roleId}`);
      }
      return;
    }

    // ===BEGIN TRANSACTION===
    const switchId = switchContext.begin();
    this.switching = true;

    let autosaveWasPaused = false;
    let autosaveWasCancelled = false;
    let switchEnded = false;

    const safeEnd = () => {
      if (switchEnded) return;
      switchEnded = true;
      switchContext.end();
    };

    const trace = (level: 'info' | 'warn' | 'error', msg: string, data?: any) => {
      if (!import.meta.env.DEV) return;
      const t = (window as any).__trace;
      if (!t) return;
      t[level]('switch', msg, data);
    };

    if (import.meta.env.DEV) {
      console.log(`[Switch#${switchId}] 🔄 BEGIN TRANSACTION: ${currentRole} → ${roleId}`);
      trace('info', `Switch#${switchId} START: ${currentRole} → ${roleId}`, {
        switchId,
        from: currentRole,
        to: roleId,
      });
    }

    try {
      // ===STEP 0: PAUSE / CLEAR RISKY STATE===
      if (import.meta.env.DEV) console.log(`[Switch#${switchId}] Step 0: Pausing systems`);

      if (this.autosaveSystem) {
        this.autosaveSystem.cancelPending();
        autosaveWasCancelled = true;
        this.autosaveSystem.pause();
        autosaveWasPaused = true;
      }

      if (this.interactionSystem) {
        this.interactionSystem.clearDwell();
      }

      // ===STEP 1-2-4: ATOMIC SAVE UPDATE (inventory + lastSelectedRole)===
      // Avoid multiple load/write cycles mid-switch.
      const currentInventory = this.taskSystem.getInventory();

      if (import.meta.env.DEV) {
        console.log(`[Switch#${switchId}] Step 1: Saving ${currentRole} inventory:`, currentInventory);
      }

      const save = saveFacade.loadMain();

      // Defensive: ensure role containers exist (old saves / bad migrations)
      if (!save.roles) {
        throw new Error('SaveData.roles missing');
      }
      if (!save.roles[currentRole] || !save.roles[roleId]) {
        throw new Error(`SaveData.roles missing role(s): ${currentRole} or ${roleId}`);
      }

      // Persist current role inventory + lastSelectedRole in one write.
      save.roles[currentRole].inventory = [...currentInventory];
      save.lastSelectedRole = roleId;

      // Commit
      saveFacade.writeMain(save);

      // Load new role inventory from the now-canonical save snapshot.
      const newInventory = [...(save.roles[roleId].inventory ?? [])];

      if (import.meta.env.DEV) {
        console.log(`[Switch#${switchId}] Step 2: Loading ${roleId} inventory:`, newInventory);

        // Diagnostics that will immediately reveal “shared arrays” or “wrong-role completion”
        const boyDone = save.roles.boy?.completedTasks?.length ?? 0;
        const girlDone = save.roles.girl?.completedTasks?.length ?? 0;
        console.log(`[Switch#${switchId}] DEV: completedTasks counts`, { boy: boyDone, girl: girlDone, last: save.lastSelectedRole });

        const sameTasksRef =
          (save.roles.boy?.completedTasks as any) &&
          (save.roles.boy.completedTasks as any) === (save.roles.girl?.completedTasks as any);

        if (sameTasksRef) {
          console.warn(
            `[Switch#${switchId}] ⚠️ Save corruption: boy.completedTasks and girl.completedTasks are the SAME array reference. This is the v2 migration aliasing bug.`
          );
        }
      }

      // ===STEP 3: SWITCH TASKSYSTEM===
      if (import.meta.env.DEV) {
        console.log(`[Switch#${switchId}] Step 3: Switching TaskSystem to ${roleId}`);
      }
      this.taskSystem.switchCharacter(roleId, newInventory);

      // ===STEP 5: WORLD VISUALS ACTIVE ROLE===
      if (this.world) {
        if (import.meta.env.DEV) {
          console.log(`[Switch#${switchId}] Step 5: Setting world active role to ${roleId}`);
        }
        this.world.setActiveRole(roleId);

        if (this.boyPlayer && this.girlPlayer) {
          assertSwitchInvariant(
            this.boyPlayer,
            this.girlPlayer,
            roleId,
            `Switch#${switchId} After world.setActiveRole()`
          );
        }
      }

      // ===STEP 6: PROGRESSION ROLE/TASK RELOAD===
      if (this.progressionSystem) {
        if (import.meta.env.DEV) {
          console.log(`[Switch#${switchId}] Step 6: Reloading ProgressionSystem tasks for ${roleId}`);
        }
        this.progressionSystem.switchRole(roleId);
      }

      // ===STEP 6.5: CLEAR INTERACTION AGAIN (post-task swap)===
      if (this.interactionSystem) {
        if (import.meta.env.DEV) console.log(`[Switch#${switchId}] Step 6.5: Clearing interaction state`);
        this.interactionSystem.clearDwell();
      }

      // ===STEP 6.6: AUTOSAVE ROLE UPDATE===
      if (this.autosaveSystem) {
        if (import.meta.env.DEV) {
          console.log(`[Switch#${switchId}] Step 6.6: Updating AutosaveSystem role to ${roleId}`);
        }
        this.autosaveSystem.setRole(roleId);
      }

      // ===STEP 7: INVARIANT CHECK===
      if (this.boyPlayer && this.girlPlayer) {
        assertSwitchInvariant(
          this.boyPlayer,
          this.girlPlayer,
          roleId,
          `Switch#${switchId} After complete switch`
        );
      }

      // ===STEP 8: BROADCAST SWITCH EVENT===
      if (import.meta.env.DEV) console.log(`[Switch#${switchId}] Step 8: Broadcasting game/characterSwitch event`);
      this.eventBus.emit({ type: 'game/characterSwitch', roleId });

      // ===STEP 9: FEEDBACK TOAST===
      this.eventBus.emit({
        type: 'ui/toast',
        level: 'info',
        message: `Now playing as ${roleId === 'boy' ? 'Boy' : 'Girl'}`,
      });

      // ===STEP 10: RESUME SYSTEMS + SNAP SAVE===
      if (import.meta.env.DEV) console.log(`[Switch#${switchId}] Step 10: Resuming systems...`);
      if (this.autosaveSystem) {
        this.autosaveSystem.resume();
        this.autosaveSystem.forceSave();
      }

      if (import.meta.env.DEV) {
        console.log(`[Switch#${switchId}] ✅ Successfully completed switch to ${roleId}`);
        trace('info', `Switch#${switchId} COMPLETE: ${currentRole} → ${roleId}`, {
          switchId,
          from: currentRole,
          to: roleId,
        });
      }

      safeEnd();
    } catch (error) {
      console.error(`[Switch#${switchId}] ❌ Switch failed:`, error);
      trace('error', `Switch#${switchId} FAILED`, { switchId, error: String(error) });

      this.eventBus.emit({
        type: 'ui/toast',
        level: 'error',
        message: 'Failed to switch character',
      });

      safeEnd();
    } finally {
      // Hard guarantee: never leave autosave paused because a switch exploded.
      if (this.autosaveSystem && autosaveWasPaused) {
        try {
          this.autosaveSystem.resume();
          // If we cancelled pending autosave, snap-save so we don't lose the last stable state.
          if (autosaveWasCancelled) this.autosaveSystem.forceSave();
        } catch (e) {
          console.warn(`[Switch#${switchId}] Failed to resume autosave in finally:`, e);
        }
      }

      // Hard guarantee: never leave switchContext hanging.
      safeEnd();

      this.switching = false;
    }
  }

  dispose(): void {
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }
  }
}
