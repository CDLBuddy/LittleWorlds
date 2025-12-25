/**
 * Companion entity - dog/cat guide
 */

import { Scene, Vector3 } from '@babylonjs/core';

export type CompanionType = 'dog' | 'cat';

export class Companion {
  private type: CompanionType;
  position: Vector3;

  constructor(_scene: Scene, type: CompanionType, position: Vector3) {
    this.type = type;
    this.position = position;
  }

  async load(): Promise<void> {
    console.log(`Loading ${this.type} companion...`);
    // TODO: Load companion model
  }

  update(_deltaTime: number, _playerPosition: Vector3): void {
    // TODO: Update companion AI
  }

  dispose(): void {
    // TODO: Cleanup
  }
}
