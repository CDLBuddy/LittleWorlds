/**
 * BootWorld - Minimal playable scene with primitives only
 * Ground + lights + fog + camera + player capsule + companion + task interactables
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
import { Axe } from '@game/entities/props/Axe';
import { LogPile } from '@game/entities/props/LogPile';
import { Campfire } from '@game/entities/props/Campfire';
import type { RoleId } from '@game/content/areas';

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
}

export function createBootWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy'): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  campfire: Campfire;
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

  // Ground plane (increased size for companion exploration)
  const ground = MeshBuilder.CreateGround('ground', { width: 60, height: 60 }, scene);
  const groundMat = new StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3);
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // Player entity (loads role-specific model asynchronously)
  const player = new Player(scene, new Vector3(0, 0.9, 0), roleId);

  // Note: Camera is now created by GameApp's CameraRig

  // Create task interactables in triangle layout
  // Axe at (8, 0, 0)
  const axe = new Axe(scene, new Vector3(8, 0, 0), 'axe_001');
  
  // LogPile at (16, 0, 6)
  const logPile = new LogPile(scene, new Vector3(16, 0, 6), 'logpile_001');
  
  // Campfire at (24, 0, -4) - reuse or create
  const campfire = new Campfire(scene, new Vector3(24, 0, -4), 'campfire');
  
  const interactables: Interactable[] = [axe, logPile, campfire];

  // Spawn companion in visible position (front-left of player)
  const companion = new Companion(scene, new Vector3(3, 0.4, 2), eventBus);

  // Dispose function
  const dispose = () => {
    ground.dispose();
    player.dispose();
    groundMat.dispose();
    axe.dispose();
    logPile.dispose();
    campfire.dispose();
    companion.dispose();
    hemiLight.dispose();
    dirLight.dispose();
  };

  return {
    player: player.mesh,
    playerEntity: player,
    companion,
    interactables,
    campfire,
    dispose,
  };
}
