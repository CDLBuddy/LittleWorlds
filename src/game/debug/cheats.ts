/**
 * Debug cheats - teleport, complete task, spawn prop, give item, collections
 */

import type { TaskSystem } from '../systems/tasks/TaskSystem';
import { saveFacade } from '../systems/saves/saveFacade';
import { COLLECTIONS } from '../content/collections';

export interface CheatCommand {
  name: string;
  description: string;
  execute: (...args: any[]) => void;
}

export class CheatSystem {
  private commands = new Map<string, CheatCommand>();
  private taskSystem: TaskSystem | null = null;

  setTaskSystem(taskSystem: TaskSystem): void {
    this.taskSystem = taskSystem;
  }

  registerCheat(cheat: CheatCommand): void {
    this.commands.set(cheat.name.toLowerCase(), cheat);
  }

  executeCheat(name: string, ...args: any[]): boolean {
    const cheat = this.commands.get(name.toLowerCase());
    if (!cheat) {
      console.warn(`Unknown cheat: ${name}`);
      return false;
    }

    console.log(`Executing cheat: ${name}`);
    cheat.execute(...args);
    return true;
  }

  listCheats(): CheatCommand[] {
    return Array.from(this.commands.values());
  }

  // Public API for direct access
  giveItem(itemId: string): void {
    if (!this.taskSystem) {
      console.error('[Cheats] TaskSystem not set');
      return;
    }
    this.taskSystem.addItem(itemId);
    console.log(`[Cheats] ✓ Gave item: ${itemId}`);
  }

  // Collections cheats
  giveFind(areaId: string, findId: string): void {
    const area = COLLECTIONS[areaId];
    if (!area) {
      console.error(`[Cheats] Unknown area: ${areaId}`);
      return;
    }
    
    const find = area.finds.find(f => f.id === findId);
    if (!find) {
      console.error(`[Cheats] Unknown find: ${findId} in ${areaId}`);
      return;
    }

    const shared = saveFacade.getShared();
    const currentFinds = shared.findsByArea[areaId] || [];
    
    if (currentFinds.includes(findId)) {
      console.warn(`[Cheats] Already have: ${findId}`);
      return;
    }

    saveFacade.setShared({
      findsByArea: {
        ...shared.findsByArea,
        [areaId]: [...currentFinds, findId],
      },
    });

    console.log(`[Cheats] ✓ Found: ${find.name} (${findId})`);
  }

  setFindCount(areaId: string, count: number): void {
    const area = COLLECTIONS[areaId];
    if (!area) {
      console.error(`[Cheats] Unknown area: ${areaId}`);
      return;
    }

    const maxCount = Math.min(count, area.finds.length);
    const findIds = area.finds.slice(0, maxCount).map(f => f.id);
    
    const shared = saveFacade.getShared();
    saveFacade.setShared({
      findsByArea: {
        ...shared.findsByArea,
        [areaId]: findIds,
      },
    });

    console.log(`[Cheats] ✓ Set ${areaId} finds to ${maxCount}/${area.finds.length}`);
  }

  unlockPostcard(areaId: string): void {
    const area = COLLECTIONS[areaId];
    if (!area) {
      console.error(`[Cheats] Unknown area: ${areaId}`);
      return;
    }

    const shared = saveFacade.getShared();
    saveFacade.setShared({
      postcardsByArea: {
        ...shared.postcardsByArea,
        [areaId]: true,
      },
      audioByArea: {
        ...shared.audioByArea,
        [areaId]: true,
      },
    });

    console.log(`[Cheats] ✓ Unlocked postcard + audio: ${area.postcard.name}`);
  }

  unlockTrophy(areaId: string): void {
    const area = COLLECTIONS[areaId];
    if (!area) {
      console.error(`[Cheats] Unknown area: ${areaId}`);
      return;
    }

    const shared = saveFacade.getShared();
    saveFacade.setShared({
      trophiesByArea: {
        ...shared.trophiesByArea,
        [areaId]: true,
      },
    });

    console.log(`[Cheats] ✓ Unlocked trophy: ${area.trophy.name}`);
  }
}

// Default cheats
export function createDefaultCheats(cheatSystem: CheatSystem): CheatCommand[] {
  return [
    {
      name: 'teleport',
      description: 'Teleport to coordinates (x, y, z)',
      execute: (x: number, y: number, z: number) => {
        console.log(`Teleporting to ${x}, ${y}, ${z}`);
        // TODO: Implement teleport
      },
    },
    {
      name: 'completetask',
      description: 'Complete a task by ID',
      execute: (taskId: string) => {
        console.log(`Completing task: ${taskId}`);
        // TODO: Implement task completion
      },
    },
    {
      name: 'spawn',
      description: 'Spawn a prop at position',
      execute: (propType: string, x: number, y: number, z: number) => {
        console.log(`Spawning ${propType} at ${x}, ${y}, ${z}`);
        // TODO: Implement spawn
      },
    },
    {
      name: 'giveitem',
      description: 'Give an item to inventory (usage: giveitem <itemId>)',
      execute: (itemId: string) => {
        if (!itemId) {
          console.error('[giveitem] Usage: giveitem <itemId>');
          return;
        }
        cheatSystem.giveItem(itemId);
      },
    },
    {
      name: 'givefind',
      description: 'Give a find (usage: givefind <areaId> <findId>)',
      execute: (areaId: string, findId: string) => {
        if (!areaId || !findId) {
          console.error('[givefind] Usage: givefind <areaId> <findId>');
          return;
        }
        cheatSystem.giveFind(areaId, findId);
      },
    },
    {
      name: 'setfindcount',
      description: 'Set find count for area (usage: setfindcount <areaId> <count>)',
      execute: (areaId: string, count: string) => {
        if (!areaId || !count) {
          console.error('[setfindcount] Usage: setfindcount <areaId> <count>');
          return;
        }
        cheatSystem.setFindCount(areaId, parseInt(count, 10));
      },
    },
    {
      name: 'unlockpostcard',
      description: 'Unlock postcard for area (usage: unlockpostcard <areaId>)',
      execute: (areaId: string) => {
        if (!areaId) {
          console.error('[unlockpostcard] Usage: unlockpostcard <areaId>');
          return;
        }
        cheatSystem.unlockPostcard(areaId);
      },
    },
    {
      name: 'unlocktrophy',
      description: 'Unlock trophy for area (usage: unlocktrophy <areaId>)',
      execute: (areaId: string) => {
        if (!areaId) {
          console.error('[unlocktrophy] Usage: unlocktrophy <areaId>');
          return;
        }
        cheatSystem.unlockTrophy(areaId);
      },
    },
  ];
}
