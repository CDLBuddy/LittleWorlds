/**
 * Campfire interactable
 */

import { Vector3 } from '@babylonjs/core';
import { BaseInteractable } from './Interactable';

export class Campfire extends BaseInteractable {
  private isLit = false;

  constructor(id: string, position: Vector3) {
    super(id, 'campfire', position);
  }

  interact(): void {
    this.isLit = !this.isLit;
    console.log(`Campfire ${this.isLit ? 'lit' : 'extinguished'}`);
    // TODO: Trigger fire particles, sound
  }

  getPromptText(): string {
    return this.isLit ? 'Extinguish Fire' : 'Light Fire';
  }

  isFireLit(): boolean {
    return this.isLit;
  }
}
