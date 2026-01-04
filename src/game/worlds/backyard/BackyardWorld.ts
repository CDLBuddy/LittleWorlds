/**
 * BackyardWorld - First real playable area
 * Morning lighting, house, fence boundary, gate to Woodline
 * Backyard tasks: slingshot/target (boy), multitool/carve_station (girl)
 */

import { Scene } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { SkySystem } from '@game/systems/sky/SkySystem';
import { Companion } from '@game/entities/companion/Companion';
import type { RoleId } from '@game/content/areas';
import type { AppEvent } from '@game/shared/events';
import { snapshotPerf, logPerfSnapshot } from '@game/debug/perfSnapshot';
import type { WorldResult } from '../types';
import { createWorldPlayers } from '../helpers';
import { consumePendingSpawn } from '../spawnState';
import { getSpawnForWorld } from '../spawnRegistry';
import {
  BACKYARD_INTERACTABLES,
  type Interactable,
  createGround,
  createGrass,
  loadHouse,
  loadTrees,
  createProps,
  createInteractables,
} from './index';

// Re-export for worldManifest.ts compatibility
export { BACKYARD_INTERACTABLES };

export function createBackyardWorld(
  scene: Scene,
  eventBus: { emit: (event: AppEvent) => void },
  roleId: RoleId = 'boy',
  _fromArea?: string
): WorldResult & {
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
  registerDynamic?: (register: (interactable: Interactable) => void) => void;
} {
  // Track if world is still alive for disposal guard
  let isAlive = true;

  // === SKY SYSTEM ===
  const skySystem = new SkySystem(scene);
  void skySystem.apply('backyard', 0); // Instant, no fade

  // === TERRAIN ===
  const { ground, groundMat } = createGround(scene);

  // Load grass asynchronously (fire-and-forget)
  void createGrass(scene, ground, () => isAlive).catch((error) => {
    console.error('[Backyard] Failed to create grass:', error);
  });

  // === MODELS ===
  // Load house asynchronously (fire-and-forget)
  void loadHouse(scene, () => isAlive).catch((error) => {
    console.error('[Backyard] Failed to load house:', error);
  });

  // Load trees asynchronously (fire-and-forget)
  void loadTrees(scene, () => isAlive).catch((error) => {
    console.error('[Backyard] Failed to load trees:', error);
  });

  // === PROPS ===
  const props = createProps(scene);

  // === PLAYER SPAWN ===
  // Player spawn using registry (no fromArea branching)
  const pending = consumePendingSpawn();
  const spawn = getSpawnForWorld('backyard', pending?.entryGateId);
  
  // Create BOTH players using shared helper with spawn point
  const { boyPlayer, girlPlayer } = createWorldPlayers(scene, spawn, roleId);

  // === COMPANION ===
  const companion = new Companion(
    scene,
    spawn.position.clone().add(spawn.forward.scale(3)),
    eventBus
  );

  // === INTERACTABLES ===
  const { interactables, registerDynamic } = createInteractables(scene, eventBus, () => isAlive);

  // === PERFORMANCE OPTIMIZATIONS ===
  if (import.meta.env.DEV) {
    // Small delay to ensure async mesh loading completes
    setTimeout(() => {
      // Freeze static environment meshes
      ground.freezeWorldMatrix();
      props.fence.fencePosts.forEach(f => {
        f.freezeWorldMatrix();
      });
      
      // Freeze materials that never change
      props.fence.fenceMat.freeze();
      groundMat.freeze();
      
      // Log performance snapshot after optimization
      const perfSnapshot = snapshotPerf(scene);
      logPerfSnapshot('Backyard after setup', perfSnapshot);
    }, 1000);
  }

  // === DISPOSAL ===
  const dispose = () => {
    // Mark world as disposed to prevent ghost meshes from async loads
    isAlive = false;
    
    // Dispose sky system
    skySystem.dispose();
    
    // Dispose terrain
    ground.dispose();
    groundMat.dispose();
    
    // Dispose props
    props.tireSwing.rope.dispose();
    props.tireSwing.ropeMat.dispose();
    props.tireSwing.tire.dispose();
    props.tireSwing.tireMat.dispose();
    
    props.sandbox.sandbox.dispose();
    props.sandbox.sandMat.dispose();
    props.sandbox.borders.forEach(b => b.mesh.dispose());
    props.sandbox.borderMat.dispose();
    
    props.garden.garden.dispose();
    props.garden.gardenMat.dispose();
    
    props.fence.fencePosts.forEach(f => {
      f.material?.dispose();
      f.dispose();
    });
    props.fence.picketInstances.forEach(inst => inst.dispose());
    props.fence.picketTemplate.dispose();
    props.fence.fenceMat.dispose();
    
    // Dispose players and companion
    boyPlayer.dispose();
    girlPlayer.dispose();
    companion.dispose();
    
    // Dispose interactables
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
    // Method to register late-loading interactables
    registerDynamic,
  };
}

