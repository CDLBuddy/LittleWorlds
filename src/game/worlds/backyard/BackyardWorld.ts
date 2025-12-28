/**
 * BackyardWorld - First real playable area
 * Morning lighting, house, fence boundary, gate to Woodline
 * Backyard tasks: slingshot/target (boy), multitool/carve_station (girl)
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

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean; // If true, can be interacted with even without an active task
}

export function createBackyardWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy'): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  // Morning sky
  scene.clearColor = new Color4(0.85, 0.9, 1.0, 1.0);

  // Soft fog
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.85, 0.9, 1.0);
  scene.fogDensity = 0.015;

  // Morning hemispheric light
  const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.diffuse = new Color3(1.0, 0.98, 0.95);
  hemiLight.groundColor = new Color3(0.6, 0.65, 0.5);

  // Warm morning sun
  const dirLight = new DirectionalLight('dirLight', new Vector3(-0.5, -2, -1), scene);
  dirLight.intensity = 0.9;
  dirLight.diffuse = new Color3(1.0, 0.96, 0.85);

  // Large ground plane (backyard)
  const ground = MeshBuilder.CreateGround('ground', { width: 80, height: 80 }, scene);
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.45, 0.65, 0.35); // Grass
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // === HOUSE WITH DETAILS ===
  // House walls (at front of yard opposite the gate) - made longer
  const house = MeshBuilder.CreateBox('house', { width: 18, height: 6, depth: 10 }, scene);
  house.position = new Vector3(0, 3, 32);
  const houseMat = new StandardMaterial('houseMat', scene);
  houseMat.diffuseColor = new Color3(0.9, 0.85, 0.7); // Beige
  house.material = houseMat;

  // Proper gabled roof - two sloped panels meeting at peak
  const roofSlope = Math.PI / 6; // 30 degrees
  
  // Left roof panel (slopes down from peak to left edge)
  const roofLeft = MeshBuilder.CreateBox('roofLeft', { width: 6, height: 0.2, depth: 12 }, scene);
  roofLeft.position = new Vector3(-3, 7.5, 32);
  roofLeft.rotation.z = roofSlope;
  const roofMat = new StandardMaterial('roofMat', scene);
  roofMat.diffuseColor = new Color3(0.4, 0.25, 0.2); // Dark brown
  roofLeft.material = roofMat;
  
  // Right roof panel (slopes down from peak to right edge)
  const roofRight = MeshBuilder.CreateBox('roofRight', { width: 6, height: 0.2, depth: 12 }, scene);
  roofRight.position = new Vector3(3, 7.5, 32);
  roofRight.rotation.z = -roofSlope;
  roofRight.material = roofMat;

  // Windows with shutters
  const createWindow = (position: Vector3, rotateY: number = 0) => {
    // Window frame
    const windowFrame = MeshBuilder.CreateBox('windowFrame', { width: 1.5, height: 2, depth: 0.1 }, scene);
    windowFrame.position = position;
    windowFrame.rotation.y = rotateY;
    const frameMat = new StandardMaterial('frameMat', scene);
    frameMat.diffuseColor = new Color3(0.3, 0.2, 0.15); // Dark wood
    windowFrame.material = frameMat;
    
    // Window glass
    const glass = MeshBuilder.CreateBox('glass', { width: 1.2, height: 1.7, depth: 0.05 }, scene);
    glass.position = position.clone();
    if (rotateY === 0) {
      glass.position.z -= 0.05;
    } else {
      glass.position.x += rotateY > 0 ? -0.05 : 0.05;
    }
    glass.rotation.y = rotateY;
    const glassMat = new StandardMaterial('glassMat', scene);
    glassMat.diffuseColor = new Color3(0.6, 0.8, 0.9); // Light blue
    glassMat.alpha = 0.5;
    glass.material = glassMat;
    
    // Shutters positioned based on rotation
    const shutterMat = new StandardMaterial('shutterMat', scene);
    shutterMat.diffuseColor = new Color3(0.25, 0.35, 0.25); // Dark green
    
    if (rotateY === 0) {
      // Front/back windows - shutters on left/right
      const leftShutter = MeshBuilder.CreateBox('leftShutter', { width: 0.7, height: 2, depth: 0.1 }, scene);
      leftShutter.position = position.clone();
      leftShutter.position.x -= 1.2;
      leftShutter.material = shutterMat;
      
      const rightShutter = MeshBuilder.CreateBox('rightShutter', { width: 0.7, height: 2, depth: 0.1 }, scene);
      rightShutter.position = position.clone();
      rightShutter.position.x += 1.2;
      rightShutter.material = shutterMat;
    } else {
      // Side windows - shutters on front/back
      const leftShutter = MeshBuilder.CreateBox('leftShutter', { width: 0.7, height: 2, depth: 0.1 }, scene);
      leftShutter.position = position.clone();
      leftShutter.position.z -= 1.2;
      leftShutter.rotation.y = rotateY;
      leftShutter.material = shutterMat;
      
      const rightShutter = MeshBuilder.CreateBox('rightShutter', { width: 0.7, height: 2, depth: 0.1 }, scene);
      rightShutter.position = position.clone();
      rightShutter.position.z += 1.2;
      rightShutter.rotation.y = rotateY;
      rightShutter.material = shutterMat;
    }
  };

  // Front windows
  createWindow(new Vector3(-5, 4, 27.05));
  createWindow(new Vector3(5, 4, 27.05));
  
  // Side windows (rotated 90 degrees to face sides)
  createWindow(new Vector3(-8.95, 4, 32), Math.PI / 2);  // Left side
  createWindow(new Vector3(8.95, 4, 32), -Math.PI / 2);  // Right side

  // Back door (facing the backyard)
  const door = MeshBuilder.CreateBox('door', { width: 1.5, height: 3, depth: 0.1 }, scene);
  door.position = new Vector3(0, 1.5, 27.05);
  const doorMat = new StandardMaterial('doorMat', scene);
  doorMat.diffuseColor = new Color3(0.4, 0.25, 0.15); // Dark wood
  door.material = doorMat;
  
  // Door knob
  const doorKnob = MeshBuilder.CreateSphere('doorKnob', { diameter: 0.15 }, scene);
  doorKnob.position = new Vector3(0.6, 1.5, 27);
  const knobMat = new StandardMaterial('knobMat', scene);
  knobMat.diffuseColor = new Color3(0.8, 0.7, 0.3); // Brass
  doorKnob.material = knobMat;

  // === TREES ===
  const createTree = (position: Vector3, scale: number = 1) => {
    // Tree trunk
    const trunk = MeshBuilder.CreateCylinder('trunk', { 
      height: 3 * scale, 
      diameter: 0.5 * scale 
    }, scene);
    trunk.position = position.clone();
    trunk.position.y = 1.5 * scale;
    const trunkMat = new StandardMaterial('trunkMat', scene);
    trunkMat.diffuseColor = new Color3(0.4, 0.3, 0.2); // Brown
    trunk.material = trunkMat;

    // Tree foliage (sphere)
    const foliage = MeshBuilder.CreateSphere('foliage', { 
      diameter: 4 * scale 
    }, scene);
    foliage.position = position.clone();
    foliage.position.y = 3.5 * scale;
    const foliageMat = new StandardMaterial('foliageMat', scene);
    foliageMat.diffuseColor = new Color3(0.2, 0.6, 0.3); // Dark green
    foliage.material = foliageMat;

    return { trunk, foliage };
  };

  // Place trees around the yard
  createTree(new Vector3(-20, 0, 20), 1.2);
  createTree(new Vector3(18, 0, 18), 1.0);
  createTree(new Vector3(-22, 0, -10), 1.3);
  createTree(new Vector3(22, 0, -8), 1.4); // Tree with tire swing

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
  sandbox.position = new Vector3(-10, 0.15, 8);
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

  createSandboxBorder(new Vector3(-10, 0.2, 6.5), 3.2, 0.2);  // Front
  createSandboxBorder(new Vector3(-10, 0.2, 9.5), 3.2, 0.2);  // Back
  createSandboxBorder(new Vector3(-11.5, 0.2, 8), 0.2, 3.2);  // Left
  createSandboxBorder(new Vector3(-8.5, 0.2, 8), 0.2, 3.2);   // Right

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
  const fencePosts: AbstractMesh[] = [];
  const fenceColor = new Color3(0.95, 0.95, 0.95); // White
  const fenceMat = new StandardMaterial('fenceMat', scene);
  fenceMat.diffuseColor = fenceColor;

  // Helper function to create a picket fence section
  const createPicketFence = (name: string, position: Vector3, width: number, depth: number): AbstractMesh => {
    const fenceHeight = 1.5;
    const picketWidth = 0.08;
    const picketDepth = 0.05;
    const picketSpacing = 0.15;
    const railHeight = 0.08;
    
    const parent = new TransformNode(`${name}_parent`, scene);
    parent.position = position;
    
    // Determine if this is a horizontal or vertical fence
    const isHorizontal = width > depth;
    const fenceLength = isHorizontal ? width : depth;
    const numPickets = Math.floor(fenceLength / picketSpacing);
    
    // Create horizontal rails
    const topRail = MeshBuilder.CreateBox(`${name}_topRail`, { 
      width: width, 
      height: railHeight, 
      depth: depth 
    }, scene);
    topRail.position = new Vector3(0, fenceHeight - 0.2, 0);
    topRail.parent = parent;
    topRail.material = fenceMat;
    topRail.checkCollisions = true;
    
    const bottomRail = MeshBuilder.CreateBox(`${name}_bottomRail`, { 
      width: width, 
      height: railHeight, 
      depth: depth 
    }, scene);
    bottomRail.position = new Vector3(0, 0.4, 0);
    bottomRail.parent = parent;
    bottomRail.material = fenceMat;
    bottomRail.checkCollisions = true;
    
    // Create individual pickets
    for (let i = 0; i < numPickets; i++) {
      const picket = MeshBuilder.CreateBox(`${name}_picket_${i}`, { 
        width: isHorizontal ? picketWidth : picketDepth, 
        height: fenceHeight, 
        depth: isHorizontal ? picketDepth : picketWidth 
      }, scene);
      
      const offset = (i - numPickets / 2) * picketSpacing;
      if (isHorizontal) {
        picket.position = new Vector3(offset, fenceHeight / 2, 0);
      } else {
        picket.position = new Vector3(0, fenceHeight / 2, offset);
      }
      picket.parent = parent;
      picket.material = fenceMat;
      picket.checkCollisions = true;
    }
    
    // Create invisible collision box for the entire fence section
    const collisionBox = MeshBuilder.CreateBox(`${name}_collision`, {
      width: width,
      height: fenceHeight,
      depth: depth
    }, scene);
    collisionBox.position = new Vector3(0, fenceHeight / 2, 0);
    collisionBox.parent = parent;
    collisionBox.visibility = 0;
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

  // 1. Slingshot pickup (boy task)
  const slingshotPickup = createPickupInteractable(
    scene,
    'slingshot_pickup',
    new Vector3(-10, 0, 10),
    new Color3(0.6, 0.4, 0.2), // Brown
    eventBus
  );

  // 2. Backyard target (boy task)
  const backyardTarget = createTargetInteractable(
    scene,
    'backyard_target',
    new Vector3(-15, 0, -5),
    new Color3(0.9, 0.2, 0.2), // Red target
    eventBus
  );

  // 3. Multitool pickup (girl task)
  const multitoolPickup = createPickupInteractable(
    scene,
    'multitool_pickup',
    new Vector3(10, 0, 10),
    new Color3(0.5, 0.5, 0.6), // Metallic gray
    eventBus
  );

  // 4. Carve station (girl task)
  const carveStation = createWorkbenchInteractable(
    scene,
    'carve_station',
    new Vector3(15, 0, -5),
    new Color3(0.55, 0.35, 0.2), // Wood stump
    eventBus
  );

  // 5. Backyard gate (transition to woodline)
  const backyardGate = createGateInteractable(
    scene,
    'backyard_gate',
    new Vector3(0, 0, -30),
    new Color3(0.8, 0.6, 0.3), // Wood gate
    eventBus
  );

  const interactables: Interactable[] = [
    slingshotPickup,
    backyardTarget,
    multitoolPickup,
    carveStation,
    backyardGate,
  ];

  // Dispose function
  const dispose = () => {
    ground.dispose();
    groundMat.dispose();
    house.dispose();
    houseMat.dispose();
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

function createTargetInteractable(
  scene: Scene,
  id: string,
  position: Vector3,
  color: Color3,
  eventBus: any
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
      eventBus.emit({ type: 'interaction/complete', targetId: id });
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
  eventBus: any
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
      eventBus.emit({ type: 'interaction/complete', targetId: id });
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
  eventBus: any
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
