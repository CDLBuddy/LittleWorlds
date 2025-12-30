/**
 * CreekWorld - Third playable area (afternoon water world)
 * 100×140 corridor with stepping stones, filter station, slingshot bridge
 * Mid-to-late afternoon atmosphere, meditative water sounds
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
  TransformNode,
} from '@babylonjs/core';
import { Player } from '@game/entities/player/Player';
import { Companion } from '@game/entities/companion/Companion';
import type { RoleId } from '@game/content/areas';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';
import { saveFacade } from '@game/systems/saves/saveFacade';

export const CREEK_INTERACTABLES = [
  INTERACTABLE_ID.CREEK_FILTER_STATION,
  INTERACTABLE_ID.CREEK_SLINGSHOT_BRANCH_TARGET,
  INTERACTABLE_ID.CREEK_WILLOW_REST,
  INTERACTABLE_ID.CREEK_DEEP_POOL_LINGER,
  INTERACTABLE_ID.CREEK_NORTH_VISTA_MARKER,
  INTERACTABLE_ID.CREEK_STONES_ENTRY,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export function createCreekWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy'): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[CreekWorld] Creating Creek world (100×140 corridor)...');

  // Mid-to-late afternoon sky
  scene.clearColor = new Color4(0.55, 0.7, 0.85, 1.0);

  // Atmospheric fog
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.55, 0.7, 0.85);
  scene.fogDensity = 0.012;

  // Hemispheric light (ambient)
  const hemiLight = new HemisphericLight('creekHemi', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.65;
  hemiLight.diffuse = new Color3(0.9, 0.92, 1.0); // Cool blues
  hemiLight.groundColor = new Color3(0.3, 0.45, 0.55); // Water reflection

  // Directional light (afternoon sun from south-west)
  const dirLight = new DirectionalLight('creekDir', new Vector3(-0.8, -1.5, -0.3), scene);
  dirLight.intensity = 0.85;
  dirLight.diffuse = new Color3(1.0, 0.88, 0.7); // Sun-warmed

  dirLight.intensity = 0.85;
  dirLight.diffuse = new Color3(1.0, 0.88, 0.7); // Sun-warmed

  // === LAYOUT: 100×140 corridor ===
  // West bank (left side, -35 to -15 x)
  const westBank = MeshBuilder.CreateGround('creek_west_bank', { width: 20, height: 140 }, scene);
  westBank.position.x = -25;
  westBank.isPickable = true;
  westBank.checkCollisions = false; // Controller handles collision
  westBank.metadata = { walkable: true };
  const westMat = new StandardMaterial('westBankMat', scene);
  westMat.diffuseColor = new Color3(0.35, 0.45, 0.3); // Mossy bank
  westBank.material = westMat;

  // East bank (right side, 15 to 35 x)
  const eastBank = MeshBuilder.CreateGround('creek_east_bank', { width: 20, height: 140 }, scene);
  eastBank.position.x = 25;
  eastBank.isPickable = true;
  eastBank.checkCollisions = false; // Controller handles collision
  eastBank.metadata = { walkable: true };
  const eastMat = new StandardMaterial('eastBankMat', scene);
  eastMat.diffuseColor = new Color3(0.38, 0.48, 0.32); // Slightly different tone
  eastBank.material = eastMat;

  // Creek bed (center depression, -15 to 15 x)
  const creekBed = MeshBuilder.CreateGround('creek_bed', { width: 30, height: 140 }, scene);
  creekBed.position.y = -0.3; // Lower than banks
  const bedMat = new StandardMaterial('creekBedMat', scene);
  bedMat.diffuseColor = new Color3(0.25, 0.3, 0.2); // Dark creek bed
  bedMat.specularColor = new Color3(0.05, 0.05, 0.05);
  creekBed.material = bedMat;

  // Water plane (not walkable, visual only)
  const water = MeshBuilder.CreateGround('creek_water', { width: 28, height: 140 }, scene);
  water.position.y = 0.05; // Just above creek bed
  const waterMat = new StandardMaterial('waterMat', scene);
  waterMat.diffuseColor = new Color3(0.2, 0.45, 0.6); // Cool blue
  waterMat.specularColor = new Color3(0.8, 0.9, 1.0);
  waterMat.specularPower = 64;
  waterMat.alpha = 0.7; // Transparent
  water.material = waterMat;

  // === STEPPING STONES (5 entry stones at shallow crossing) ===
  const stones: AbstractMesh[] = [];
  const stonePositions = [
    new Vector3(-6, 0.1, 15),
    new Vector3(-3, 0.15, 16),
    new Vector3(0, 0.2, 15.5),
    new Vector3(3, 0.15, 15),
    new Vector3(6, 0.1, 14.5),
  ];

  stonePositions.forEach((pos, i) => {
    const stone = MeshBuilder.CreateCylinder(`creek_stone_${i}`, { diameter: 1.8, height: 0.4 }, scene);
    stone.position = pos;
    stone.isPickable = true;
    stone.checkCollisions = false; // Controller handles collision
    stone.metadata = { walkable: true };
    const stoneMat = new StandardMaterial(`stoneMat${i}`, scene);
    stoneMat.diffuseColor = new Color3(0.5, 0.48, 0.45); // Sun-warmed stone
    stoneMat.specularColor = new Color3(0.3, 0.3, 0.3);
    stone.material = stoneMat;
    stones.push(stone);
  });

  // === WATER BOUNDS (derived from water mesh) ===
  const waterBounds = {
    minX: -14,
    maxX: 14,
    minZ: -70,
    maxZ: 70,
  };

  // Track last safe position for splash recovery
  const lastSafePosition = new Vector3(0, 0, 25); // South entry (mutated via copyFrom)
  
  // Walkable surfaces list for safe position tracking
  const walkableSurfaces = [westBank, eastBank, ...stones];

  // === FILTER STATION (Girl mechanic) ===
  const filterStation = createFilterStation(scene, eventBus, roleId);

  // === SLINGSHOT BRIDGE (Boy mechanic) ===
  const slingshotBridge = createSlingshotBridge(scene, eventBus, roleId, stones, walkableSurfaces);

  // === LINGER MOMENTS ===
  const deepPool = createLingerMoment(
    scene,
    INTERACTABLE_ID.CREEK_DEEP_POOL_LINGER,
    new Vector3(-10, 0, -15),
    15000, // 15s
    'Still Water',
    eventBus
  );

  const willowRest = createLingerMoment(
    scene,
    INTERACTABLE_ID.CREEK_WILLOW_REST,
    new Vector3(10, 0, 5),
    10000, // 10s
    'Under the Willow',
    eventBus
  );

  // === VISTAS ===
  const southVista = createSouthVista(scene);
  const northVista = createNorthVista(scene);
  
  // North vista marker interactable
  const northVistaMarker = createVistaMarker(scene, eventBus);

  // === STEPPING STONES ENTRY INTERACTABLE ===
  const stonesEntry = createStonesEntry(scene, eventBus);

  // Player spawn (south side on west bank, facing north)
  const player = new Player(scene, new Vector3(-25, 0, 30), roleId);

  // Companion spawn (slightly ahead on west bank)
  const companion = new Companion(scene, new Vector3(-22, 0, 27), eventBus);

  // Position check observer for water splash
  const positionObserver = scene.onBeforeRenderObservable.add(() => {
    const playerPos = player.mesh.position;
    
    // Check if player is on a walkable surface
    const onWalkableSurface = walkableSurfaces.some(surface => {
      const distance = Vector3.Distance(playerPos, surface.position);
      // Check if within surface bounds (rough approximation)
      return distance < 3.0 && Math.abs(playerPos.y - surface.position.y) < 1.0;
    });
    
    // Check if in water bounds
    const inWater = 
      playerPos.x > waterBounds.minX && 
      playerPos.x < waterBounds.maxX && 
      playerPos.z > waterBounds.minZ && 
      playerPos.z < waterBounds.maxZ &&
      playerPos.y < 0.5;
    
    if (inWater && !onWalkableSurface) {
      // Splash! Teleport back to last safe position
      player.mesh.position.copyFrom(lastSafePosition);
      
      // Emit splash toast
      (eventBus as any).emit({
        type: 'ui/toast',
        level: 'info',
        message: 'Splash—try again.',
      });
      
      console.log('[CreekWorld] Water splash - returned to safe position');
    } else if (onWalkableSurface) {
      // Update last safe position when on walkable surface
      lastSafePosition.copyFrom(playerPos);
    }
  });

  // Interactables list
  const interactables: Interactable[] = [
    stonesEntry,
    filterStation,
    slingshotBridge.branch,
    deepPool,
    willowRest,
    northVistaMarker,
  ];

  // Freeze static meshes after setup (performance)
  [westBank, eastBank, creekBed, ...stones, ...southVista, ...northVista].forEach(mesh => {
    mesh.freezeWorldMatrix();
  });
  // Don't freeze water (potential future animation), bridge (dynamic), or interactable meshes

  // Dispose function
  const dispose = () => {
    console.log('[CreekWorld] Disposing Creek world...');
    
    // Remove observers
    scene.onBeforeRenderObservable.remove(positionObserver);
    
    // Dispose interactables (they own their meshes/materials)
    interactables.forEach(i => i.dispose());
    
    // Dispose world-owned resources
    westBank.dispose();
    westMat.dispose();
    eastBank.dispose();
    eastMat.dispose();
    creekBed.dispose();
    bedMat.dispose();
    water.dispose();
    waterMat.dispose();
    
    // Dispose stones
    stones.forEach(stone => {
      stone.dispose();
      (stone.material as StandardMaterial)?.dispose();
    });
    
    // Dispose vistas
    southVista.forEach(mesh => {
      mesh.dispose();
      (mesh.material as StandardMaterial)?.dispose();
    });
    northVista.forEach(mesh => {
      mesh.dispose();
      (mesh.material as StandardMaterial)?.dispose();
    });
    
    // Dispose slingshot bridge log (owned by world, not interactable)
    if (slingshotBridge.bridge) {
      slingshotBridge.bridge.dispose();
    }
    
    // Dispose player, companion, lights
    player.dispose();
    companion.dispose();
    hemiLight.dispose();
    dirLight.dispose();
  };

  return {
    player: player.mesh,
    playerEntity: player,
    companion,
    interactables,
    dispose,
  };
}

// === HELPER FUNCTIONS ===

function createFilterStation(scene: Scene, eventBus: any, roleId: RoleId): Interactable {
  const position = new Vector3(-8, 0.5, 0);
  const mesh = MeshBuilder.CreateBox(
    INTERACTABLE_ID.CREEK_FILTER_STATION,
    { width: 1.5, height: 1.0, depth: 1.2 },
    scene
  );
  mesh.position = position;
  
  const mat = new StandardMaterial('filterStationMat', scene);
  mat.diffuseColor = new Color3(0.4, 0.35, 0.3); // Weathered wood
  mat.specularColor = new Color3(0.1, 0.1, 0.1);
  mesh.material = mat;

  // Check if already used
  const alreadyFiltered = (saveFacade.getWorldFlag('creek', 'filteredWater') as boolean | undefined) ?? false;
  if (alreadyFiltered) {
    mat.emissiveColor = new Color3(0.1, 0.2, 0.1); // Subtle green glow (already used)
  }

  return {
    id: INTERACTABLE_ID.CREEK_FILTER_STATION,
    mesh,
    interact: () => {
      if (roleId === 'girl') {
        // Emit completion (TaskSystem handles item grants via grantsItems)
        eventBus.emit({ type: 'interaction/complete', targetId: INTERACTABLE_ID.CREEK_FILTER_STATION });
        saveFacade.setWorldFlag('creek', 'filteredWater', true);
        
        // Visual feedback
        mat.emissiveColor = new Color3(0.1, 0.2, 0.1);
        console.log('[CreekWorld] Filter station used - clean water granted');
      }
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

function createSlingshotBridge(
  scene: Scene, 
  eventBus: any, 
  roleId: RoleId,
  _stones: AbstractMesh[], // Unused - kept for future stone wobble effects
  walkableSurfaces: AbstractMesh[]
): {
  branch: Interactable;
  bridge: { dispose: () => void } | null;
} {
  const branchPos = new Vector3(5, 2, -10);
  const branchMesh = MeshBuilder.CreateCylinder(
    INTERACTABLE_ID.CREEK_SLINGSHOT_BRANCH_TARGET,
    { diameter: 0.6, height: 3.0 },
    scene
  );
  branchMesh.position = branchPos;
  branchMesh.rotation.z = Math.PI / 2; // Horizontal
  
  const branchMat = new StandardMaterial('branchMat', scene);
  branchMat.diffuseColor = new Color3(0.3, 0.25, 0.15); // Dark wood
  branchMesh.material = branchMat;

  // Bridge log (spawns when branch falls)
  const bridgeLogMesh = MeshBuilder.CreateBox('creek_bridge_log', { width: 8, height: 0.5, depth: 1.5 }, scene);
  bridgeLogMesh.position = new Vector3(0, 0.1, -10);
  bridgeLogMesh.isPickable = true;
  bridgeLogMesh.checkCollisions = false; // Controller handles collision
  bridgeLogMesh.metadata = { walkable: true };
  const bridgeMat = new StandardMaterial('bridgeMat', scene);
  bridgeMat.diffuseColor = new Color3(0.35, 0.3, 0.2);
  bridgeLogMesh.material = bridgeMat;

  // Check persistence
  const bridgeBuilt = (saveFacade.getWorldFlag('creek', 'bridgeBuilt') as boolean | undefined) ?? false;

  if (bridgeBuilt) {
    branchMesh.setEnabled(false); // Hide branch
    bridgeLogMesh.setEnabled(true); // Show bridge
    walkableSurfaces.push(bridgeLogMesh); // Add to walkable list
  } else {
    bridgeLogMesh.setEnabled(false); // Hide bridge initially
  }

  const branch: Interactable = {
    id: INTERACTABLE_ID.CREEK_SLINGSHOT_BRANCH_TARGET,
    mesh: branchMesh,
    interact: () => {
      if (roleId === 'boy') {
        const currentHits = (saveFacade.getWorldFlag('creek', 'slingshotHitCount') as number | undefined) ?? 0;
        const newHits = currentHits + 1;
        saveFacade.setWorldFlag('creek', 'slingshotHitCount', newHits);

        console.log(`[CreekWorld] Slingshot hit ${newHits}/3`);

        if (newHits >= 3) {
          // Branch falls, bridge appears
          branchMesh.setEnabled(false);
          bridgeLogMesh.setEnabled(true);
          walkableSurfaces.push(bridgeLogMesh); // Add to walkable surfaces
          saveFacade.setWorldFlag('creek', 'bridgeBuilt', true);
          
          // Emit completion
          eventBus.emit({ type: 'interaction/complete', targetId: INTERACTABLE_ID.CREEK_SLINGSHOT_BRANCH_TARGET });
          
          // Toast via cast (ui/toast not in typed events)
          (eventBus as any).emit({
            type: 'ui/toast',
            level: 'info',
            message: 'A bridge forms across the water',
          });
        } else {
          // Visual feedback for hit (wobble?)
          branchMat.emissiveColor = new Color3(0.2, 0.1, 0);
          setTimeout(() => {
            branchMat.emissiveColor = new Color3(0, 0, 0);
          }, 200);
        }
      }
    },
    dispose: () => {
      branchMesh.dispose();
      branchMat.dispose();
    },
  };

  const bridge = {
    dispose: () => {
      bridgeLogMesh.dispose();
      bridgeMat.dispose();
    },
  };

  return { branch, bridge };
}

function createLingerMoment(
  scene: Scene,
  id: string,
  position: Vector3,
  _dwellDuration: number, // Unused - InteractionSystem handles dwell timing
  toastMessage: string,
  eventBus: any
): Interactable {
  const mesh = MeshBuilder.CreateSphere(id, { diameter: 4.0 }, scene);
  mesh.position = position;
  mesh.isVisible = false; // Invisible trigger

  const mat = new StandardMaterial(`${id}Mat`, scene);
  mesh.material = mat;

  let alreadyLingered = (saveFacade.getWorldFlag('creek', id) as boolean | undefined) ?? false;

  return {
    id,
    mesh,
    interact: () => {
      // Called by InteractionSystem after dwell complete
      if (!alreadyLingered) {
        saveFacade.setWorldFlag('creek', id, true);
        (eventBus as any).emit({
          type: 'ui/toast',
          level: 'info',
          message: toastMessage,
        });
        alreadyLingered = true;
        console.log(`[CreekWorld] Linger moment: ${toastMessage}`);
      }
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
    alwaysActive: true, // Not tied to task progression
  };
}

function createSouthVista(scene: Scene): AbstractMesh[] {
  const meshes: AbstractMesh[] = [];
  
  // Woodline treeline silhouette at z=60
  for (let i = 0; i < 8; i++) {
    const tree = MeshBuilder.CreateCylinder('vistaTree', { diameter: 1.5, height: 6 }, scene);
    tree.position = new Vector3(-20 + i * 5, 3, 60);
    const treeMat = new StandardMaterial(`vistaTreeMat${i}`, scene);
    treeMat.diffuseColor = new Color3(0.2, 0.25, 0.15); // Dark silhouette
    treeMat.alpha = 0.6; // Fade with distance
    tree.material = treeMat;
    meshes.push(tree);
  }

  // Conditional campfire smoke (if Woodline campfire was lit)
  const campfireLit = (saveFacade.getWorldFlag('woodline', 'campfireLit') as boolean | undefined) ?? false;
  if (campfireLit) {
    const smoke = MeshBuilder.CreateSphere('campfireSmoke', { diameter: 3 }, scene);
    smoke.position = new Vector3(0, 8, 62);
    const smokeMat = new StandardMaterial('smokeMat', scene);
    smokeMat.diffuseColor = new Color3(0.7, 0.7, 0.7);
    smokeMat.alpha = 0.3;
    smoke.material = smokeMat;
    meshes.push(smoke);
    console.log('[CreekWorld] South vista shows campfire smoke');
  }

  return meshes;
}

function createNorthVista(scene: Scene): AbstractMesh[] {
  const meshes: AbstractMesh[] = [];
  
  // Rocky channel narrowing at z=-60
  for (let i = 0; i < 6; i++) {
    const rock = MeshBuilder.CreateBox('vistaRock', { width: 2, height: 1.5, depth: 2 }, scene);
    rock.position = new Vector3(-10 + i * 4, 0.5, -60 + Math.random() * 5);
    const rockMat = new StandardMaterial(`vistaRockMat${i}`, scene);
    rockMat.diffuseColor = new Color3(0.4, 0.38, 0.35);
    rock.material = rockMat;
    meshes.push(rock);
  }

  // Pine silhouettes in background
  for (let i = 0; i < 5; i++) {
    const pine = MeshBuilder.CreateCylinder('vistaPine', { diameter: 1.0, height: 8 }, scene);
    pine.position = new Vector3(-15 + i * 7, 4, -70);
    const pineMat = new StandardMaterial(`vistaPineMat${i}`, scene);
    pineMat.diffuseColor = new Color3(0.15, 0.2, 0.15);
    pineMat.alpha = 0.5; // Fade with fog
    pine.material = pineMat;
    meshes.push(pine);
  }

  return meshes;
}

function createStonesEntry(scene: Scene, eventBus: any): Interactable {
  // Invisible marker at stepping stones entry
  const mesh = MeshBuilder.CreateSphere(
    INTERACTABLE_ID.CREEK_STONES_ENTRY,
    { diameter: 3.0 },
    scene
  );
  mesh.position = new Vector3(0, 0.5, 15);
  mesh.isVisible = false;

  const mat = new StandardMaterial('stonesEntryMat', scene);
  mesh.material = mat;

  return {
    id: INTERACTABLE_ID.CREEK_STONES_ENTRY,
    mesh,
    interact: () => {
      // Emit completion when player reaches stones
      eventBus.emit({ type: 'interaction/complete', targetId: INTERACTABLE_ID.CREEK_STONES_ENTRY });
      console.log('[CreekWorld] Stepped on stones - crossing task complete');
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

function createVistaMarker(scene: Scene, _eventBus: any): Interactable {
  // Invisible marker at north vista for optional exploration
  const mesh = MeshBuilder.CreateSphere(
    INTERACTABLE_ID.CREEK_NORTH_VISTA_MARKER,
    { diameter: 4.0 },
    scene
  );
  mesh.position = new Vector3(0, 0.5, -60);
  mesh.isVisible = false;

  const mat = new StandardMaterial('northVistaMarkerMat', scene);
  mesh.material = mat;

  return {
    id: INTERACTABLE_ID.CREEK_NORTH_VISTA_MARKER,
    mesh,
    interact: () => {
      // Optional exploration marker - just log
      console.log('[CreekWorld] Reached north vista');
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
    alwaysActive: true, // Not tied to task progression
  };
}
