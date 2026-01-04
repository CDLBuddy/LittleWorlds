import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
} from '@babylonjs/core';
import type { AbstractMesh } from '@babylonjs/core';
import type { Interactable, InteractableId } from '../types';

export function createPillarGate(
  scene: Scene,
  parent: TransformNode,
  id: InteractableId,
  position: Vector3,
  color: Color3,
  eventBus: any,
  targetArea: string,
  opts: { style: 'MOON' | 'PINE' }
): Interactable {
  // We keep an invisible pickable trigger mesh (reliable interaction),
  // but visually show stone pillars (moon phases to night, earthy to pine).

  const root = new TransformNode(`${id}_root`, scene);
  root.parent = parent;
  root.position.copyFrom(position);

  // Invisible trigger - NOT parented to root to avoid transform computation issues
  const trigger = MeshBuilder.CreateBox(`${id}_trigger`, { width: 9, height: 4, depth: 2 }, scene);
  trigger.position.copyFrom(position); // Use root's position
  trigger.position.y += 2; // Offset 2 units up
  trigger.isPickable = true;
  trigger.checkCollisions = false;
  trigger.visibility = 0; // invisible
  trigger.metadata = { interactable: true, id };

  // Pillars
  const pillarMat = new StandardMaterial(`${id}_pillar_mat`, scene);
  pillarMat.diffuseColor = new Color3(0.28, 0.26, 0.30);
  pillarMat.emissiveColor = color.scale(0.08);
  pillarMat.specularColor = new Color3(0.08, 0.08, 0.08);

  const pillarL = MeshBuilder.CreateCylinder(`${id}_pillar_l`, { height: 4.4, diameter: 1.1, tessellation: 10 }, scene);
  pillarL.parent = root;
  pillarL.position.set(-3.8, 2.2, 0);
  pillarL.material = pillarMat;
  pillarL.isPickable = false;

  const pillarR = MeshBuilder.CreateCylinder(`${id}_pillar_r`, { height: 4.4, diameter: 1.1, tessellation: 10 }, scene);
  pillarR.parent = root;
  pillarR.position.set(3.8, 2.2, 0);
  pillarR.material = pillarMat;
  pillarR.isPickable = false;

  // "Carvings" / runes
  const runeMat = new StandardMaterial(`${id}_rune_mat`, scene);
  runeMat.diffuseColor = color.scale(0.5);
  runeMat.emissiveColor = color.scale(0.6);
  runeMat.specularColor = new Color3(0, 0, 0);

  const makeRune = (name: string, x: number, y: number, z: number, s: number) => {
    const r = MeshBuilder.CreateDisc(name, { radius: s, tessellation: 18 }, scene);
    r.parent = root;
    r.position.set(x, y, z);
    r.rotation.x = Math.PI / 2; // face forward-ish (we'll tilt)
    r.rotation.z = Math.PI / 2;
    r.material = runeMat;
    r.isPickable = false;
    return r;
  };

  const runes: AbstractMesh[] = [];

  if (opts.style === 'MOON') {
    // Moon phase vibe: 3 discs on each pillar
    runes.push(makeRune(`${id}_moon_1`, -3.8, 3.3, 0.62, 0.22));
    runes.push(makeRune(`${id}_moon_2`, -3.8, 2.6, 0.62, 0.18));
    runes.push(makeRune(`${id}_moon_3`, -3.8, 1.9, 0.62, 0.14));

    runes.push(makeRune(`${id}_moon_4`, 3.8, 3.3, 0.62, 0.14));
    runes.push(makeRune(`${id}_moon_5`, 3.8, 2.6, 0.62, 0.18));
    runes.push(makeRune(`${id}_moon_6`, 3.8, 1.9, 0.62, 0.22));
  } else {
    // Pine return vibe: fewer runes, earthier glow
    runeMat.emissiveColor = color.scale(0.35);
    runes.push(makeRune(`${id}_pine_1`, -3.8, 2.9, 0.62, 0.20));
    runes.push(makeRune(`${id}_pine_2`, 3.8, 2.2, 0.62, 0.20));
  }

  // A subtle "threshold" bar between pillars
  const bar = MeshBuilder.CreateBox(`${id}_bar`, { width: 8.0, height: 0.22, depth: 0.22 }, scene);
  bar.parent = root;
  bar.position.set(0, 3.95, 0);
  bar.isPickable = false;
  bar.material = pillarMat;

  // Small ground marker (lantern post feel near north gate)
  const marker = MeshBuilder.CreateDisc(`${id}_marker`, { radius: 1.35, tessellation: 24 }, scene);
  marker.parent = root;
  marker.position.set(0, 0.02, 0);
  marker.rotation.x = Math.PI / 2;
  marker.isPickable = false;

  const markerMat = new StandardMaterial(`${id}_marker_mat`, scene);
  markerMat.diffuseColor = new Color3(0.18, 0.16, 0.22);
  markerMat.emissiveColor = color.scale(0.12);
  markerMat.specularColor = new Color3(0, 0, 0);
  marker.material = markerMat;

  return {
    id,
    mesh: trigger,
    alwaysActive: true,
    interact: () => {
      console.log(`[DuskWorld] Gate ${id} activated → ${targetArea}`);
      eventBus.emit({ type: 'game/areaRequest', areaId: targetArea, fromGateId: id });
    },
    dispose: () => {
      trigger.dispose();
      marker.dispose();
      markerMat.dispose();

      bar.dispose();
      for (const r of runes) r.dispose();

      pillarL.dispose();
      pillarR.dispose();
      pillarMat.dispose();
      runeMat.dispose();

      root.dispose();
    },
  };
}
