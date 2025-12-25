/**
 * Base interactable interface
 */

import { Vector3 } from '@babylonjs/core';

export interface Interactable {
  id: string;
  type: string;
  position: Vector3;
  canInteract(): boolean;
  interact(): void;
  getPromptText(): string;
}

export abstract class BaseInteractable implements Interactable {
  id: string;
  type: string;
  position: Vector3;
  protected enabled = true;

  constructor(id: string, type: string, position: Vector3) {
    this.id = id;
    this.type = type;
    this.position = position;
  }

  canInteract(): boolean {
    return this.enabled;
  }

  abstract interact(): void;
  abstract getPromptText(): string;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
