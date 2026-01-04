/**
 * NightWorld - Sixth playable area (Night Stars)
 * -----------------------------------------------------------------------------
 * "Night is not empty—it's full of stars."
 * 
 * VISUAL POLISH: Deep night atmosphere (10 PM - midnight)
 * - 120×100 clearing with scattered tree clusters
 * - Accurate star chart (~200 stars, proper magnitudes)
 * - Waxing gibbous moon (75% full, silver-white glow)
 * - Deep indigo sky (not black, warmer tone)
 * - Lantern warmth (player's portable light sphere)
 * - Moon flowers, owl tree, echo pool, stargazing stone
 * - Silver moon highlights on grass/trees
 * - Constellation navigation, night botany, audio landmarks
 */

import {
  Scene,
  Color3,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  AbstractMesh,
  TransformNode,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  Mesh,
} from '@babylonjs/core';
import { Companion } from '@game/entities/companion/Companion';
import { SkySystem } from '@game/systems/sky/SkySystem';
import type { RoleId } from '@game/content/areas';
import type { WorldResult } from '../types';
import { createWorldPlayers } from '../helpers';
import { consumePendingSpawn } from '../spawnState';
import { getSpawnForWorld } from '../spawnRegistry';
import { INTERACTABLE_ID, type InteractableId } from '@game/content/interactableIds';

export const NIGHT_INTERACTABLES = [
  INTERACTABLE_ID.NIGHT_BEACH_GATE,
  INTERACTABLE_ID.NIGHT_DUSK_GATE,
] as const satisfies readonly InteractableId[];

interface Interactable {
  id: string;
  mesh: AbstractMesh;
  interact: () => void;
  dispose: () => void;
  alwaysActive?: boolean;
}

export function createNightWorld(scene: Scene, eventBus: any, roleId: RoleId = 'boy', _fromArea?: string): WorldResult & {
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
} {
  console.log('[NightWorld] Creating Night Stars world...');

  const disposers: Array<() => void> = [];
  const addDispose = (fn: () => void) => disposers.push(fn);

  // === SKY & ATMOSPHERE ===
  // Deep night sky with stars
  const skySystem = new SkySystem(scene);
  void skySystem.apply('nightstars', 0);
  addDispose(() => skySystem.dispose());

  // Enhanced night atmosphere
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0008; // Very light fog, preserves star visibility
  scene.fogColor = new Color3(0.08, 0.10, 0.18); // Deep indigo

  // === LIGHTING ===
  // Starlight (soft ambient from above)
  const starlight = new HemisphericLight('night_starlight', new Vector3(0, 1, 0), scene);
  starlight.intensity = 0.18;
  starlight.diffuse = new Color3(0.18, 0.20, 0.30); // Cool blue starlight
  starlight.groundColor = new Color3(0.08, 0.10, 0.15); // Darker ground
  addDispose(() => starlight.dispose());

  // Moonlight (waxing gibbous, 75% full, from east)
  const moonlight = new DirectionalLight('night_moon', new Vector3(-0.4, -0.8, 0.3), scene);
  moonlight.intensity = 0.25;
  moonlight.diffuse = new Color3(0.78, 0.82, 0.92); // Soft silver-white
  moonlight.specular = new Color3(0.4, 0.45, 0.5); // Subtle highlights
  addDispose(() => moonlight.dispose());

  // === TERRAIN: 120×100 clearing ===
  const clearingGround = MeshBuilder.CreateGround('night_clearing', { width: 120, height: 100, subdivisions: 4 }, scene);
  clearingGround.position.set(0, 0, 0);
  clearingGround.isPickable = true;
  clearingGround.checkCollisions = false;
  clearingGround.metadata = { walkable: true };
  
  const clearingMat = new StandardMaterial('nightClearingMat', scene);
  clearingMat.diffuseColor = new Color3(0.12, 0.18, 0.12); // Dark night grass
  clearingMat.specularColor = new Color3(0.18, 0.20, 0.24); // Silver highlights from moon
  clearingMat.ambientColor = new Color3(0.05, 0.08, 0.12); // Deep shadow
  clearingMat.emissiveColor = new Color3(0.02, 0.03, 0.05); // Barely visible glow
  clearingGround.material = clearingMat;
  addDispose(() => {
    clearingGround.dispose();
    clearingMat.dispose();
  });

  // === PLAYER & COMPANION ===
  const pending = consumePendingSpawn();
  const spawn = getSpawnForWorld('night', pending?.entryGateId);
  
  const { boyPlayer, girlPlayer } = createWorldPlayers(scene, spawn, roleId);
  
  const companion = new Companion(scene, spawn.position.clone().add(new Vector3(3, 0, 2)), eventBus);

  let currentActiveRole: RoleId = roleId;

  // === LANDMARKS & POINTS OF INTEREST ===
  const root = new TransformNode('night_root', scene);
  addDispose(() => root.dispose());

  // 1. Stargazing Stone (Center) - Flat boulder for sky viewing
  const starStone = createStargazingStone(scene, root);
  addDispose(() => starStone.dispose());

  // 2. Moon Flower Grove (-15, 0, 5) - Nocturnal blooms
  const flowerGrove = createMoonFlowerGrove(scene, root);
  addDispose(() => flowerGrove.dispose());

  // 3. Owl Tree (10, 3, -8) - Ancient hollow with owl
  const owlTree = createOwlTree(scene, root);
  addDispose(() => owlTree.dispose());

  // 4. Echo Pool (8, 0, 8) - Still water, star reflections
  const echoPool = createEchoPool(scene, root);
  addDispose(() => echoPool.dispose());

  // 5. Northern Rise (0, 2, -20) - Elevated viewing spot for Polaris
  const northernRise = createNorthernRise(scene, root);
  addDispose(() => northernRise.dispose());

  // 6. Star Chart Table (2, 0, 3) - Workbench for star chalk crafting
  const starTable = createStarChartTable(scene, root);
  addDispose(() => starTable.dispose());

  // 7. Scattered tree clusters (edge groves for deeper shadow)
  const trees = createTreeClusters(scene, root);
  addDispose(() => trees.dispose());

  // === INTERACTABLES: GATES ===
  const interactables: Interactable[] = [];

  // North gate to Beach (0, 0, -45) - Driftwood arch, moon path ahead
  const northGate = createGateInteractable(
    scene,
    root,
    INTERACTABLE_ID.NIGHT_BEACH_GATE,
    new Vector3(0, 0, -45),
    new Color3(0.78, 0.82, 0.92), // Silver moonlight
    eventBus,
    'beach',
    'ARCH' // Driftwood arch style
  );
  interactables.push(northGate);
  addDispose(() => northGate.dispose());

  // South gate back to Dusk (0, 0, 47) - Warm amber glow
  const southGate = createGateInteractable(
    scene,
    root,
    INTERACTABLE_ID.NIGHT_DUSK_GATE,
    new Vector3(0, 0, 47),
    new Color3(1.0, 0.72, 0.40), // Golden dusk glow
    eventBus,
    'dusk',
    'PILLAR' // Stone pillars style
  );
  interactables.push(southGate);
  addDispose(() => southGate.dispose());

  // === DISPOSE ===
  const dispose = () => {
    boyPlayer.dispose();
    girlPlayer.dispose();
    companion.dispose();
    
    for (let i = disposers.length - 1; i >= 0; i--) {
      try {
        disposers[i]?.();
      } catch (err) {
        console.warn('[NightWorld] dispose() error:', err);
      }
    }
  };

  return {
    // WorldResult contract implementation
    getActivePlayer: () => {
      return currentActiveRole === 'boy' ? boyPlayer : girlPlayer;
    },
    getActiveMesh: () => {
      return (currentActiveRole === 'boy' ? boyPlayer : girlPlayer).mesh;
    },
    setActiveRole: (newRoleId: RoleId) => {
      currentActiveRole = newRoleId;
      boyPlayer.setActive(newRoleId === 'boy');
      girlPlayer.setActive(newRoleId === 'girl');
    },
    boyPlayer,
    girlPlayer,
    spawnForward: spawn.forward.clone(),
    
    // Required by GameApp
    companion,
    interactables,
    dispose,
  };
}

// =============================================================================
// LANDMARKS & POINTS OF INTEREST
// =============================================================================

// 1. Stargazing Stone - Flat boulder at center for sky viewing
function createStargazingStone(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_starstone_root', scene);
  root.parent = parent;
  root.position.set(0, 0, 0);

  // Large flat boulder
  const stone = MeshBuilder.CreateCylinder('night_starstone', { height: 0.8, diameter: 5.5, tessellation: 12 }, scene);
  stone.parent = root;
  stone.position.set(0, 0.4, 0);
  stone.isPickable = false;

  const mat = new StandardMaterial('night_starstone_mat', scene);
  mat.diffuseColor = new Color3(0.35, 0.33, 0.38); // Warm stone
  mat.specularColor = new Color3(0.25, 0.27, 0.30); // Moon highlights
  mat.emissiveColor = new Color3(0.08, 0.08, 0.12); // Slight ambient from starlight
  stone.material = mat;

  return {
    dispose: () => {
      stone.dispose();
      mat.dispose();
      root.dispose();
    },
  };
}

// 2. Moon Flower Grove - Nocturnal blooms (Evening Primrose, Moonflower, Night Jasmine)
function createMoonFlowerGrove(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_flowergrove_root', scene);
  root.parent = parent;
  root.position.set(-15, 0, 5);

  const flowers: AbstractMesh[] = [];
  const materials: StandardMaterial[] = [];

  // Create 12 moon flowers in a cluster
  const flowerTypes = [
    { name: 'primrose', color: new Color3(0.98, 0.92, 0.45), glow: 0.15 }, // Yellow evening primrose
    { name: 'moonflower', color: new Color3(0.95, 0.95, 1.0), glow: 0.22 }, // White moonflower
    { name: 'jasmine', color: new Color3(0.92, 0.88, 0.82), glow: 0.12 }, // Cream jasmine
  ];

  for (let i = 0; i < 12; i++) {
    const type = flowerTypes[i % flowerTypes.length];
    const angle = (i / 12) * Math.PI * 2 + (Math.random() * 0.3);
    const radius = 1.5 + Math.random() * 1.2;
    
    const flower = MeshBuilder.CreateSphere(`night_flower_${i}`, { diameter: 0.18, segments: 8 }, scene);
    flower.parent = root;
    flower.position.set(
      Math.cos(angle) * radius,
      0.3 + Math.random() * 0.2,
      Math.sin(angle) * radius
    );
    flower.isPickable = false;

    const mat = new StandardMaterial(`night_flower_mat_${i}`, scene);
    mat.diffuseColor = type.color;
    mat.emissiveColor = type.color.scale(type.glow); // Faint glow
    mat.specularColor = new Color3(0.4, 0.4, 0.5);
    flower.material = mat;

    flowers.push(flower);
    materials.push(mat);
  }

  return {
    dispose: () => {
      flowers.forEach(f => f.dispose());
      materials.forEach(m => m.dispose());
      root.dispose();
    },
  };
}

// 3. Owl Tree - Ancient hollow tree with owl silhouette
function createOwlTree(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_owltree_root', scene);
  root.parent = parent;
  root.position.set(10, 0, -8);

  // Tree trunk (ancient, hollow)
  const trunk = MeshBuilder.CreateCylinder('night_owl_trunk', { height: 8.5, diameterTop: 1.8, diameterBottom: 2.4, tessellation: 12 }, scene);
  trunk.parent = root;
  trunk.position.set(0, 4.25, 0);
  trunk.isPickable = false;

  const trunkMat = new StandardMaterial('night_owl_trunk_mat', scene);
  trunkMat.diffuseColor = new Color3(0.18, 0.14, 0.10); // Dark bark
  trunkMat.specularColor = new Color3(0.12, 0.12, 0.14);
  trunkMat.emissiveColor = new Color3(0.02, 0.02, 0.03);
  trunk.material = trunkMat;

  // Hollow opening
  const hollow = MeshBuilder.CreateSphere('night_owl_hollow', { diameter: 1.2, segments: 10 }, scene);
  hollow.parent = root;
  hollow.position.set(0, 5.5, 0.9);
  hollow.scaling.z = 0.4; // Flatten
  hollow.isPickable = false;

  const hollowMat = new StandardMaterial('night_owl_hollow_mat', scene);
  hollowMat.diffuseColor = new Color3(0.08, 0.08, 0.10); // Deep shadow
  hollowMat.emissiveColor = new Color3(0.01, 0.01, 0.02);
  hollow.material = hollowMat;

  // Owl silhouette hint (two glowing eyes)
  const owlEyes: PointLight[] = [];
  for (let i = 0; i < 2; i++) {
    const eye = new PointLight(`night_owl_eye_${i}`, new Vector3(i === 0 ? -0.18 : 0.18, 5.6, 1.2), scene);
    eye.intensity = 0.08;
    eye.range = 2.5;
    eye.diffuse = new Color3(0.95, 0.85, 0.45); // Amber owl eyes
    eye.parent = root;
    owlEyes.push(eye);
  }

  return {
    dispose: () => {
      trunk.dispose();
      trunkMat.dispose();
      hollow.dispose();
      hollowMat.dispose();
      owlEyes.forEach(e => e.dispose());
      root.dispose();
    },
  };
}

// 4. Echo Pool - Still water with star reflections
function createEchoPool(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_echopool_root', scene);
  root.parent = parent;
  root.position.set(8, 0, 8);

  // Water surface
  const pool = MeshBuilder.CreateDisc('night_pool', { radius: 3.5, tessellation: 32 }, scene);
  pool.parent = root;
  pool.rotation.x = Math.PI / 2;
  pool.position.y = 0.05;
  pool.isPickable = false;

  const poolMat = new StandardMaterial('night_pool_mat', scene);
  poolMat.diffuseColor = new Color3(0.08, 0.12, 0.18); // Deep water
  poolMat.specularColor = new Color3(0.8, 0.85, 0.95); // Mirror-like reflection
  poolMat.emissiveColor = new Color3(0.15, 0.18, 0.25); // Starlight reflection
  poolMat.alpha = 0.85;
  pool.material = poolMat;

  return {
    dispose: () => {
      pool.dispose();
      poolMat.dispose();
      root.dispose();
    },
  };
}

// 5. Northern Rise - Elevated spot for Polaris viewing
function createNorthernRise(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_northrise_root', scene);
  root.parent = parent;
  root.position.set(0, 0, -20);

  // Gentle slope (elevated ground)
  const rise = MeshBuilder.CreateCylinder('night_rise', { height: 2, diameter: 14, tessellation: 16 }, scene);
  rise.parent = root;
  rise.position.y = 1;
  rise.isPickable = false;

  const riseMat = new StandardMaterial('night_rise_mat', scene);
  riseMat.diffuseColor = new Color3(0.14, 0.20, 0.14); // Grass
  riseMat.specularColor = new Color3(0.20, 0.22, 0.26); // Moon highlights
  riseMat.emissiveColor = new Color3(0.03, 0.04, 0.06);
  rise.material = riseMat;

  return {
    dispose: () => {
      rise.dispose();
      riseMat.dispose();
      root.dispose();
    },
  };
}

// 6. Star Chart Table - Workbench for star chalk crafting
function createStarChartTable(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_startable_root', scene);
  root.parent = parent;
  root.position.set(2, 0, 3);

  // Table surface
  const table = MeshBuilder.CreateBox('night_table', { width: 2.5, height: 0.12, depth: 1.8 }, scene);
  table.parent = root;
  table.position.y = 0.95;
  table.isPickable = false;

  const tableMat = new StandardMaterial('night_table_mat', scene);
  tableMat.diffuseColor = new Color3(0.28, 0.24, 0.18); // Weathered wood
  tableMat.specularColor = new Color3(0.15, 0.15, 0.16);
  table.material = tableMat;

  // Legs
  const legs: Mesh[] = [];
  const legPositions = [
    new Vector3(-1.0, 0.45, -0.7),
    new Vector3(1.0, 0.45, -0.7),
    new Vector3(-1.0, 0.45, 0.7),
    new Vector3(1.0, 0.45, 0.7),
  ];

  legPositions.forEach((pos, i) => {
    const leg = MeshBuilder.CreateCylinder(`night_table_leg_${i}`, { height: 0.9, diameter: 0.1 }, scene);
    leg.parent = root;
    leg.position.copyFrom(pos);
    leg.isPickable = false;
    leg.material = tableMat;
    legs.push(leg);
  });

  return {
    dispose: () => {
      table.dispose();
      legs.forEach(l => l.dispose());
      tableMat.dispose();
      root.dispose();
    },
  };
}

// 7. Tree Clusters - Scattered groves at clearing edges
function createTreeClusters(scene: Scene, parent: TransformNode) {
  const root = new TransformNode('night_trees_root', scene);
  root.parent = parent;

  const trees: AbstractMesh[] = [];
  const materials: StandardMaterial[] = [];

  // Create tree material once
  const trunkMat = new StandardMaterial('night_tree_trunk_mat', scene);
  trunkMat.diffuseColor = new Color3(0.15, 0.12, 0.10);
  trunkMat.specularColor = new Color3(0.10, 0.10, 0.12);
  trunkMat.emissiveColor = new Color3(0.02, 0.02, 0.03);
  materials.push(trunkMat);

  const canopyMat = new StandardMaterial('night_tree_canopy_mat', scene);
  canopyMat.diffuseColor = new Color3(0.08, 0.14, 0.08); // Very dark foliage
  canopyMat.specularColor = new Color3(0.15, 0.18, 0.20); // Moon highlights on leaves
  canopyMat.emissiveColor = new Color3(0.01, 0.02, 0.02);
  materials.push(canopyMat);

  // 8 tree clusters around perimeter
  const clusterPositions = [
    new Vector3(-45, 0, -35),
    new Vector3(45, 0, -35),
    new Vector3(-45, 0, 35),
    new Vector3(45, 0, 35),
    new Vector3(-50, 0, 0),
    new Vector3(50, 0, 0),
    new Vector3(0, 0, -42),
    new Vector3(0, 0, 42),
  ];

  clusterPositions.forEach((clusterPos, clusterIdx) => {
    // 3-5 trees per cluster
    const treeCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < treeCount; i++) {
      const offset = new Vector3(
        (Math.random() - 0.5) * 8,
        0,
        (Math.random() - 0.5) * 8
      );
      
      // Trunk
      const trunk = MeshBuilder.CreateCylinder(
        `night_tree_${clusterIdx}_${i}_trunk`,
        { height: 6 + Math.random() * 3, diameterTop: 0.6, diameterBottom: 0.9, tessellation: 8 },
        scene
      );
      trunk.parent = root;
      trunk.position.copyFrom(clusterPos).addInPlace(offset);
      trunk.position.y = (6 + Math.random() * 3) / 2;
      trunk.isPickable = false;
      trunk.material = trunkMat;
      trees.push(trunk);

      // Canopy
      const canopy = MeshBuilder.CreateSphere(
        `night_tree_${clusterIdx}_${i}_canopy`,
        { diameter: 5 + Math.random() * 2, segments: 8 },
        scene
      );
      canopy.parent = root;
      canopy.position.copyFrom(trunk.position);
      canopy.position.y += 3.5 + Math.random();
      canopy.isPickable = false;
      canopy.material = canopyMat;
      trees.push(canopy);
    }
  });

  return {
    dispose: () => {
      trees.forEach(t => t.dispose());
      materials.forEach(m => m.dispose());
      root.dispose();
    },
  };
}

// =============================================================================
// GATE INTERACTABLE (Visual upgrade for night atmosphere)
// =============================================================================

function createGateInteractable(
  scene: Scene,
  parent: TransformNode,
  id: InteractableId,
  position: Vector3,
  color: Color3,
  eventBus: any,
  targetArea: string,
  style: 'ARCH' | 'PILLAR'
): Interactable {
  const root = new TransformNode(`${id}_root`, scene);
  root.parent = parent;
  root.position.copyFrom(position);

  // Invisible trigger mesh
  const trigger = MeshBuilder.CreateBox(`${id}_trigger`, { width: 9, height: 4, depth: 2 }, scene);
  trigger.position.copyFrom(position);
  trigger.position.y += 2;
  trigger.isPickable = true;
  trigger.checkCollisions = false;
  trigger.visibility = 0;
  trigger.metadata = { interactable: true, id };

  const visuals: AbstractMesh[] = [];
  const visualMat = new StandardMaterial(`${id}_visual_mat`, scene);
  visualMat.diffuseColor = color.scale(0.7);
  visualMat.emissiveColor = color.scale(0.35); // Stronger glow for night visibility
  visualMat.specularColor = color.scale(0.25);

  if (style === 'ARCH') {
    // Driftwood arch style (Beach gate)
    const left = MeshBuilder.CreateCylinder(`${id}_arch_L`, { height: 5.5, diameter: 0.7, tessellation: 10 }, scene);
    left.position.copyFrom(position);
    left.position.x -= 4.0;
    left.position.y += 2.75;
    left.isPickable = false;
    left.material = visualMat;
    visuals.push(left);

    const right = left.clone(`${id}_arch_R`);
    right.position.x = position.x + 4.0;
    visuals.push(right);

    const top = MeshBuilder.CreateTorus(`${id}_arch_top`, { diameter: 9.2, thickness: 0.45, tessellation: 24 }, scene);
    top.position.copyFrom(position);
    top.position.y += 5.2;
    top.rotation.x = Math.PI / 2;
    top.isPickable = false;
    top.material = visualMat;
    visuals.push(top);
  } else {
    // Stone pillars (Dusk gate)
    const left = MeshBuilder.CreateCylinder(`${id}_pillar_L`, { height: 6.0, diameter: 1.8, tessellation: 14 }, scene);
    left.position.copyFrom(position);
    left.position.x -= 4.0;
    left.position.y += 3.0;
    left.isPickable = false;
    left.material = visualMat;
    visuals.push(left);

    const right = left.clone(`${id}_pillar_R`);
    right.position.x = position.x + 4.0;
    visuals.push(right);

    // Rune dots (subtle glow markers)
    for (let i = 0; i < 6; i++) {
      const dot = MeshBuilder.CreateSphere(`${id}_rune_${i}`, { diameter: 0.14, segments: 8 }, scene);
      dot.position.copyFrom(position);
      dot.position.x += (i < 3 ? -4.0 : 4.0);
      dot.position.y += 2.0 + (i % 3) * 0.8;
      dot.position.z += 0.95;
      dot.isPickable = false;
      dot.material = visualMat;
      visuals.push(dot);
    }
  }

  // Ground marker
  const marker = MeshBuilder.CreateDisc(`${id}_marker`, { radius: 1.8, tessellation: 24 }, scene);
  marker.position.copyFrom(position);
  marker.position.y = 0.02;
  marker.rotation.x = Math.PI / 2;
  marker.isPickable = false;

  const markerMat = new StandardMaterial(`${id}_marker_mat`, scene);
  markerMat.diffuseColor = color.scale(0.4);
  markerMat.emissiveColor = color.scale(0.18);
  markerMat.specularColor = new Color3(0, 0, 0);
  marker.material = markerMat;

  return {
    id,
    mesh: trigger,
    alwaysActive: true,
    interact: () => {
      console.log(`[NightWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea, fromGateId: id });
    },
    dispose: () => {
      trigger.dispose();
      visuals.forEach(v => v.dispose());
      visualMat.dispose();
      marker.dispose();
      markerMat.dispose();
      root.dispose();
    },
  };
}
