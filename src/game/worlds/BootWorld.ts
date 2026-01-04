/** THIS IS A DEV PLAYGROUND WORLD FOR TESTING PURPOSES ONLY  
 * BootWorld - Minimal playable scene with primitives only
 * Ground + lights + fog + camera + player capsule + companion + task interactables
 */

import {
  Scene,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
} from '@babylonjs/core';
import { Companion } from '@game/entities/companion/Companion';
import { Axe } from '@game/entities/props/Axe';
import { LogPile } from '@game/entities/props/LogPile';
import { Campfire } from '@game/entities/props/Campfire';
import type { RoleId } from '@game/content/areas';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';
import type { WorldResult } from './types';
import { createWorldPlayers } from './helpers';

export const BOOT_INTERACTABLES = [
  INTERACTABLE_ID.AXE,
  INTERACTABLE_ID.LOGPILE,
  INTERACTABLE_ID.CAMPFIRE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
}

export function createBootWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy'): WorldResult & {
  companion: Companion;
  interactables: Interactable[];
  campfire: Campfire;
  dispose: () => void;
} {
  // Sky-like background
  scene.clearColor = new Color4(0.7, 0.85, 1.0, 1.0);

  // Fog for depth
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.7, 0.85, 1.0);
  scene.fogDensity = 0.02;

  // Hemispheric light (ambient from sky)
  const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.6;
  hemiLight.diffuse = new Color3(0.9, 0.95, 1.0);
  hemiLight.groundColor = new Color3(0.5, 0.6, 0.4);

  // Directional light (sun)
  const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), scene);
  dirLight.intensity = 0.8;
  dirLight.diffuse = new Color3(1.0, 0.95, 0.8);

  // Ground plane (increased size for companion exploration)
  const ground = MeshBuilder.CreateGround('ground', { width: 60, height: 60 }, scene);
  ground.isPickable = true;
  ground.checkCollisions = false; // Controller handles collision
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3);
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // Create BOTH players using shared helper
  const { boyPlayer, girlPlayer } = createWorldPlayers(scene, new Vector3(0, 0.9, 0), roleId);

  // Note: Camera is now created by GameApp's CameraRig

  // Create task interactables in triangle layout
  // Axe at (8, 0, 0)
  const axe = new Axe(scene, new Vector3(8, 0, 0), INTERACTABLE_ID.AXE);
  
  // LogPile at (16, 0, 6)
  const logPile = new LogPile(scene, new Vector3(16, 0, 6), INTERACTABLE_ID.LOGPILE);
  
  // Campfire at (24, 0, -4) - reuse or create
  const campfire = new Campfire(scene, new Vector3(24, 0, -4), INTERACTABLE_ID.CAMPFIRE);
  
  const interactables: Interactable[] = [axe, logPile, campfire];

  // Spawn companion in visible position (front-left of player)
  const companion = new Companion(scene, new Vector3(3, 0.4, 2), eventBus);

  // Dispose function
  const dispose = () => {
    ground.dispose();
    boyPlayer.dispose();
    girlPlayer.dispose();
    groundMat.dispose();
    axe.dispose();
    logPile.dispose();
    campfire.dispose();
    companion.dispose();
    hemiLight.dispose();
    dirLight.dispose();
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
    spawnForward: { x: 0, y: 0, z: 1 }, // Default forward direction

    // Required by GameApp
    companion,
    interactables,
    campfire,
    dispose,
  };
}
