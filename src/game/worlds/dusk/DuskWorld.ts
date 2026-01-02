/**
 * DuskWorld - Fifth playable area (Firefly Meadow)
 * 110×110 open meadow with golden hour lighting
 * Firefly dusk atmosphere, lantern stakes, linger mode showcase
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
import type { WorldResult } from '../types';
import { createWorldPlayers } from '../helpers';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const DUSK_INTERACTABLES = [
  INTERACTABLE_ID.DUSK_NIGHT_GATE,
  INTERACTABLE_ID.DUSK_PINE_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export function createDuskWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy', fromArea?: string): WorldResult & {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[DuskWorld] Creating Firefly Dusk Meadow...');

  // Apply Firefly Dusk sky, fog, and lighting via SkySystem
  const skySystem = new SkySystem(scene);
  void skySystem.apply('firefly', 0);

  // === LAYOUT: 110×110 open meadow ===
  const meadowGround = MeshBuilder.CreateGround('dusk_meadow', { width: 110, height: 110 }, scene);
  meadowGround.position = new Vector3(0, 0, 0);
  meadowGround.isPickable = true;
  meadowGround.checkCollisions = false;
  meadowGround.metadata = { walkable: true };
  const meadowMat = new StandardMaterial('duskMeadowMat', scene);
  meadowMat.diffuseColor = new Color3(0.5, 0.6, 0.35); // Warm grass
  meadowMat.specularColor = new Color3(0.2, 0.2, 0.1);
  meadowGround.material = meadowMat;

  // Determine spawn based on where player is coming from
  // Default: south entry from Pine
  // Dynamic spawn based on entry direction
  let spawnPos: Vector3;
  if (fromArea === 'night') {
    // Coming from north gate (forward) - spawn near north
    spawnPos = new Vector3(0, 0.9, -40);
  } else {
    // Coming from south gate (backward) or default - spawn near south
    spawnPos = new Vector3(0, 0.9, 42);
  }
  
  // Create BOTH players using shared helper
  const { boyPlayer, girlPlayer, activePlayer } = createWorldPlayers(scene, spawnPos, roleId);
  const player = activePlayer.mesh;
  const playerEntity = activePlayer;
  
  const companion = new Companion(scene, new Vector3(3, 0.9, 44), eventBus);

  // === INTERACTABLES ===
  const interactables: Interactable[] = [];

  // North gate to Night Stars
  const northGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.DUSK_NIGHT_GATE,
    new Vector3(0, 0, -50),
    new Color3(0.7, 0.6, 0.4),
    eventBus,
    'night'
  );
  interactables.push(northGate);

  // South gate back to Pine
  const southGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.DUSK_PINE_GATE,
    new Vector3(0, 0, 52),
    new Color3(0.6, 0.5, 0.3), // Pine brown
    eventBus,
    'pine'
  );
  interactables.push(southGate);

  // Dispose function
  const dispose = () => {
    meadowGround.dispose();
    meadowMat.dispose();
    skySystem.dispose();
    boyPlayer.dispose();
    girlPlayer.dispose();
    companion.dispose();
    interactables.forEach(i => i.dispose());
  };

  // Track current active role
  let currentActiveRole: RoleId = roleId;

  return {
    // WorldResult contract implementation
    getActivePlayer: () => {
      return currentActiveRole === 'boy' ? boyPlayer : girlPlayer;
    },
    getActiveMesh: () => {
      return (currentActiveRole === 'boy' ? boyPlayer : girlPlayer).mesh;
    },
    setActiveRole: (newRoleId: RoleId) => {
      currentActiveRole = newRoleId;
      boyPlayer.setActive(newRoleId === 'boy');
      girlPlayer.setActive(newRoleId === 'girl');
    },
    boyPlayer,
    girlPlayer,
    
    // Legacy fields for backward compatibility
    player,
    playerEntity,
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
  mat.emissiveColor = color.scale(0.2);
  gate.material = mat;

  return {
    id,
    mesh: gate,
    alwaysActive: true,
    interact: () => {
      console.log(`[DuskWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea });
    },
    dispose: () => {
      gate.dispose();
      mat.dispose();
    },
  };
}
