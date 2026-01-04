import { Scene, TransformNode, Color3 } from '@babylonjs/core';
import { DUSK } from '../config/constants';
import { DUSK_INTERACTABLES } from '../config/interactables';
import type { Interactable } from '../types';
import { createPillarGate } from './createPillarGate';

export function createInteractables(scene: Scene, parent: TransformNode, eventBus: any): Interactable[] {
  const interactables: Interactable[] = [];

  // North gate → Night world (moon runes)
  const nightGate = createPillarGate(
    scene,
    parent,
    DUSK_INTERACTABLES[0],
    DUSK.NORTH_GATE_POS,
    new Color3(0.75, 0.68, 0.92),
    eventBus,
    'night',
    { style: 'MOON' }
  );
  interactables.push(nightGate);

  // South gate → Pine world (earthy runes)
  const pineGate = createPillarGate(
    scene,
    parent,
    DUSK_INTERACTABLES[1],
    DUSK.SOUTH_GATE_POS,
    new Color3(0.45, 0.68, 0.35),
    eventBus,
    'pine',
    { style: 'PINE' }
  );
  interactables.push(pineGate);

  return interactables;
}
