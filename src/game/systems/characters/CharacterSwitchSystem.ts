/**
 * Character Switch System - Orchestrates character role switching
 * 
 * Coordinates:
 * - Saving current role inventory
 * - Loading new role inventory
 * - Switching TaskSystem
 * - Updating save metadata
 * - Broadcasting switch events
 * - Swapping active/inactive player entities (visual model switch)
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
    // Listen for switch requests
    this.eventBusSub = this.eventBus.on((evt) => {
      if (evt.type === 'ui/switchCharacter') {
        this.switchTo(evt.roleId);
      }
    });
  }

  /**
   * Set player references for visual switching
   */
  setPlayers(boyPlayer: Player, girlPlayer: Player): void {
    this.boyPlayer = boyPlayer;
    this.girlPlayer = girlPlayer;
  }

  /**
   * Set world reference for active role updates
   */
  setWorld(world: WorldResult): void {
    this.world = world;
  }

  /**
   * Set progression system reference for task switching
   */
  setProgressionSystem(progressionSystem: ProgressionSystem): void {
    this.progressionSystem = progressionSystem;
  }

  /**
   * Set interaction system reference for clearing dwell state
   */
  setInteractionSystem(interactionSystem: InteractionSystem): void {
    this.interactionSystem = interactionSystem;
  }

  /**
   * Set autosave system reference for updating role
   */
  setAutosaveSystem(autosaveSystem: AutosaveSystem): void {
    this.autosaveSystem = autosaveSystem;
  }

  /**
   * Switch to a different character role
   */
  private switchTo(roleId: 'boy' | 'girl'): void {
    // Prevent rapid switching
    if (this.switching) {
      console.warn('[CharacterSwitchSystem] Switch already in progress');
      return;
    }

    const currentRole: 'boy' | 'girl' = this.taskSystem.getCurrentRole();
    
    // Don't switch if already on this role
    if (currentRole === roleId) {
      console.log(`[CharacterSwitchSystem] Already playing as ${roleId}`);
      return;
    }

    this.switching = true;

    try {
      // ===CANONICAL SWITCH ORDER (DO NOT REORDER)===
      // This order prevents desync bugs between inventory/tasks/visuals
      
      // 1. Save current character's inventory
      const currentInventory = this.taskSystem.getInventory();
      console.log(`[CharacterSwitchSystem] Saving ${currentRole} inventory:`, currentInventory);
      saveFacade.syncInventory(currentRole, currentInventory);

      // 2. Load new character's inventory
      const newInventory = saveFacade.getInventory(roleId);
      console.log(`[CharacterSwitchSystem] Loading ${roleId} inventory:`, newInventory);

      // 3. Switch TaskSystem
      this.taskSystem.switchCharacter(roleId, newInventory);

      // 4. Update save metadata (for area transitions)
      saveFacade.setLastSelectedRole(roleId);

      // 5. Update world's active role (calls player.setActive internally)
      if (this.world) {
        this.world.setActiveRole(roleId);
        console.log(`[CharacterSwitchSystem] World updated to active role: ${roleId}`);
        
        // Assert invariants after player state change
        if (this.boyPlayer && this.girlPlayer) {
          assertSwitchInvariant(this.boyPlayer, this.girlPlayer, roleId, 'After world.setActiveRole()');
        }
      }

      // 6. Reload tasks for new role (ProgressionSystem)
      if (this.progressionSystem) {
        // ProgressionSystem will reload tasks for the new role
        this.progressionSystem.switchRole(roleId);
        console.log(`[CharacterSwitchSystem] ProgressionSystem updated to ${roleId} tasks`);
      }

      // 6.5. Clear interaction state so new task prompts work
      if (this.interactionSystem) {
        // This clears dwellTarget, dwellTime, and lastPromptId
        // so the new character's task interactions work properly
        this.interactionSystem.clearDwell();
        console.log(`[CharacterSwitchSystem] Cleared interaction state for ${roleId}`);
      }

      // 6.6. Update autosave system role to prevent inventory merging
      if (this.autosaveSystem) {
        this.autosaveSystem.setRole(roleId);
        console.log(`[CharacterSwitchSystem] Updated AutosaveSystem role to ${roleId}`);
      }

      // 7. Final invariant check after all systems updated
      if (this.boyPlayer && this.girlPlayer) {
        assertSwitchInvariant(this.boyPlayer, this.girlPlayer, roleId, 'After complete switch');
      }

      // 8. Broadcast switch event to UI
      this.eventBus.emit({
        type: 'game/characterSwitch',
        roleId,
      });

      // 9. Show feedback toast
      const message = `Now playing as ${roleId === 'boy' ? 'Boy' : 'Girl'}`;
      this.eventBus.emit({
        type: 'ui/toast',
        level: 'info',
        message,
      });

      console.log(`[CharacterSwitchSystem] Successfully switched to ${roleId}`);
    } catch (error) {
      console.error('[CharacterSwitchSystem] Switch failed:', error);
      this.eventBus.emit({
        type: 'ui/toast',
        level: 'error',
        message: 'Failed to switch character',
      });
    } finally {
      this.switching = false;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }
  }
}
