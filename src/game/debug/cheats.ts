/**
 * Debug cheats - teleport, complete task, spawn prop
 */

export interface CheatCommand {
  name: string;
  description: string;
  execute: (...args: any[]) => void;
}

export class CheatSystem {
  private commands = new Map<string, CheatCommand>();

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
}

// Default cheats
export function createDefaultCheats(): CheatCommand[] {
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
      name: 'givitem',
      description: 'Give an item to inventory',
      execute: (itemId: string) => {
        console.log(`Giving item: ${itemId}`);
        // TODO: Implement give item
      },
    },
  ];
}
