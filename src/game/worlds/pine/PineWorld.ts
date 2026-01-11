/**
 * PineWorld - Fourth playable area (late afternoon ascent)
 * 90×160 uphill trail through pine forest
 *
 * Visual Greybox Goals:
 * - Uphill reads instantly (slope + switchback trail ribbon + berm props)
 * - Dense forest walls (procedural scatter bands)
 * - Key locations implied (cairns, overlook, lantern station, cache)
 * - Optional billboard cloud FX (if not already handled by SkySystem)
 */

import { Color3, type Scene } from '@babylonjs/core';
import type { RoleId } from '@game/content/areas';
import type { WorldResult } from '../types';
import { createWorldPlayers } from '../helpers';
import { consumePendingSpawn } from '../spawnState';
import { getSpawnForWorld } from '../spawnRegistry';
import { INTERACTABLE_ID } from '@game/content/interactableIds';
import { Companion } from '@game/entities/companion/Companion';
import { SkySystem } from '@game/systems/sky/SkySystem';
import { BillboardCloudSystem } from '@game/systems/sky/BillboardCloudSystem';

// Pine world modules (clean barrel import)
import {
  createTerrain,
  createTerrainGuards,
  createTrailRibbon,
  createForest,
  createProps,
  createMarkers,
  createGateInteractable,
  WORLD_ID,
  PINE_TERRAIN,
  DisposableBag,
  MaterialCache,
  withBase,
  atTerrain,
  type Interactable,
} from './index';
import { createGrass } from './terrain/createGrass';

// Phase 7: Bounds, envelope, debug
import { createWorldBoundsGuard } from './bounds/WorldBoundsGuard';
import { createTerrainEnvelope } from './terrain/createTerrainEnvelope';
import { PineDebugToggles } from './debug/pineDebugToggles';
import { TreeGroundingDebug } from './debug/treeGroundingDebug';

// Re-export for worldManifest
export { PINE_INTERACTABLES } from './index';

// ------------------------------------------------------------
// Main world factory
// ------------------------------------------------------------

export function createPineWorld(
  scene: Scene,
  eventBus: { emit: (event: any) => void },
  roleId: RoleId = 'boy',
  _fromArea?: string
): WorldResult & {
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[PineWorld] Creating Pine Trails world...');

  // Centralized disposal (prevents double-dispose + missed mats)
  const bag = new DisposableBag();
  const mats = new MaterialCache(bag);

  // --- SKY / LOOK (SkySystem) ---
  const skySystem = new SkySystem(scene);
  bag.trackOther(skySystem);
  void skySystem.apply(WORLD_ID, 0);

  // --- Optional billboard cloud FX (ONLY if you want extra layer beyond pano) ---
  const cloudUrls = [
    'assets/sky/_fx/clouds/cloud_01.png',
    'assets/sky/_fx/clouds/cloud_02.png',
    'assets/sky/_fx/clouds/cloud_03.png',
    'assets/sky/_fx/clouds/cloud_04.png',
    'assets/sky/_fx/clouds/cloud_05.png',
    'assets/sky/_fx/clouds/cloud_06.png',
    'assets/sky/_fx/clouds/cloud_07.png',
  ];

  const clouds = bag.trackOther(
    new BillboardCloudSystem(
      scene,
      {
        enabled: true,
        urls: cloudUrls,
        count: 18,
        radiusMin: 260,
        radiusMax: 780,
        heightMin: 130,
        heightMax: 220,
        sizeMin: 60,
        sizeMax: 170,
        alphaMin: 0.07,
        alphaMax: 0.18,
        speedMin: 0.08,
        speedMax: 0.28,
        windDir: { x: 1, z: 0.2 },
        wrap: true,
        fadeInSec: 0.8,
        billboard: true,
        brightness: 1.25,
        tint: { r: 1.02, g: 0.98, b: 0.95 },
        renderingGroupId: 1,
      },
      withBase
    )
  );

  // --- TERRAIN ---
  const { ground: terrain, onReady: terrainReady } = createTerrain(scene, bag, mats);
  createTerrainGuards(scene, bag);

  // --- PLAYER & COMPANION ---
  // Player spawn using registry (no fromArea branching)
  const pending = consumePendingSpawn();
  const spawn = getSpawnForWorld('pine', pending?.entryGateId);
  
  // Pine uses terrain-adjusted Y - keep XZ from registry, compute Y via atTerrain
  const spawnPos = atTerrain(spawn.position.x, spawn.position.z, PINE_TERRAIN.playerYOffset);
  const spawnWithTerrain = {
    position: spawnPos,
    forward: spawn.forward,
  };

  const { boyPlayer, girlPlayer } = createWorldPlayers(scene, spawnWithTerrain, roleId);

  const companion = new Companion(
    scene,
    atTerrain(spawnPos.x + 3, spawnPos.z + 2, PINE_TERRAIN.playerYOffset),
    eventBus
  );

  // Create grass field (async, tracked in DisposableBag)
  let isWorldAlive = true;
  const getIsAlive = () => isWorldAlive;
  
  let trail: any;
  let forest: any;
  let props: any;
  let markers: any;
  let boundsGuard: any;
  let boundsObserver: any;  // Phase 7: observer reference for cleanup
  let debugToggles: any;
  let treeMeshes: any[] = [];
  let treeGroundingDebug: TreeGroundingDebug | null = null; // Phase 9: tree grounding debug

  void terrainReady.then((sampler) => {
    // Place all world objects after terrain is ready
    trail = createTrailRibbon(scene, bag, mats, sampler);
    
    // Phase 9: createForest now returns { meshes, placementData }
    const forestResult = createForest(scene, bag, mats, sampler);
    forest = forestResult.meshes;
    
    // Phase 9: Setup tree grounding debug in DEV mode
    if (import.meta.env.DEV) {
      treeGroundingDebug = new TreeGroundingDebug(scene);
      treeGroundingDebug.setData(forestResult.placementData);
    }

    props = createProps(scene, bag, mats, sampler);
    markers = createMarkers(scene, bag, mats, sampler);

    // Phase 7: Terrain envelope (visual-only ground + skirt)
    createTerrainEnvelope(scene, bag, mats, sampler);

    // Phase 7: Bounds guard (prevent OOB)
    boundsGuard = createWorldBoundsGuard({
      sampler,
      margin: 2,
    });

    // Phase 7: Bounds guard update loop (MUST be after boundsGuard created)
    boundsObserver = scene.onBeforeRenderObservable.add(() => {
      if (boundsGuard && isWorldAlive) {
        const activeMesh = currentActiveRole === 'boy' ? boyPlayer.mesh : girlPlayer.mesh;
        boundsGuard.update(activeMesh, companion.mesh);
      }
    });

    // Phase 7: Debug toggles (Shift+T, Shift+B, Shift+G)
    if (import.meta.env.DEV) {
      debugToggles = new PineDebugToggles({
        scene,
        sampler,
        getTreeMeshes: () => treeMeshes,
        treeGroundingDebug: treeGroundingDebug || undefined,
      });
    }

    // Store tree meshes for debug toggles
    treeMeshes = forest || [];

    createGrass(scene, bag, sampler, getIsAlive)
      .then((_field) => {
        // Hide terrain ground since grass covers it (prevents z-fighting)
        // Note: Pine uses terrain ribbons, may not need hiding depending on setup
        if (import.meta.env.DEV) {
          console.log('[Pine] Grass field created successfully');
        }
      })
      .catch((err) => {
        console.error('[Pine] Failed to create grass:', err);
      });
  });

  // --- INTERACTABLES ---
  const interactables: Interactable[] = [];

  // Gates positioned near terrain bounds
  const northGateZ = -78;
  const southGateZ = 78;

  const northGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.PINE_DUSK_GATE,
    atTerrain(0, northGateZ, 4),
    new Color3(2.0, 1.5, 0.2),
    eventBus,
    'dusk',
    bag,
    mats
  );
  interactables.push(northGate);

  const southGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.PINE_CREEK_GATE,
    atTerrain(0, southGateZ, 4),
    new Color3(0.4, 0.7, 0.8),
    eventBus,
    'creek',
    bag,
    mats
  );
  interactables.push(southGate);

  // Track current active role
  let currentActiveRole: RoleId = roleId;

  const dispose = () => {
    isWorldAlive = false;  // Prevent ghost meshes from async grass
    
    // Phase 7: Dispose bounds guard and debug toggles
    if (boundsObserver) {
      scene.onBeforeRenderObservable.remove(boundsObserver);
    }
    if (boundsGuard) {
      boundsGuard.dispose();
    }
    if (debugToggles) {
      debugToggles.dispose();
    }
    // Phase 9: Dispose tree grounding debug
    if (treeGroundingDebug) {
      treeGroundingDebug.cleanup();
    }
    
    boyPlayer.dispose();
    girlPlayer.dispose();
    companion.dispose();
    interactables.forEach((i) => i.dispose());
    bag.dispose();  // DisposableBag handles grass cleanup
    
    // Quiet unused warnings
    void clouds;
    void terrain;
    void trail;
    void forest;
    void props;
    void markers;
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
