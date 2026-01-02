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
import type { AppEvent } from '@game/shared/events';
import { saveFacade } from '../saves/saveFacade';
import type { Player } from '@game/entities/player/Player';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

export class CharacterSwitchSystem {
  private switching = false;
  private eventBusSub: (() => void) | null = null;
  private boyPlayer: Player | null = null;
  private girlPlayer: Player | null = null;

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
      // 1. Save current character's inventory
      const currentInventory = this.taskSystem.getInventory();
      console.log(`[CharacterSwitchSystem] Saving ${currentRole} inventory:`, currentInventory);
      saveFacade.syncInventory(currentRole, currentInventory);

      // 2. Load new character's inventory
      const newInventory = saveFacade.getInventory(roleId);
      console.log(`[CharacterSwitchSystem] Loading ${roleId} inventory:`, newInventory);

      // 3. Switch TaskSystem
      this.taskSystem.switchCharacter(roleId, newInventory);

      // 4. Update save metadata
      saveFacade.setLastSelectedRole(roleId);

      // 5. Swap active/inactive player entities (visual model switch)
      if (this.boyPlayer && this.girlPlayer) {
        this.boyPlayer.setActive(roleId === 'boy');
        this.girlPlayer.setActive(roleId === 'girl');
        console.log(`[CharacterSwitchSystem] Visual switch: ${roleId} is now active`);
      }

      // 6. Broadcast switch event to UI
      this.eventBus.emit({
        type: 'game/characterSwitch',
        roleId,
      });

      // 7. Show feedback toast
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
