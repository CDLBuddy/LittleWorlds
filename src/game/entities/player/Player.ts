/**
 * Player entity - main character
 */

import { Scene, Mesh, Vector3 } from '@babylonjs/core';

export class Player {
  private mesh: Mesh | null = null;
  position: Vector3;

  constructor(_scene: Scene, position: Vector3) {
    this.position = position;
  }

  async load(): Promise<void> {
    // TODO: Load player model
    console.log('Loading player...');
  }

  update(_deltaTime: number): void {
    // TODO: Update player logic
  }

  dispose(): void {
    this.mesh?.dispose();
  }
}
