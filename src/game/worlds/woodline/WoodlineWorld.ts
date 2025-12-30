/**
 * WoodlineWorld - Second playable area (deeper into forest)
 * Late morning/midday lighting, campfire checkpoint, role-specific fire methods
 * Boy: flint → campfire | Girl: fieldguide → bowdrill → campfire (convergent paths)
 * Campfire lit state persists via worldFlags; lighting completes area and unlocks Creek
 */

import {
  Scene,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
  TransformNode,
  SceneLoader,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Player } from '@game/entities/player/Player';
import { Companion } from '@game/entities/companion/Companion';
import type { RoleId } from '@game/content/areas';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';
import { snapshotPerf, logPerfSnapshot } from '@game/debug/perfSnapshot';
import { saveFacade } from '@game/systems/saves/saveFacade';

export const WOODLINE_INTERACTABLES = [
  INTERACTABLE_ID.WOODLINE_CAMPFIRE,
  INTERACTABLE_ID.FLINT_PICKUP,
  INTERACTABLE_ID.FIELDGUIDE_PICKUP,
  INTERACTABLE_ID.BOWDRILL_STATION,
  INTERACTABLE_ID.WOODLINE_CREEK_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean; // Gates and always-available interactables
}

interface CampfireInteractable extends Interactable {
  setFireLit: (lit: boolean) => void;
  isLit: () => boolean;
}

export function createWoodlineWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy'): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  campfire: CampfireInteractable;
  dispose: () => void;
  registerDynamic?: (register: (interactable: Interactable) => void) => void;
} {
  // Late morning sky - bright and clear
  scene.clearColor = new Color4(0.7, 0.85, 1.0, 1.0);

  // Light fog for depth
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.75, 0.85, 0.95);
  scene.fogDensity = 0.008; // Reduced for larger map

  // Bright hemispheric light (late morning sun high in sky)
  const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.8;
  hemiLight.diffuse = new Color3(1.0, 0.98, 0.92);
  hemiLight.groundColor = new Color3(0.5, 0.6, 0.5);

  // Strong directional sunlight
  const dirLight = new DirectionalLight('dirLight', new Vector3(-0.3, -2, -0.8), scene);
  dirLight.intensity = 1.0;
  dirLight.diffuse = new Color3(1.0, 0.95, 0.88);

  // Forest floor ground (larger map)
  const ground = MeshBuilder.CreateGround('ground', { width: 120, height: 120 }, scene);
  ground.isPickable = true;
  ground.checkCollisions = false; // Controller handles collision
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.4, 0.55, 0.3); // Brighter forest floor for daytime
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // Clearing around campfire (lighter circle)
  const clearing = MeshBuilder.CreateDisc('clearing', { radius: 8 }, scene);
  clearing.position.y = 0.01; // Slightly above ground to avoid z-fighting
  clearing.rotation.x = Math.PI / 2;
  const clearingMat = new StandardMaterial('clearingMat', scene);
  clearingMat.diffuseColor = new Color3(0.6, 0.75, 0.45); // Brighter grass for late morning
  clearing.material = clearingMat;

  // === TREES AND BUSHES ===
  // Load TreesBushes.glb model for forest atmosphere
  const treePositions = [
    new Vector3(-20, 0, -20),
    new Vector3(20, 0, -20),
    new Vector3(-25, 0, 10),
    new Vector3(25, 0, 10),
    new Vector3(-15, 0, 25),
    new Vector3(15, 0, 25),
  ];

  const trees: AbstractMesh[] = [];

  SceneLoader.ImportMesh('', 'assets/models/', 'TreesBushes.glb', scene, (meshes: AbstractMesh[]) => {
    console.log('[Woodline] Loaded trees, mesh count:', meshes.length);
    
    if (meshes.length > 0) {
      // Find parent nodes that have geometry children (tree1, tree2, Plano.* etc)
      const treeRoots = meshes.filter((m: AbstractMesh) => {
        const hasRootParent = m.parent?.name === '__root__';
        const hasGeometryChildren = m.getChildMeshes().some((child: AbstractMesh) => child.getTotalVertices() > 0);
        return hasRootParent && hasGeometryChildren;
      });
      
      console.log('[Woodline] Found tree parent nodes:', treeRoots.length, treeRoots.map((m: AbstractMesh) => m.name));
      
      if (treeRoots.length > 0) {
        // Disable originals
        treeRoots.forEach((root: AbstractMesh) => {
          root.setEnabled(false);
          root.getChildMeshes().forEach((child: AbstractMesh) => child.setEnabled(false));
        });
        
        // Create tree instances at woodline positions with random variety
        treePositions.forEach((pos, idx) => {
          // Randomly pick a tree parent for variety
          const randomRoot = treeRoots[Math.floor(Math.random() * treeRoots.length)];
          
          // Create a new parent node at our desired position
          const newParent = new TransformNode(`tree_parent_${idx}`, scene);
          newParent.position = pos.clone();
          newParent.rotation.y = Math.random() * Math.PI * 2; // Random rotation
          newParent.scaling = new Vector3(1.5, 1.5, 1.5);
          
          // Clone all children of the selected tree/bush into our new parent
          randomRoot.getChildMeshes(false).forEach((child: AbstractMesh, childIdx) => {
            const childClone = child.clone(`tree_${idx}_child_${childIdx}`, newParent);
            if (childClone) {
              // Store the child's local transform relative to its original parent
              const localPos = child.position.clone();
              const localRot = child.rotation.clone();
              const localScale = child.scaling.clone();
              
              // Apply those local transforms to the clone
              childClone.position = localPos;
              childClone.rotation = localRot;
              childClone.scaling = localScale;
              childClone.setEnabled(true);
            }
          });
          
          newParent.setEnabled(true);
        });
      }
    }
  }, null, (_scene: Scene, message: string, exception: any) => {
    console.error('[Woodline] Failed to load trees model:', message, exception);
  });

  // === PINE TREES ===
  // Load Pinetree.glb for denser forest atmosphere around perimeter
  const pinePositions = [
    // Back row (north)
    new Vector3(-28, 0, -28),
    new Vector3(-18, 0, -30),
    new Vector3(-8, 0, -28),
    new Vector3(8, 0, -28),
    new Vector3(18, 0, -30),
    new Vector3(28, 0, -28),
    // Left side (west)
    new Vector3(-30, 0, -15),
    new Vector3(-28, 0, 0),
    new Vector3(-30, 0, 15),
    // Right side (east)
    new Vector3(30, 0, -15),
    new Vector3(28, 0, 0),
    new Vector3(30, 0, 15),
  ];

  SceneLoader.ImportMesh('', 'assets/models/', 'Pinetree.glb', scene, (meshes: AbstractMesh[]) => {
    console.log('[Woodline] Loaded pine trees, mesh count:', meshes.length);
    
    if (meshes.length > 0) {
      // The first mesh is usually the root container
      const pineRoot = meshes[0];
      console.log('[Woodline] Pine tree root:', pineRoot.name, 'children:', pineRoot.getChildMeshes().length);
      
      // Disable the original loaded mesh
      meshes.forEach((m: AbstractMesh) => m.setEnabled(false));
      
      // Create pine tree instances at each position
      pinePositions.forEach((pos, idx) => {
        // Create a new parent node at our desired position
        const newParent = new TransformNode(`pine_parent_${idx}`, scene);
        newParent.position = pos.clone();
        newParent.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        
        // Vary scale slightly for natural look
        const scale = 1.8 + (Math.random() * 0.6); // 1.8 to 2.4
        newParent.scaling = new Vector3(scale, scale, scale);
        
        // Clone the entire tree hierarchy
        meshes.forEach((mesh: AbstractMesh, meshIdx) => {
          const meshClone = mesh.clone(`pine_${idx}_mesh_${meshIdx}`, newParent);
          if (meshClone) {
            meshClone.position = mesh.position.clone();
            meshClone.rotation = mesh.rotation.clone();
            meshClone.scaling = mesh.scaling.clone();
            meshClone.setEnabled(true);
            
            // Always parent to our new parent node
            meshClone.parent = newParent;
            
            trees.push(meshClone);
          }
        });
        
        newParent.setEnabled(true);
        console.log(`[Woodline] Created pine tree ${idx} at`, pos);
      });
      
      console.log(`[Woodline] Created ${pinePositions.length} pine trees`);
    }
  }, null, (_scene: Scene, message: string, exception: any) => {
    console.error('[Woodline] Failed to load pine trees model:', message, exception);
  });

  // Player spawn (front-center of clearing) - y=0 keeps feet on ground
  const player = new Player(scene, new Vector3(0, 0, 15), roleId);

  // Companion spawn (front-left of player)
  const companion = new Companion(scene, new Vector3(3, 0, 17), eventBus);

  // === INTERACTABLES ===

  // Campfire (center, both roles interact with it eventually)
  const campfireInteractable = createCampfireInteractable(
    scene,
    INTERACTABLE_ID.WOODLINE_CAMPFIRE,
    new Vector3(0, 0, -5),
    eventBus
  );

  // Restore persistent campfire state (if lit before, keep it lit)
  const campfireLit = saveFacade.getWorldFlag<boolean>('woodline', 'campfireLit');
  if (campfireLit) {
    console.log('[WoodlineWorld] Restoring campfire lit state from save');
    campfireInteractable.setFireLit(true);
  }

  // 1. Flint pickup (boy task)
  const flintPickup = createPickupInteractable(
    scene,
    INTERACTABLE_ID.FLINT_PICKUP,
    new Vector3(-8, 0, 5),
    new Color3(0.4, 0.4, 0.45), // Gray stone
    eventBus
  );

  // 2. Field guide pickup (girl task)
  const fieldguidePickup = createPickupInteractable(
    scene,
    INTERACTABLE_ID.FIELDGUIDE_PICKUP,
    new Vector3(8, 0, 5),
    new Color3(0.6, 0.5, 0.3), // Book brown
    eventBus
  );

  // 3. Bowdrill station (girl task) - also lights campfire when used
  const bowdrillStation = createBowdrillInteractable(
    scene,
    INTERACTABLE_ID.BOWDRILL_STATION,
    new Vector3(5, 0, -8),
    new Color3(0.5, 0.35, 0.2), // Wood
    eventBus,
    campfireInteractable, // Pass reference to light fire
    INTERACTABLE_ID.WOODLINE_CAMPFIRE // Pass campfire ID for completion event
  );

  // 4. Creek gate (unlocked by campfire OR area complete) - north clearing between pines
  const creekGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.WOODLINE_CREEK_GATE,
    new Vector3(0, 0, -25), // North clearing between pine trees
    new Color3(0.4, 0.8, 0.6), // Brighter forest green
    eventBus,
    roleId
  );

  const interactables: Interactable[] = [
    campfireInteractable,
    flintPickup,
    fieldguidePickup,
    bowdrillStation,
    creekGate,
  ];

  // === PERFORMANCE OPTIMIZATIONS ===
  // Freeze static meshes and materials after world is fully setup
  if (import.meta.env.DEV) {
    // Small delay to ensure async mesh loading completes
    setTimeout(() => {
      // Freeze static environment meshes
      ground.freezeWorldMatrix();
      clearing.freezeWorldMatrix();
      trees.forEach(t => {
        if (t instanceof AbstractMesh) {
          t.freezeWorldMatrix();
        }
      });
      
      // Freeze materials that never change
      groundMat.freeze();
      clearingMat.freeze();
      
      // Log performance snapshot after optimization
      const perfSnapshot = snapshotPerf(scene);
      logPerfSnapshot('Woodline after setup', perfSnapshot);
    }, 1000);
  }

  // Dispose function
  const dispose = () => {
    // Observer cleanup now handled in individual interactable dispose methods
    if (import.meta.env.DEV) {
      console.log('[WoodlineWorld] Disposing world resources');
    }
    
    ground.dispose();
    groundMat.dispose();
    clearing.dispose();
    clearingMat.dispose();
    trees.forEach(t => {
      t.material?.dispose();
      t.dispose();
    });
    player.dispose();
    companion.dispose();
    interactables.forEach(i => i.dispose());
    hemiLight.dispose();
    dirLight.dispose();
  };

  return {
    player: player.mesh,
    playerEntity: player,
    companion,
    interactables,
    campfire: campfireInteractable,
    dispose,
  };
}

// === HELPER FACTORIES ===

function createPickupInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  eventBus: any
): Interactable & { observer?: any } {
  // Small hovering box for pickup
  const mesh = MeshBuilder.CreateBox(id, { size: 0.5 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 0.5; // Hover
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.2);
  mesh.material = mat;

  // Gentle bobbing animation
  const observer = scene.onBeforeRenderObservable.add(() => {
    if (mesh.isEnabled()) {
      mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  return {
    id,
    mesh,
    observer, // Return observer for cleanup
    interact: () => {
      eventBus.emit({ type: 'interaction/complete', targetId: id });
      mesh.setEnabled(false); // Hide after pickup
    },
    dispose: () => {
      if (observer) {
        scene.onBeforeRenderObservable.remove(observer);
      }
      mesh.dispose();
      mat.dispose();
    },
  };
}

function createCampfireInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  eventBus: any
): CampfireInteractable {
  // Stone ring (torus)
  const stoneRing = MeshBuilder.CreateTorus(id + '-ring', { 
    diameter: 2, 
    thickness: 0.3, 
    tessellation: 16 
  }, scene);
  stoneRing.position = position.clone();
  stoneRing.position.y = 0.15;
  stoneRing.rotation.x = Math.PI / 2;
  
  const stoneMat = new StandardMaterial(`${id}RingMat`, scene);
  stoneMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
  stoneRing.material = stoneMat;

  // Flame mesh (initially hidden)
  const flame = MeshBuilder.CreateCylinder(id + '-flame', {
    height: 1.5,
    diameterTop: 0.1,
    diameterBottom: 0.8,
    tessellation: 8,
  }, scene);
  flame.position = position.clone();
  flame.position.y = 1.0;
  
  const flameMat = new StandardMaterial(`${id}FlameMat`, scene);
  flameMat.diffuseColor = new Color3(1.0, 0.6, 0.2);
  flameMat.emissiveColor = new Color3(1.0, 0.5, 0.1);
  flame.material = flameMat;
  flame.setEnabled(false); // Start hidden

  // Point light (starts at 0 intensity)
  const fireLight = new PointLight(id + '-light', position.clone().add(new Vector3(0, 1.5, 0)), scene);
  fireLight.diffuse = new Color3(1.0, 0.6, 0.3);
  fireLight.intensity = 0;
  fireLight.range = 10;

  // Flame animation variables
  let isLit = false;
  const baseScale = 1.0;

  // Gentle flame flicker
  const flameObserver = scene.onBeforeRenderObservable.add(() => {
    if (isLit && flame.isEnabled()) {
      const flicker = 1.0 + Math.sin(Date.now() * 0.005) * 0.1 + Math.cos(Date.now() * 0.003) * 0.05;
      flame.scaling.y = baseScale * flicker;
    }
  });

  const setFireLit = (lit: boolean) => {
    isLit = lit;
    flame.setEnabled(lit);
    fireLight.intensity = lit ? 1.5 : 0;
    console.log('[Campfire] Fire lit:', lit);
    
    // Persist campfire state across sessions
    if (lit) {
      saveFacade.setWorldFlag('woodline', 'campfireLit', true);
    }
  };

  const getIsLit = () => isLit;

  // Main mesh for interaction target
  const mesh = stoneRing;

  return {
    id,
    mesh,
    interact: () => {
      // Only emit completion if not already lit (prevent duplicate completions)
      if (!isLit) {
        eventBus.emit({ type: 'interaction/complete', targetId: id });
        setFireLit(true); // Boy lights fire directly
      }
    },
    setFireLit,
    isLit: getIsLit,
    dispose: () => {
      if (flameObserver) {
        scene.onBeforeRenderObservable.remove(flameObserver);
      }
      stoneRing.dispose();
      stoneMat.dispose();
      flame.dispose();
      flameMat.dispose();
      fireLight.dispose();
    },
  };
}

function createBowdrillInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  eventBus: any,
  campfire: CampfireInteractable,
  campfireId: string
): Interactable {
  // Bowdrill station (simple box)
  const mesh = MeshBuilder.CreateBox(id, { width: 1.2, height: 0.6, depth: 0.8 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 0.3;
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mesh.material = mat;

  return {
    id,
    mesh,
    interact: () => {
      // Only emit completion if not already lit (prevent duplicate completions)
      if (!campfire.isLit()) {
        // Emit completion for bowdrill station itself
        eventBus.emit({ type: 'interaction/complete', targetId: id });
        // Girl lights campfire - emit campfire completion for progression symmetry
        // NOTE: Girl's tasks don't include campfire as a requirement, so this event
        // ensures UI consistency but doesn't affect progression. Area completes when
        // both girl_woodline_find_fieldguide + girl_woodline_bowdrill_fire are done.
        campfire.setFireLit(true);
        eventBus.emit({ type: 'interaction/complete', targetId: campfireId });
      }
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

/**
 * Create gate interactable to Creek world
 * Unlocks when campfire is lit OR area is complete
 */
function createGateInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  eventBus: any,
  roleId: RoleId
): Interactable {
  // Gate marker (prominent arch-like structure)
  const gateBase = MeshBuilder.CreateBox(`${id}-base`, { width: 6, height: 4, depth: 0.8 }, scene);
  gateBase.position = position.clone();
  gateBase.position.y = 2.0;
  
  const gateMat = new StandardMaterial(`${id}Mat`, scene);
  gateMat.diffuseColor = color;
  gateMat.emissiveColor = color.scale(0.3); // Add glow
  gateMat.alpha = 0.8; // Slightly more visible
  gateBase.material = gateMat;

  return {
    id,
    mesh: gateBase,
    alwaysActive: true, // Gate is always interactable (checks unlock internally)
    interact: () => {
      // Check unlock conditions: campfire lit OR area complete
      const campfireLit = saveFacade.getWorldFlag<boolean>('woodline', 'campfireLit') || false;
      const areaComplete = saveFacade.getUnlockedAreas(roleId).includes('creek');
      
      if (campfireLit || areaComplete) {
        console.log('[WoodlineGate] Unlocked - transitioning to Creek');
        eventBus.emit({ type: 'game/areaRequest', areaId: 'creek' });
      } else {
        console.log('[WoodlineGate] Locked - campfire must be lit first');
        eventBus.emit({ 
          type: 'ui/toast', 
          level: 'info', 
          message: 'The path deepens once warmth is found.' 
        });
      }
    },
    dispose: () => {
      gateBase.dispose();
      gateMat.dispose();
    },
  };
}
