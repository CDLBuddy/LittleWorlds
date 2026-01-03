/**
 * Pine World - Type definitions
 */

import type { AbstractMesh } from '@babylonjs/core';

export interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}
