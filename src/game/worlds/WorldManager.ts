/**
 * WorldManager - Handles world switching and loading screens
 */

import { Scene } from '@babylonjs/core';

export interface World {
  id: string;
  name: string;
  load(scene: Scene): Promise<void>;
  unload(): void;
}

export class WorldManager {
  private currentWorld: World | null = null;
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async loadWorld(world: World): Promise<void> {
    // Unload current world
    if (this.currentWorld) {
      this.currentWorld.unload();
    }

    // Load new world
    await world.load(this.scene);
    this.currentWorld = world;
  }

  getCurrentWorld(): World | null {
    return this.currentWorld;
  }

  dispose(): void {
    if (this.currentWorld) {
      this.currentWorld.unload();
      this.currentWorld = null;
    }
  }
}
