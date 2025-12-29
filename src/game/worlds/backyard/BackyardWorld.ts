/**
 * BackyardWorld - First real playable area
 * Morning lighting, house, fence boundary, gate to Woodline
 * Backyard tasks: slingshot/target (boy), multitool/carve_station (girl)
 */

import {
  Scene,
  Color3,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
  TransformNode,
  SceneLoader,
  Mesh,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { SkyMaterial } from '@babylonjs/materials';
import { Player } from '@game/entities/player/Player';
import { Companion } from '@game/entities/companion/Companion';
import type { RoleId } from '@game/content/areas';
import type { AppEvent } from '@game/shared/events';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';
import { snapshotPerf, logPerfSnapshot } from '@game/debug/perfSnapshot';

export const BACKYARD_INTERACTABLES = [
  INTERACTABLE_ID.SLINGSHOT_PICKUP,
  INTERACTABLE_ID.BACKYARD_TARGET,
  INTERACTABLE_ID.MULTITOOL_PICKUP,
  INTERACTABLE_ID.CARVE_STATION,
  INTERACTABLE_ID.BACKYARD_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean; // If true, can be interacted with even without an active task
}

export function createBackyardWorld(scene: Scene, eventBus: { emit: (event: AppEvent) => void }, roleId: RoleId = 'boy'): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
  registerDynamic?: (register: (interactable: Interactable) => void) => void;
} {
  // Clear color for sky
  scene.clearColor = new Color3(0.5, 0.7, 0.9).toColor4();

  // === PROCEDURAL SKY WITH SUNRISE ===
  const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, scene);
  const skyMaterial = new SkyMaterial('skyMaterial', scene);
  skyMaterial.backFaceCulling = false;
  
  // Enhanced sunrise atmosphere settings
  skyMaterial.turbidity = 2; // Lower = clearer sky with vibrant colors
  skyMaterial.luminance = 1.0; // Sky brightness
  skyMaterial.rayleigh = 4; // Strong atmospheric scattering for vibrant colors
  skyMaterial.mieCoefficient = 0.003; // Subtle haze
  skyMaterial.mieDirectionalG = 0.9; // Strong sun glow
  
  // Sun position for dramatic golden hour sunrise (use inclination/azimuth, not explicit position)
  skyMaterial.inclination = 0.03; // Very low = dramatic sunrise
  skyMaterial.azimuth = 0.25; // Sun position around horizon
  
  skybox.material = skyMaterial;
  skybox.infiniteDistance = true; // Make skybox render at infinite distance
  skybox.renderingGroupId = 0; // Render first
  
  // Minimal fog for clear sky visibility
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(1.0, 0.95, 0.88); // Very light warm fog
  scene.fogDensity = 0.0005; // Extremely subtle

  // Morning hemispheric light
  const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.diffuse = new Color3(1.0, 0.98, 0.95);
  hemiLight.groundColor = new Color3(0.6, 0.65, 0.5);

  // Warm morning sun
  const dirLight = new DirectionalLight('dirLight', new Vector3(-0.5, -2, -1), scene);
  dirLight.intensity = 0.9;
  dirLight.diffuse = new Color3(1.0, 0.96, 0.85);

  // Large ground plane (backyard) - visible as fallback
  const ground = MeshBuilder.CreateGround('ground', { width: 80, height: 80 }, scene);
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.45, 0.65, 0.35); // Grass
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // === GRASS MODEL ===
  // Load Summergrass.glb model - tile multiple instances instead of stretching one
  const grassParent = new TransformNode('grassParent', scene);
  grassParent.position = new Vector3(0, 0, 0);
  
  // Track grass instances for disposal
  const grassInstances: AbstractMesh[] = [];
  
  SceneLoader.ImportMesh('', 'assets/models/', 'Summergrass.glb', scene, (meshes) => {
    console.log(`[Backyard] Loaded ${meshes.length} grass meshes`);
    if (meshes.length > 0) {
      // Find the actual grass mesh (not the root)
      const grassMesh = meshes.find(m => m.name.includes('grass') || m.name.includes('Plane'));
      
      if (grassMesh) {
        console.log(`[Backyard] Using grass mesh: ${grassMesh.name}`);
        
        // Disable the template (don't render it)
        grassMesh.setEnabled(false);
        
        // Grid settings
        const gridSize = 6;
        const spacing = 13; // Size of each grass patch
        const offset = -40;
        
        // Define exclusion zones for structures
        const exclusionZones = [
          // House at (0, 0, 32)
          { centerX: 0, centerZ: 32, width: 20, depth: 12 },
          // Sandbox - aligned with grass grid at (-7.5, 5.5)
          { centerX: -7.5, centerZ: 5.5, width: 5, depth: 5 },
          // Garden at (-15, -18)
          { centerX: -15, centerZ: -18, width: 6, depth: 4 },
        ];
        
        // Helper function to check if a position is in any exclusion zone
        const isInExclusionZone = (x: number, z: number): boolean => {
          return exclusionZones.some(zone => {
            const halfWidth = zone.width / 2;
            const halfDepth = zone.depth / 2;
            return (
              x >= zone.centerX - halfWidth &&
              x <= zone.centerX + halfWidth &&
              z >= zone.centerZ - halfDepth &&
              z <= zone.centerZ + halfDepth
            );
          });
        };
        
        // Create a grid of grass instances to tile across the 80x80 backyard
        for (let x = 0; x < gridSize; x++) {
          for (let z = 0; z < gridSize; z++) {
            const posX = offset + (x * spacing) + spacing / 2;
            const posZ = offset + (z * spacing) + spacing / 2;
            
            // Skip this grass patch if it's in an exclusion zone
            if (isInExclusionZone(posX, posZ)) {
              console.log(`[Backyard] Skipping grass at (${posX.toFixed(1)}, ${posZ.toFixed(1)}) - in exclusion zone`);
              continue;
            }
            
            // Use createInstance instead of clone for better performance
            const instance = (grassMesh as Mesh).createInstance(`grass_${x}_${z}`);
            if (instance) {
              instance.position = new Vector3(posX, 0, posZ);
              instance.scaling.y = 0.6; // Reduce grass height to 60%
              instance.receiveShadows = true;
              instance.isPickable = false; // Grass is not interactive
              instance.parent = grassParent;
              grassInstances.push(instance);
            }
          }
        }
        
        // Hide the basic ground since we have grass now
        ground.visibility = 0;
        ground.setEnabled(false); // Also disable it, not just make invisible
      }
    }
  }, null, (_scene, message, exception) => {
    console.error('[Backyard] Failed to load grass model:', message, exception);
  });

  // === HOUSE MODEL ===
  // Load House.glb model
  SceneLoader.ImportMesh('', 'assets/models/', 'House.glb', scene, (meshes) => {
    if (meshes.length > 0) {
      const houseRoot = meshes[0];
      houseRoot.position = new Vector3(0, 0, 32);
      // Set checkCollisions on all meshes
      meshes.forEach(mesh => {
        mesh.checkCollisions = true;
        mesh.receiveShadows = true;
      });
    }
  }, null, (_scene, message, exception) => {
    console.error('[Backyard] Failed to load house model:', message, exception);
  });

  // === TREES AND BUSHES ===
  // Load TreesBushes.glb model and place multiple instances
  const treePositions = [
    { pos: new Vector3(-20, 0, 20), scale: 1.2 },
    { pos: new Vector3(18, 0, 18), scale: 1.0 },
    { pos: new Vector3(-22, 0, -10), scale: 1.3 },
    { pos: new Vector3(22, 0, -8), scale: 1.4 }, // Tree with tire swing
  ];

  SceneLoader.ImportMesh('', 'assets/models/', 'TreesBushes.glb', scene, (meshes) => {
    console.log('[Backyard] Loaded trees, mesh count:', meshes.length);
    
    if (meshes.length > 0) {
      // Find parent nodes that have geometry children (tree1, tree2, Plano.* etc)
      const treeRoots = meshes.filter(m => {
        const hasRootParent = m.parent?.name === '__root__';
        const hasGeometryChildren = m.getChildMeshes().some(child => child.getTotalVertices() > 0);
        return hasRootParent && hasGeometryChildren;
      });
      
      console.log('[Backyard] Found tree parent nodes:', treeRoots.length, treeRoots.map(m => m.name));
      
      if (treeRoots.length > 0) {
        // Disable originals
        treeRoots.forEach(root => {
          root.setEnabled(false);
          root.getChildMeshes().forEach(child => child.setEnabled(false));
        });
        
        // Create tree instances at specified positions with random variety
        treePositions.forEach((tree, idx) => {
          // Randomly pick a tree parent for variety
          const randomRoot = treeRoots[Math.floor(Math.random() * treeRoots.length)];
          
          // Create a new parent node at our desired position
          const newParent = new TransformNode(`tree_parent_${idx}`, scene);
          newParent.position = tree.pos.clone();
          newParent.rotation.y = Math.random() * Math.PI * 2; // Random rotation
          newParent.scaling = new Vector3(tree.scale, tree.scale, tree.scale);
          
          // Clone all children of the selected tree/bush into our new parent
          randomRoot.getChildMeshes(false).forEach((child, childIdx) => {
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
  }, null, (_scene, message, exception) => {
    console.error('[Backyard] Failed to load trees model:', message, exception);
  });

  // === TIRE SWING ===
  // Rope from tree branch to tire
  const rope = MeshBuilder.CreateCylinder('rope', { 
    height: 3.5, 
    diameter: 0.05 
  }, scene);
  rope.position = new Vector3(22, 3.5, -8);
  const ropeMat = new StandardMaterial('ropeMat', scene);
  ropeMat.diffuseColor = new Color3(0.6, 0.5, 0.4);
  rope.material = ropeMat;

  // Tire
  const tire = MeshBuilder.CreateTorus('tire', { 
    diameter: 1.5, 
    thickness: 0.3 
  }, scene);
  tire.position = new Vector3(22, 1.5, -8);
  tire.rotation.x = Math.PI / 2;
  const tireMat = new StandardMaterial('tireMat', scene);
  tireMat.diffuseColor = new Color3(0.1, 0.1, 0.1); // Black
  tire.material = tireMat;

  // === SANDBOX ===
  const sandbox = MeshBuilder.CreateBox('sandbox', { 
    width: 3, 
    height: 0.3, 
    depth: 3 
  }, scene);
  sandbox.position = new Vector3(-7.5, 0.15, 5.5);
  const sandMat = new StandardMaterial('sandMat', scene);
  sandMat.diffuseColor = new Color3(0.95, 0.85, 0.6); // Sand color
  sandbox.material = sandMat;

  // Sandbox border
  const createSandboxBorder = (pos: Vector3, width: number, depth: number) => {
    const border = MeshBuilder.CreateBox('sandboxBorder', { 
      width, 
      height: 0.4, 
      depth 
    }, scene);
    border.position = pos;
    const borderMat = new StandardMaterial('borderMat', scene);
    borderMat.diffuseColor = new Color3(0.5, 0.35, 0.2); // Wood
    border.material = borderMat;
    return border;
  };

  createSandboxBorder(new Vector3(-7.5, 0.2, 4.0), 3.2, 0.2);  // Front
  createSandboxBorder(new Vector3(-7.5, 0.2, 7.0), 3.2, 0.2);  // Back
  createSandboxBorder(new Vector3(-9.0, 0.2, 5.5), 0.2, 3.2);  // Left
  createSandboxBorder(new Vector3(-6.0, 0.2, 5.5), 0.2, 3.2);   // Right

  // === GARDEN AREA ===
  const garden = MeshBuilder.CreateBox('garden', { 
    width: 4, 
    height: 0.2, 
    depth: 2 
  }, scene);
  garden.position = new Vector3(-15, 0.1, -18);
  const gardenMat = new StandardMaterial('gardenMat', scene);
  gardenMat.diffuseColor = new Color3(0.3, 0.2, 0.15); // Dirt
  garden.material = gardenMat;

  // White picket fence boundary (4 sides)
  // PERFORMANCE: Using instancing for pickets instead of individual meshes
  const fencePosts: AbstractMesh[] = [];
  const picketInstances: AbstractMesh[] = [];
  const fenceColor = new Color3(0.95, 0.95, 0.95); // White
  const fenceMat = new StandardMaterial('fenceMat', scene);
  fenceMat.diffuseColor = fenceColor;

  // Create picket template (disabled, used for instancing only)
  const fenceHeight = 1.5;
  const picketWidth = 0.08;
  const picketDepth = 0.05;
  const picketTemplate = MeshBuilder.CreateBox('picket_template', { 
    width: picketWidth, 
    height: fenceHeight, 
    depth: picketDepth 
  }, scene);
  picketTemplate.material = fenceMat;
  picketTemplate.setEnabled(false); // Template is not rendered

  // Helper function to create a picket fence section with instancing
  const createPicketFence = (name: string, position: Vector3, width: number, depth: number): AbstractMesh => {
    const picketSpacing = 0.15;
    const railHeight = 0.08;
    
    const parent = new TransformNode(`${name}_parent`, scene);
    parent.position = position;
    
    // Determine if this is a horizontal or vertical fence
    const isHorizontal = width > depth;
    const fenceLength = isHorizontal ? width : depth;
    const numPickets = Math.floor(fenceLength / picketSpacing);
    
    // Create horizontal rails (visual only, collision handled separately)
    const topRail = MeshBuilder.CreateBox(`${name}_topRail`, { 
      width: width, 
      height: railHeight, 
      depth: depth 
    }, scene);
    topRail.position = new Vector3(0, fenceHeight - 0.2, 0);
    topRail.parent = parent;
    topRail.material = fenceMat;
    topRail.checkCollisions = false; // Rails are just visual
    
    const bottomRail = MeshBuilder.CreateBox(`${name}_bottomRail`, { 
      width: width, 
      height: railHeight, 
      depth: depth 
    }, scene);
    bottomRail.position = new Vector3(0, 0.4, 0);
    bottomRail.parent = parent;
    bottomRail.material = fenceMat;
    bottomRail.checkCollisions = false; // Rails are just visual
    
    // Create picket instances (visual only)
    for (let i = 0; i < numPickets; i++) {
      const picket = picketTemplate.createInstance(`${name}_picket_${i}`);
      
      const offset = (i - numPickets / 2) * picketSpacing;
      if (isHorizontal) {
        picket.position = new Vector3(offset, fenceHeight / 2, 0);
      } else {
        picket.position = new Vector3(0, fenceHeight / 2, offset);
        picket.rotation.y = Math.PI / 2; // Rotate for vertical fence
      }
      picket.parent = parent;
      picket.checkCollisions = false; // Pickets are just visual
      picket.isPickable = false;
      picketInstances.push(picket);
    }
    
    // Create simplified collision box for the entire fence section
    // This replaces 200+ individual colliders with just 4 boxes (one per side)
    const collisionBox = MeshBuilder.CreateBox(`${name}_collision`, {
      width: width,
      height: fenceHeight,
      depth: depth
    }, scene);
    collisionBox.position = new Vector3(0, fenceHeight / 2, 0);
    collisionBox.parent = parent;
    collisionBox.setEnabled(false); // Not visible, but still collides
    collisionBox.checkCollisions = true;
    
    return parent as unknown as AbstractMesh;
  };

  // Front fence (z = 30)
  const frontFence = createPicketFence('frontFence', 
    new Vector3(0, 0, 30), 
    60, 0.1
  );
  fencePosts.push(frontFence);

  // Left fence (x = -30)
  const leftFence = createPicketFence('leftFence',
    new Vector3(-30, 0, 0),
    0.1, 60
  );
  fencePosts.push(leftFence);

  // Right fence (x = 30)
  const rightFence = createPicketFence('rightFence',
    new Vector3(30, 0, 0),
    0.1, 60
  );
  fencePosts.push(rightFence);

  // Back fence - split for gate
  // Left section (x = -30 to -5)
  const backLeftFence = createPicketFence('backLeftFence',
    new Vector3(-17.5, 0, -30),
    25, 0.1
  );
  fencePosts.push(backLeftFence);

  // Right section (x = 5 to 30)
  const backRightFence = createPicketFence('backRightFence',
    new Vector3(17.5, 0, -30),
    25, 0.1
  );
  fencePosts.push(backRightFence);

  // Player spawn (center-front) - y position keeps feet on ground
  const player = new Player(scene, new Vector3(0, 0, 20), roleId);

  // Companion spawn (front-left of player)
  const companion = new Companion(scene, new Vector3(3, 0, 22), eventBus);

  // === INTERACTABLES ===
  const interactables: Interactable[] = [];
  
  // Reference to interaction system for dynamic registration
  let dynamicRegister: ((interactable: Interactable) => void) | null = null;

  // 1. Slingshot pickup (boy task) - Load GLB model
  SceneLoader.ImportMesh('', 'assets/models/', 'Slingshot.glb', scene, (meshes) => {
    if (meshes.length > 0) {
      const slingshotMesh = meshes[0];
      slingshotMesh.id = INTERACTABLE_ID.SLINGSHOT_PICKUP; // Set mesh id for companion targeting
      slingshotMesh.position = new Vector3(-10, 0.5, 10);
      slingshotMesh.scaling = new Vector3(1.5, 1.5, 1.5); // Increase to full size
      
      const slingshotPickup: Interactable = {
        id: INTERACTABLE_ID.SLINGSHOT_PICKUP,
        mesh: slingshotMesh,
        interact: () => {
          slingshotMesh.setEnabled(false);
          console.log('[Backyard] Picked up slingshot');
        },
        dispose: () => {
          meshes.forEach(m => m.dispose());
        },
      };
      
      // Add to interactables array after loading
      interactables.push(slingshotPickup);
      
      // If world is already active, register with interaction system
      if (dynamicRegister) {
        dynamicRegister(slingshotPickup);
      }
    }
  }, null, (_scene, message, exception) => {
    console.error('[Backyard] Failed to load slingshot model:', message, exception);
  });

  // 2. Backyard target (boy task)
  const backyardTarget = createTargetInteractable(
    scene,
    INTERACTABLE_ID.BACKYARD_TARGET,
    new Vector3(-15, 0, -5),
    new Color3(0.9, 0.2, 0.2), // Red target
    eventBus
  );

  // 3. Multitool pickup (girl task)
  const multitoolPickup = createPickupInteractable(
    scene,
    INTERACTABLE_ID.MULTITOOL_PICKUP,
    new Vector3(10, 0, 10),
    new Color3(0.5, 0.5, 0.6), // Metallic gray
    eventBus
  );

  // 4. Carve station (girl task)
  const carveStation = createWorkbenchInteractable(
    scene,
    INTERACTABLE_ID.CARVE_STATION,
    new Vector3(15, 0, -5),
    new Color3(0.55, 0.35, 0.2), // Wood stump
    eventBus
  );

  // 5. Backyard gate (transition to woodline)
  const backyardGate = createGateInteractable(
    scene,
    INTERACTABLE_ID.BACKYARD_GATE,
    new Vector3(0, 0, -30),
    new Color3(0.8, 0.6, 0.3), // Wood gate
    eventBus
  );

  // Add remaining interactables
  interactables.push(
    backyardTarget,
    multitoolPickup,
    carveStation,
    backyardGate
  );

  // === PERFORMANCE OPTIMIZATIONS ===
  // Freeze static meshes and materials after world is fully setup
  if (import.meta.env.DEV) {
    // Small delay to ensure async mesh loading completes
    setTimeout(() => {
      // Freeze static environment meshes
      skybox.freezeWorldMatrix();
      ground.freezeWorldMatrix();
      fencePosts.forEach(f => {
        if (f instanceof AbstractMesh) {
          f.freezeWorldMatrix();
        }
      });
      
      // Freeze materials that never change
      fenceMat.freeze();
      groundMat.freeze();
      skyMaterial.freeze();
      
      // Log performance snapshot after optimization
      const perfSnapshot = snapshotPerf(scene);
      logPerfSnapshot('Backyard after setup', perfSnapshot);
    }, 1000);
  }

  // Dispose function
  const dispose = () => {
    skybox.dispose();
    skyMaterial.dispose();
    ground.dispose();
    groundMat.dispose();
    grassParent.dispose();
    // Dispose instanced meshes
    grassInstances.forEach(inst => inst.dispose());
    picketInstances.forEach(inst => inst.dispose());
    picketTemplate.dispose();
    // House model is managed by scene, no need to dispose manually
    fencePosts.forEach(f => {
      f.material?.dispose();
      f.dispose();
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
    dispose,
    // Method to register late-loading interactables
    registerDynamic: (register: (interactable: Interactable) => void) => {
      dynamicRegister = register;
    },
  };
}

// === HELPER FACTORIES ===

function createPickupInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  _eventBus: { emit: (event: AppEvent) => void }
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
      // eventBus.emit({ type: 'interaction/complete', targetId: id }); // TODO: Add to AppEvent type
      mesh.setEnabled(false); // Hide after pickup
      console.log(`[Backyard] Picked up ${id}`);
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

function createTargetInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  _eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  // Cylinder target (upright)
  const mesh = MeshBuilder.CreateCylinder(id, { height: 2, diameter: 1 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 1; // Half height
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mesh.material = mat;

  return {
    id,
    mesh,
    interact: () => {
      // eventBus.emit({ type: 'interaction/complete', targetId: id }); // TODO: Add to AppEvent type
      console.log(`[Backyard] Hit target: ${id}`);
      // Target remains enabled (can be hit multiple times if needed)
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

function createWorkbenchInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  _eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  // Box workbench/stump
  const mesh = MeshBuilder.CreateBox(id, { width: 1.5, height: 0.8, depth: 1.2 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 0.4; // Half height
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mesh.material = mat;

  return {
    id,
    mesh,
    interact: () => {
      // eventBus.emit({ type: 'interaction/complete', targetId: id }); // TODO: Add to AppEvent type
      console.log(`[Backyard] Used workbench: ${id}`);
      // Workbench remains enabled
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}

function createGateInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  eventBus: { emit: (event: AppEvent) => void }
): Interactable {
  // Simple gate (tall box)
  const mesh = MeshBuilder.CreateBox(id, { width: 10, height: 2, depth: 0.3 }, scene);
  mesh.position = position.clone();
  mesh.position.y = 1; // Half height
  
  const mat = new StandardMaterial(`${id}Mat`, scene);
  mat.diffuseColor = color;
  mat.emissiveColor = color.scale(0.15);
  mesh.material = mat;

  return {
    id,
    mesh,
    alwaysActive: true, // Gates are always interactable, not tied to tasks
    interact: () => {
      // Emit area request - GameApp will handle gating
      eventBus.emit({ type: 'game/areaRequest', areaId: 'woodline' });
    },
    dispose: () => {
      mesh.dispose();
      mat.dispose();
    },
  };
}
