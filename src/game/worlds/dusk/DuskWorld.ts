/**
 * DuskWorld - Fifth playable area (Firefly Meadow)
 * -----------------------------------------------------------------------------
 * Visual-first "Firefly Dusk Meadow" inspired by docs/README (golden hour → dusk).
 *
 * What this file now does (VISUAL ONLY):
 * - Golden dusk lighting + soft fog + warm meadow ground
 * - Tall-grass perimeter + light wildflower scatter (performance-friendly instances)
 * - Central ancient oak landmark + rope swing (gentle sway)
 * - 4 firefly clusters with distinct motion patterns (constellation/river/pulse/spiral)
 * - Photography rock + lantern workbench + lantern totem (decor)
 * - Gate visuals upgraded to stone pillars (moon-phase vibe) while keeping interact logic
 *
 * Non-goals (intentionally NOT implemented here yet):
 * - Linger mode logic, collecting fireflies, memory capture UI, item gates, quests.
 */

import {
  Scene,
  Color3,
  Vector3,
  TransformNode,
  HemisphericLight,
  DirectionalLight,
} from '@babylonjs/core';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';

import { Companion } from '@game/entities/companion/Companion';
import { SkySystem } from '@game/systems/sky/SkySystem';
import type { RoleId } from '@game/content/areas';
import type { WorldResult } from '../types';
import { createWorldPlayers } from '../helpers';
import { consumePendingSpawn } from '../spawnState';
import { getSpawnForWorld } from '../spawnRegistry';

import {
  DUSK,
  DUSK_INTERACTABLES,
  type Interactable,
  createGround,
  createFogWall,
  createTallGrass,
  createWildflowers,
  createLingerNests,
  createAncientOak,
  createRopeSwing,
  createProps,
  createFireflies,
  createInteractables,
  makeExclusionPredicate,
} from './index';

export { DUSK_INTERACTABLES };

export function createDuskWorld(
  scene: Scene,
  eventBus: any,
  roleId: RoleId = 'boy',
  _fromArea?: string
): WorldResult & {
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[DuskWorld] Creating Firefly Dusk Meadow...');

  const disposers: Array<() => void> = [];
  const addDispose = (fn: () => void) => disposers.push(fn);

  // === SKY / ATMOSPHERE ======================================================
  const skySystem = new SkySystem(scene);
  void skySystem.apply('firefly', 0);
  addDispose(() => skySystem.dispose());

  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = DUSK.FOG_DENSITY;
  scene.fogColor = new Color3(0.40, 0.34, 0.55);

  const hemi = new HemisphericLight('dusk_hemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = DUSK.HEMI_INTENSITY;
  hemi.diffuse = new Color3(0.45, 0.55, 0.75);
  hemi.groundColor = new Color3(0.75, 0.55, 0.35);
  addDispose(() => hemi.dispose());

  const sun = new DirectionalLight('dusk_sun', DUSK.SUN_DIR, scene);
  sun.intensity = DUSK.SUN_INTENSITY;
  sun.diffuse = new Color3(1.0, 0.72, 0.40);
  sun.specular = new Color3(0.25, 0.22, 0.18);
  addDispose(() => sun.dispose());

  // === SPAWN / PLAYERS =======================================================
  const pending = consumePendingSpawn();
  const spawn = getSpawnForWorld('dusk', pending?.entryGateId);

  const { boyPlayer, girlPlayer } = createWorldPlayers(scene, spawn, roleId);

  const companion = new Companion(scene, spawn.position.clone().add(new Vector3(3, 0, 2)), eventBus);

  let currentActiveRole: RoleId = roleId;

  // === TERRAIN & VEGETATION ==================================================
  const meadowRoot = new TransformNode('dusk_meadow_root', scene);
  addDispose(() => meadowRoot.dispose());

  const meadowGround = createGround(scene);
  addDispose(() => meadowGround.dispose());

  const isInExclusion = makeExclusionPredicate();

  const grassSystem = createTallGrass(scene, meadowRoot, isInExclusion);
  addDispose(() => grassSystem.dispose());

  const flowersSystem = createWildflowers(scene, meadowRoot, isInExclusion);
  addDispose(() => flowersSystem.dispose());

  const nestsSystem = createLingerNests(scene, meadowRoot);
  addDispose(() => nestsSystem.dispose());

  const fogTease = createFogWall(scene, meadowRoot);
  addDispose(() => fogTease.dispose());

  // === LANDMARKS =============================================================
  const oak = createAncientOak(scene, meadowRoot);
  addDispose(() => oak.dispose());

  const swing = createRopeSwing(scene, meadowRoot, oak.swingAnchorWorld);
  addDispose(() => swing.dispose());

  // === PROPS =================================================================
  const props = createProps(scene, meadowRoot);
  addDispose(() => props.dispose());

  // === FX: Fireflies =========================================================
  const glow = new GlowLayer('dusk_glow', scene);
  glow.intensity = DUSK.GLOW_INTENSITY;
  glow.blurKernelSize = DUSK.GLOW_KERNEL;
  addDispose(() => glow.dispose());

  const fireflies = createFireflies(scene, meadowRoot);
  addDispose(() => fireflies.dispose());

  // === INTERACTABLES: Gates ==================================================
  const interactables = createInteractables(scene, meadowRoot, eventBus);
  for (const interactable of interactables) {
    addDispose(() => interactable.dispose());
  }

  // === UPDATE LOOP ============================================================
  let t = 0;
  const updateObs = scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    t += dt;

    swing.update(t);
    fireflies.update(t, dt);
  });
  addDispose(() => {
    scene.onBeforeRenderObservable.remove(updateObs);
  });

  // === DISPOSE ===============================================================
  const dispose = () => {
    boyPlayer.dispose();
    girlPlayer.dispose();
    companion.dispose();

    for (let i = disposers.length - 1; i >= 0; i--) {
      try {
        disposers[i]?.();
      } catch (err) {
        console.warn('[DuskWorld] dispose() error:', err);
      }
    }
  };

  return {
    getActivePlayer: () => (currentActiveRole === 'boy' ? boyPlayer : girlPlayer),
    getActiveMesh: () => (currentActiveRole === 'boy' ? boyPlayer : girlPlayer).mesh,
    setActiveRole: (newRoleId: RoleId) => {
      currentActiveRole = newRoleId;
      boyPlayer.setActive(newRoleId === 'boy');
      girlPlayer.setActive(newRoleId === 'girl');
    },

    boyPlayer,
    girlPlayer,
    spawnForward: spawn.forward.clone(),

    companion,
    interactables,
    dispose,
  };
}
