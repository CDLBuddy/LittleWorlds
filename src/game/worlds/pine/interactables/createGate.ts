/**
 * Pine World - Gate interactable
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, type Vector3 } from '@babylonjs/core';
import type { InteractableId } from '@game/content/interactableIds';
import type { Interactable } from '../types';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createGateInteractable(
  scene: Scene,
  id: InteractableId,
  position: Vector3,
  color: Color3,
  eventBus: { emit: (event: { type: string; areaId: string; fromGateId?: string }) => void },
  targetArea: string,
  bag: DisposableBag,
  mats: MaterialCache
): Interactable {
  const gate = bag.trackMesh(MeshBuilder.CreateBox(id, { width: 15, height: 8, depth: 1 }, scene));
  gate.position = position;
  gate.isPickable = true;
  gate.checkCollisions = false;
  gate.metadata = { interactable: true, id };

  const mat = mats.get(`${id}_mat`, () => {
    const m = new StandardMaterial(`${id}_mat`, scene);
    m.diffuseColor = color;
    m.emissiveColor = color.scale(0.6);
    m.specularColor = Color3.Black();
    return m;
  });

  gate.material = mat;

  return {
    id,
    mesh: gate,
    alwaysActive: true,
    interact: () => {
      console.log(`[PineWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea, fromGateId: id });
    },
    dispose: () => gate.dispose(), // material is cached + disposed by bag
  };
}
