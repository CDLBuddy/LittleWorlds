/**
 * BeachWorld - Seventh and final playable area
 * 140×80 shoreline with ocean vista
 * Moonlit/dawn atmosphere, journey's end, reflection
 */

import {
  Scene,
  Color3,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
} from '@babylonjs/core';
import { Companion } from '@game/entities/companion/Companion';
import { SkySystem } from '@game/systems/sky/SkySystem';
import type { RoleId } from '@game/content/areas';
import type { WorldResult } from '../types';
import { createWorldPlayers } from '../helpers';
import { consumePendingSpawn } from '../spawnState';
import { getSpawnForWorld } from '../spawnRegistry';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const BEACH_INTERACTABLES = [
  INTERACTABLE_ID.BEACH_CAMPFIRE,
  INTERACTABLE_ID.BEACH_NIGHT_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export function createBeachWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy', _fromArea?: string): WorldResult & {
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[BeachWorld] Creating Beach world (journey\'s end)...');

  // Apply Beachfront sky, fog, and lighting via SkySystem
  const skySystem = new SkySystem(scene);
  void skySystem.apply('beachfront', 0);

  // === LAYOUT: 140×80 shoreline ===
  // Sandy beach
  const beachGround = MeshBuilder.CreateGround('beach_sand', { width: 140, height: 80 }, scene);
  beachGround.position = new Vector3(0, 0, 0);
  beachGround.isPickable = true;
  beachGround.checkCollisions = false;
  beachGround.metadata = { walkable: true };
  const beachMat = new StandardMaterial('beachSandMat', scene);
  beachMat.diffuseColor = new Color3(0.7, 0.65, 0.5); // Sandy beige
  beachMat.specularColor = new Color3(0.3, 0.3, 0.25);
  beachGround.material = beachMat;

  // Ocean (visual plane, not walkable)
  const ocean = MeshBuilder.CreateGround('beach_ocean', { width: 140, height: 40 }, scene);
  ocean.position = new Vector3(0, -0.2, -60);
  const oceanMat = new StandardMaterial('oceanMat', scene);
  oceanMat.diffuseColor = new Color3(0.1, 0.2, 0.4); // Deep blue
  oceanMat.specularColor = new Color3(0.6, 0.7, 0.9);
  oceanMat.specularPower = 32;
  oceanMat.alpha = 0.8;
  ocean.material = oceanMat;

  // === PLAYER & COMPANION ===
  // Player spawn using registry (no fromArea branching)
  const pending = consumePendingSpawn();
  const spawn = getSpawnForWorld('beach', pending?.entryGateId);
  
  // Create BOTH players using shared helper with spawn point
  const { boyPlayer, girlPlayer } = createWorldPlayers(scene, spawn, roleId);
  
  const companion = new Companion(scene, spawn.position.clone().add(new Vector3(3, 0, 2)), eventBus);

  // === INTERACTABLES ===
  const interactables: Interactable[] = [];

  // Campfire (final ritual spot)
  const campfire = createCampfireInteractable(
    scene,
    INTERACTABLE_ID.BEACH_CAMPFIRE,
    new Vector3(0, 0, -5),
    new Color3(1.0, 0.6, 0.2),
    eventBus
  );
  interactables.push(campfire);

  // Gate back to Night
  const nightGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.BEACH_NIGHT_GATE,
    new Vector3(0, 0.5, 37),
    new Color3(0.2, 0.2, 0.4), // Night indigo
    eventBus,
    'night'
  );
  interactables.push(nightGate);

  // Dispose function
  const dispose = () => {
    beachGround.dispose();
    beachMat.dispose();
    ocean.dispose();
    oceanMat.dispose();
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
    spawnForward: spawn.forward.clone(),
    
    // Required by GameApp
    companion,
    interactables,
    dispose,
  };
}

// === HELPER: Campfire Interactable ===
function createCampfireInteractable(
  scene: Scene,
  id: InteractableId,
  position: Vector3,
  color: Color3,
  eventBus: any
): Interactable {
  const campfire = MeshBuilder.CreateCylinder(id, { diameter: 2, height: 0.3 }, scene);
  campfire.position = position;
  campfire.isPickable = true;
  campfire.checkCollisions = false;
  campfire.metadata = { interactable: true, id };

  const mat = new StandardMaterial(`${id}_mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.5); // Warm glow
  campfire.material = mat;

  return {
    id,
    mesh: campfire,
    interact: () => {
      console.log(`[BeachWorld] Campfire ${id} interacted`);
      eventBus.emit({ type: 'interact', targetId: id });
    },
    dispose: () => {
      campfire.dispose();
      mat.dispose();
    },
    alwaysActive: true,
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
  const gate = MeshBuilder.CreateBox(id, { width: 3, height: 2.5, depth: 0.5 }, scene);
  gate.position = position;
  gate.isPickable = true;
  gate.checkCollisions = false;
  gate.metadata = { interactable: true, id };

  const mat = new StandardMaterial(`${id}_mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.3);
  gate.material = mat;

  return {
    id,
    mesh: gate,
    alwaysActive: true,
    interact: () => {
      console.log(`[BeachWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea, fromGateId: id });
    },
    dispose: () => {
      gate.dispose();
      mat.dispose();
    },
  };
}

