/**
 * PineWorld - Fourth playable area (late afternoon ascent)
 * 90×160 uphill trail through pine forest
 * Late afternoon atmosphere, pine needle sounds, lantern crafting
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

export const PINE_INTERACTABLES = [
  INTERACTABLE_ID.PINE_DUSK_GATE,
  INTERACTABLE_ID.PINE_CREEK_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export function createPineWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy', fromArea?: string): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[PineWorld] Creating Pine Trails world...');

  // Apply Pine Trails sky, fog, and lighting via SkySystem
  const skySystem = new SkySystem(scene);
  void skySystem.apply('pinetrails', 0);

  // === LAYOUT: 90×160 uphill trail ===
  // Main trail ground (follows elevation)
  const trailGround = MeshBuilder.CreateGround('pine_trail', { width: 90, height: 160 }, scene);
  trailGround.position = new Vector3(0, 0, 0);
  trailGround.isPickable = true;
  trailGround.checkCollisions = false;
  trailGround.metadata = { walkable: true };
  const trailMat = new StandardMaterial('pineTrailMat', scene);
  trailMat.diffuseColor = new Color3(0.35, 0.3, 0.25); // Pine needle brown
  trailMat.specularColor = new Color3(0.1, 0.1, 0.1);
  trailGround.material = trailMat;

  // === PLAYER & COMPANION ===
  // Dynamic spawn based on entry direction
  let spawnPos: Vector3;
  if (fromArea === 'dusk') {
    // Coming from north gate (forward) - spawn near north
    spawnPos = new Vector3(0, 0.9, -50);
  } else {
    // Coming from south gate (backward) or default - spawn near south
    spawnPos = new Vector3(0, 0.9, 60);
  }
  const player = new Player(scene, spawnPos, roleId);
  const companion = new Companion(scene, new Vector3(3, 0.9, 62), eventBus);

  // === INTERACTABLES ===
  const interactables: Interactable[] = [];

  // North gate to Dusk Meadow (moved closer for testing)
  const northGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.PINE_DUSK_GATE,
    new Vector3(0, 2, -60), // Moved from -70 to -60, raised to y=2
    new Color3(2.0, 1.5, 0.2), // BRIGHT yellow/gold for testing
    eventBus,
    'dusk'
  );
  interactables.push(northGate);

  // South gate back to Creek
  const southGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.PINE_CREEK_GATE,
    new Vector3(0, 0.5, 75),
    new Color3(0.4, 0.7, 0.8), // Creek water blue
    eventBus,
    'creek'
  );
  interactables.push(southGate);

  // Dispose function
  const dispose = () => {
    trailGround.dispose();
    trailMat.dispose();
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
  const gate = MeshBuilder.CreateBox(id, { width: 15, height: 8, depth: 1 }, scene);
  gate.position = position;
  gate.isPickable = true;
  gate.checkCollisions = false;
  gate.metadata = { interactable: true, id };

  const mat = new StandardMaterial(`${id}_mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.8); // Much brighter glow
  gate.material = mat;

  return {
    id,
    mesh: gate,
    alwaysActive: true,
    interact: () => {
      console.log(`[PineWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea });
    },
    dispose: () => {
      gate.dispose();
      mat.dispose();
    },
  };
}
