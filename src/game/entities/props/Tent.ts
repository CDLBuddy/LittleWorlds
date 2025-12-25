/**
 * Tent interactable
 */

import { Vector3 } from '@babylonjs/core';
import { BaseInteractable } from './Interactable';

export class Tent extends BaseInteractable {
  constructor(id: string, position: Vector3) {
    super(id, 'tent', position);
  }

  interact(): void {
    console.log('Entering tent...');
    // TODO: Trigger tent interior, rest, save
  }

  getPromptText(): string {
    return 'Enter Tent';
  }
}
