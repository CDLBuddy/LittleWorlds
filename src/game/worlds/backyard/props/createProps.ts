/**
 * Backyard World - Props orchestrator
 * Coordinates all decorative props (tire swing, sandbox, garden, fence)
 */

import type { Scene } from '@babylonjs/core';
import { createTireSwing } from './tireSwing';
import { createSandbox } from './sandbox';
import { createGarden } from './garden';
import { createFence } from './fence';

export function createProps(scene: Scene) {
  const tireSwing = createTireSwing(scene);
  const sandbox = createSandbox(scene);
  const garden = createGarden(scene);
  const fence = createFence(scene);

  return {
    tireSwing,
    sandbox,
    garden,
    fence,
  };
}
