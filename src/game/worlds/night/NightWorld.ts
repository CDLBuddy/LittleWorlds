/**
 * NightWorld - Sixth playable area (Night Stars)
 * 120×100 night clearing with stargazing
 * Deep night atmosphere, constellation navigation, lantern light
 */

import {
  Scene,
  Color3,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
  TransformNode,
} from '@babylonjs/core';
import { Player } from '@game/entities/player/Player';
import { Companion } from '@game/entities/companion/Companion';
import { SkySystem } from '@game/systems/sky/SkySystem';
import type { RoleId } from '@game/content/areas';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const NIGHT_INTERACTABLES = [
  INTERACTABLE_ID.NIGHT_BEACH_GATE,
  INTERACTABLE_ID.NIGHT_DUSK_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export function createNightWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy', fromArea?: string): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[NightWorld] Creating Night Stars world, from:', fromArea || 'unknown');

  // Apply Night Stars sky, fog, and lighting via SkySystem
  const skySystem = new SkySystem(scene);
  void skySystem.apply('nightstars', 0);

  // === LAYOUT: 120×100 night clearing ===
  const clearingGround = MeshBuilder.CreateGround('night_clearing', { width: 120, height: 100 }, scene);
  clearingGround.position = new Vector3(0, 0, 0);
  clearingGround.isPickable = true;
  clearingGround.checkCollisions = false;
  clearingGround.metadata = { walkable: true };
  const clearingMat = new StandardMaterial('nightClearingMat', scene);
  clearingMat.diffuseColor = new Color3(0.15, 0.2, 0.15); // Dark grass
  clearingMat.specularColor = new Color3(0.1, 0.1, 0.15);
  clearingMat.emissiveColor = new Color3(0.05, 0.08, 0.12); // Slight glow
  clearingGround.material = clearingMat;

  // === PLAYER & COMPANION ===
  // Spawn based on which area we came from
  let spawnPos: Vector3;
  if (fromArea === 'beach') {
    // Coming from Beach (north gate) - spawn near north
    spawnPos = new Vector3(0, 0.9, -35);
  } else {
    // Coming from Dusk (south gate) or default - spawn near south
    spawnPos = new Vector3(0, 0.9, 37);
  }
  const player = new Player(scene, spawnPos, roleId);
  const companion = new Companion(scene, spawnPos.clone().add(new Vector3(3, 0, 2)), eventBus);

  // === INTERACTABLES ===
  const interactables: Interactable[] = [];

  // North gate to Beach
  const northGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.NIGHT_BEACH_GATE,
    new Vector3(0, 0, -45),
    new Color3(0.4, 0.45, 0.6),
    eventBus,
    'beach'
  );
  interactables.push(northGate);

  // South gate back to Dusk
  const southGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.NIGHT_DUSK_GATE,
    new Vector3(0, 0, 47),
    new Color3(0.95, 0.7, 0.5), // Golden dusk
    eventBus,
    'dusk'
  );
  interactables.push(southGate);

  // Dispose function
  const dispose = () => {
    clearingGround.dispose();
    clearingMat.dispose();
    skySystem.dispose();
    player.dispose();
    companion.dispose();
    interactables.forEach(i => i.dispose());
  };

  return {
    player: player.mesh,
    playerEntity: player,
    companion,
    interactables,
    dispose,
  };
}

// === HELPER: Gate Interactable ===
function createGateInteractable(
  scene: Scene,
  id: InteractableId,
  position: Vector3,
  color: Color3,
  eventBus: any,
  targetArea: string
): Interactable {
  const gate = MeshBuilder.CreateBox(id, { width: 8, height: 3, depth: 0.5 }, scene);
  gate.position = position;
  gate.isPickable = true;
  gate.checkCollisions = false;
  gate.metadata = { interactable: true, id };

  const mat = new StandardMaterial(`${id}_mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.3); // Brighter glow for night
  gate.material = mat;

  return {
    id,
    mesh: gate,
    alwaysActive: true,
    interact: () => {
      console.log(`[NightWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea });
    },
    dispose: () => {
      gate.dispose();
      mat.dispose();
    },
  };
}
