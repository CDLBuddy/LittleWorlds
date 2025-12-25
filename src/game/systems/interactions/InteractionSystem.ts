/**
 * Interaction System - proximity prompts + action execution
 */

import { Vector3 } from '@babylonjs/core';
import { Interactable } from '@game/entities/props/Interactable';

export class InteractionSystem {
  private interactables: Interactable[] = [];
  private nearestInteractable: Interactable | null = null;

  registerInteractable(interactable: Interactable): void {
    this.interactables.push(interactable);
  }

  unregisterInteractable(id: string): void {
    this.interactables = this.interactables.filter((i) => i.id !== id);
  }

  update(playerPosition: Vector3, interactionRadius: number): void {
    let nearest: Interactable | null = null;
    let nearestDistance = Infinity;

    this.interactables.forEach((interactable) => {
      if (!interactable.canInteract()) return;

      const distance = Vector3.Distance(playerPosition, interactable.position);
      
      if (distance < interactionRadius && distance < nearestDistance) {
        nearest = interactable;
        nearestDistance = distance;
      }
    });

    this.nearestInteractable = nearest;
  }

  getNearestInteractable(): Interactable | null {
    return this.nearestInteractable;
  }

  interact(): boolean {
    if (this.nearestInteractable?.canInteract()) {
      this.nearestInteractable.interact();
      return true;
    }
    return false;
  }
}
