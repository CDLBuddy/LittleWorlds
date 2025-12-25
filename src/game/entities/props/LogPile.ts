/**
 * Log pile interactable
 */

import { Vector3 } from '@babylonjs/core';
import { BaseInteractable } from './Interactable';

export class LogPile extends BaseInteractable {
  private logsRemaining = 5;

  constructor(id: string, position: Vector3) {
    super(id, 'logs', position);
  }

  interact(): void {
    if (this.logsRemaining > 0) {
      this.logsRemaining--;
      console.log(`Collected log. ${this.logsRemaining} remaining.`);
      // TODO: Add log to inventory
      
      if (this.logsRemaining === 0) {
        this.enabled = false;
      }
    }
  }

  getPromptText(): string {
    return `Collect Log (${this.logsRemaining})`;
  }

  canInteract(): boolean {
    return this.enabled && this.logsRemaining > 0;
  }
}
