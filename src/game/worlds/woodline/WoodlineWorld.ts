/**
 * WoodlineWorld - Second playable area (deeper into forest)
 * Dusk/twilight lighting, campfire checkpoint, role-specific fire methods
 * Boy: flint → campfire | Girl: fieldguide → bowdrill_station
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
  Node,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Player } from '@game/entities/player/Player';
import { Companion } from '@game/entities/companion/Companion';
import type { RoleId } from '@game/content/areas';

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
}

interface CampfireInteractable extends Interactable {
  setFireLit: (lit: boolean) => void;
}

export function createWoodlineWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy'): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  campfire: CampfireInteractable;
  dispose: () => void;
} {
  // Late morning sky - bright and clear
  scene.clearColor = new Color4(0.7, 0.85, 1.0, 1.0);

  // Light fog for depth
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.75, 0.85, 0.95);
  scene.fogDensity = 0.012;

  // Bright hemispheric light (late morning sun high in sky)
  const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.8;
  hemiLight.diffuse = new Color3(1.0, 0.98, 0.92);
  hemiLight.groundColor = new Color3(0.5, 0.6, 0.5);

  // Strong directional sunlight
  const dirLight = new DirectionalLight('dirLight', new Vector3(-0.3, -2, -0.8), scene);
  dirLight.intensity = 1.0;
  dirLight.diffuse = new Color3(1.0, 0.95, 0.88);

  // Forest floor ground
  const ground = MeshBuilder.CreateGround('ground', { width: 70, height: 70 }, scene);
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
          
          // Clone the node and its children
          const instance = randomRoot.clone(`tree_${idx}`, null, true);
          
          if (instance) {
            // Reset transform to avoid inheriting Blender position
            instance.position = pos.clone();
            instance.rotation = Vector3.Zero();
            instance.scaling = new Vector3(1.5, 1.5, 1.5);
            // Random Y rotation for natural placement (0-360 degrees)
            instance.rotation.y = Math.random() * Math.PI * 2;
            instance.setEnabled(true);
            // Enable all descendants
            instance.getDescendants().forEach((desc: Node) => {
              if ('setEnabled' in desc && typeof desc.setEnabled === 'function') {
                desc.setEnabled(true);
              }
            });
            trees.push(instance);
          }
        });
      }
    }
  }, null, (_scene: Scene, message: string, exception: any) => {
    console.error('[Woodline] Failed to load trees model:', message, exception);
  });

  // Player spawn (front-center of clearing) - y=0 keeps feet on ground
  const player = new Player(scene, new Vector3(0, 0, 15), roleId);

  // Companion spawn (front-left of player)
  const companion = new Companion(scene, new Vector3(3, 0, 17), eventBus);

  // === INTERACTABLES ===

  // Campfire (center, both roles interact with it eventually)
  const campfireInteractable = createCampfireInteractable(
    scene,
    'campfire',
    new Vector3(0, 0, -5),
    eventBus
  );

  // 1. Flint pickup (boy task)
  const flintPickup = createPickupInteractable(
    scene,
    'flint_pickup',
    new Vector3(-8, 0, 5),
    new Color3(0.4, 0.4, 0.45), // Gray stone
    eventBus
  );

  // 2. Field guide pickup (girl task)
  const fieldguidePickup = createPickupInteractable(
    scene,
    'fieldguide_pickup',
    new Vector3(8, 0, 5),
    new Color3(0.6, 0.5, 0.3), // Book brown
    eventBus
  );

  // 3. Bowdrill station (girl task) - also lights campfire when used
  const bowdrillStation = createBowdrillInteractable(
    scene,
    'bowdrill_station',
    new Vector3(5, 0, -8),
    new Color3(0.5, 0.35, 0.2), // Wood
    eventBus,
    campfireInteractable // Pass reference to light fire
  );

  const interactables: Interactable[] = [
    campfireInteractable,
    flintPickup,
    fieldguidePickup,
    bowdrillStation,
  ];

  // Dispose function
  const dispose = () => {
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
): Interactable {
  // Small hovering box for pickup
  const mesh = MeshBuilder.CreateBox(id, { size: 0.5 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 0.5; // Hover
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.2);
  mesh.material = mat;

  // Gentle bobbing animation
  scene.onBeforeRenderObservable.add(() => {
    if (mesh.isEnabled()) {
      mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  return {
    id,
    mesh,
    interact: () => {
      eventBus.emit({ type: 'interaction/complete', targetId: id });
      mesh.setEnabled(false); // Hide after pickup
    },
    dispose: () => {
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
  scene.onBeforeRenderObservable.add(() => {
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
  };

  // Main mesh for interaction target
  const mesh = stoneRing;

  return {
    id,
    mesh,
    interact: () => {
      eventBus.emit({ type: 'interaction/complete', targetId: id });
      setFireLit(true); // Boy lights fire directly
    },
    setFireLit,
    dispose: () => {
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
  campfire: CampfireInteractable
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
      eventBus.emit({ type: 'interaction/complete', targetId: id });
      // Girl lights campfire indirectly via bowdrill
      campfire.setFireLit(true);
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}
