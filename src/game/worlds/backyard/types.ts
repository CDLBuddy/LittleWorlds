/**
 * Backyard World - Type definitions
 */

import type { AbstractMesh } from '@babylonjs/core';

export interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean; // If true, can be interacted with even without an active task
}
