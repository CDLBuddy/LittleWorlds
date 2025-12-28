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

  // House marker (simple box at back)
  const house = MeshBuilder.CreateBox('house', { width: 12, height: 6, depth: 8 }, scene);
  house.position = new Vector3(0, 3, -30);
  const houseMat = new StandardMaterial('houseMat', scene);
  houseMat.diffuseColor = new Color3(0.9, 0.85, 0.7); // Beige
  house.material = houseMat;

  // White picket fence boundary (4 sides)
  const fencePosts: AbstractMesh[] = [];
  const fenceHeight = 1.5;
  const fenceThickness = 0.1;
  const fenceColor = new Color3(0.95, 0.95, 0.95); // White

  // Front fence (z = 30)
  const frontFence = MeshBuilder.CreateBox('frontFence', { width: 60, height: fenceHeight, depth: fenceThickness }, scene);
  frontFence.position = new Vector3(0, fenceHeight / 2, 30);
  const frontFenceMat = new StandardMaterial('frontFenceMat', scene);
  frontFenceMat.diffuseColor = fenceColor;
  frontFence.material = frontFenceMat;
  fencePosts.push(frontFence);

  // Left fence (x = -30)
  const leftFence = MeshBuilder.CreateBox('leftFence', { width: fenceThickness, height: fenceHeight, depth: 60 }, scene);
  leftFence.position = new Vector3(-30, fenceHeight / 2, 0);
  const leftFenceMat = new StandardMaterial('leftFenceMat', scene);
  leftFenceMat.diffuseColor = fenceColor;
  leftFence.material = leftFenceMat;
  fencePosts.push(leftFence);

  // Right fence (x = 30)
  const rightFence = MeshBuilder.CreateBox('rightFence', { width: fenceThickness, height: fenceHeight, depth: 60 }, scene);
  rightFence.position = new Vector3(30, fenceHeight / 2, 0);
  const rightFenceMat = new StandardMaterial('rightFenceMat', scene);
  rightFenceMat.diffuseColor = fenceColor;
  rightFence.material = rightFenceMat;
  fencePosts.push(rightFence);

  // Back fence - split for gate
  // Left section (x = -30 to -5)
  const backLeftFence = MeshBuilder.CreateBox('backLeftFence', { width: 25, height: fenceHeight, depth: fenceThickness }, scene);
  backLeftFence.position = new Vector3(-17.5, fenceHeight / 2, -30);
  const backLeftFenceMat = new StandardMaterial('backLeftFenceMat', scene);
  backLeftFenceMat.diffuseColor = fenceColor;
  backLeftFence.material = backLeftFenceMat;
  fencePosts.push(backLeftFence);

  // Right section (x = 5 to 30)
  const backRightFence = MeshBuilder.CreateBox('backRightFence', { width: 25, height: fenceHeight, depth: fenceThickness }, scene);
  backRightFence.position = new Vector3(17.5, fenceHeight / 2, -30);
  const backRightFenceMat = new StandardMaterial('backRightFenceMat', scene);
  backRightFenceMat.diffuseColor = fenceColor;
  backRightFence.material = backRightFenceMat;
  fencePosts.push(backRightFence);

  // Player spawn (center-front)
  const player = new Player(scene, new Vector3(0, 0.9, 20), roleId);

  // Companion spawn (front-left of player)
  const companion = new Companion(scene, new Vector3(3, 0.4, 22), eventBus);

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
