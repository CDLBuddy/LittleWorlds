/**
 * BootWorld - Minimal playable scene with primitives only
 * Ground + lights + fog + camera + player capsule
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
  ArcRotateCamera,
  AbstractMesh,
} from '@babylonjs/core';

export function createBootWorld(scene: Scene): {
  player: AbstractMesh;
  interactables: AbstractMesh[];
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

  // Ground plane
  const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, scene);
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3);
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // Player capsule
  const player = MeshBuilder.CreateCapsule(
    'player',
    { height: 1.8, radius: 0.4, tessellation: 16 },
    scene
  );
  player.position = new Vector3(0, 0.9, 0);
  
  const playerMat = new StandardMaterial('playerMat', scene);
  playerMat.diffuseColor = new Color3(0.2, 0.5, 0.9);
  playerMat.specularColor = new Color3(0.3, 0.3, 0.3);
  player.material = playerMat;

  // Camera - third person follow
  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2, // alpha (horizontal rotation)
    Math.PI / 3,  // beta (vertical angle)
    8,            // radius (distance from target)
    player.position.clone(),
    scene
  );
  
  camera.lowerBetaLimit = Math.PI / 6;
  camera.upperBetaLimit = Math.PI / 2.5;
  camera.lowerRadiusLimit = 4;
  camera.upperRadiusLimit = 12;
  camera.wheelPrecision = 100; // Disable wheel zoom for touch
  camera.attachControl(scene.getEngine().getRenderingCanvas(), false);

  // Store camera reference for later updates
  (player as any)._camera = camera;

  // Create campfire interactable (simple cylinder for now)
  const campfire = MeshBuilder.CreateCylinder(
    'campfire',
    { height: 0.5, diameter: 1.2 },
    scene
  );
  campfire.position = new Vector3(10, 0.25, 0);
  
  const campfireMat = new StandardMaterial('campfireMat', scene);
  campfireMat.diffuseColor = new Color3(0.8, 0.3, 0.1);
  campfireMat.emissiveColor = new Color3(0.4, 0.15, 0.05);
  campfire.material = campfireMat;
  
  // Start disabled (asleep)
  campfire.setEnabled(false);

  const interactables: AbstractMesh[] = [campfire];

  // Dispose function
  const dispose = () => {
    ground.dispose();
    player.dispose();
    groundMat.dispose();
    playerMat.dispose();
    campfire.dispose();
    campfireMat.dispose();
    hemiLight.dispose();
    dirLight.dispose();
    camera.dispose();
  };

  return {
    player,
    interactables,
    dispose,
  };
}
