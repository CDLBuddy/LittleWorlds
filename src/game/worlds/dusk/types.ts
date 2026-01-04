import type { AbstractMesh } from '@babylonjs/core';

export type InteractableId = string;

export interface Interactable {
  id: InteractableId;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export type FireflyPattern = 'CONSTELLATION' | 'RIVER' | 'PULSE' | 'SPIRAL';

export type FireflyAgent = {
  mesh: AbstractMesh;
  pattern: FireflyPattern;
  phase: number;
  seed: number;
  baseScale: number;
  // Pattern state
  t: number;
  idx: number;
  angle: number;
};
