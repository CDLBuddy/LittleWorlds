/**
 * Forest World - Cozy forest environment
 */

import { Scene } from '@babylonjs/core';
import { World } from '../WorldManager';

export class ForestWorld implements World {
  id = 'forest';
  name = 'Forest Adventure';

  async load(_scene: Scene): Promise<void> {
    console.log('Loading Forest World...');
    // TODO: Load forest assets, setup lighting, spawn points
  }

  unload(): void {
    console.log('Unloading Forest World...');
    // TODO: Cleanup forest resources
  }
}
