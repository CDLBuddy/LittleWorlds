/**
 * Axe interactable
 */

import { Vector3 } from '@babylonjs/core';
import { BaseInteractable } from './Interactable';

export class Axe extends BaseInteractable {
  private pickedUp = false;

  constructor(id: string, position: Vector3) {
    super(id, 'axe', position);
  }

  interact(): void {
    if (!this.pickedUp) {
      this.pickedUp = true;
      this.enabled = false;
      console.log('Picked up axe');
      // TODO: Add to inventory, hide mesh
    }
  }

  getPromptText(): string {
    return 'Pick Up Axe';
  }

  isPickedUp(): boolean {
    return this.pickedUp;
  }
}
