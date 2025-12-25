/**
 * Beach World - Future scenario
 */

import { Scene } from '@babylonjs/core';
import { World } from '../WorldManager';

export class BeachWorld implements World {
  id = 'beach';
  name = 'Beach Adventure';

  async load(_scene: Scene): Promise<void> {
    console.log('Loading Beach World...');
    // TODO: Load beach assets
  }

  unload(): void {
    console.log('Unloading Beach World...');
    // TODO: Cleanup beach resources
  }
}
