/**
 * Pine World - Lantern station prop
 */

import { Color3, MeshBuilder, type Scene, StandardMaterial, Vector3, type Vector3 as Vec3 } from '@babylonjs/core';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';

export function createLanternStation(scene: Scene, bag: DisposableBag, mats: MaterialCache, position: Vec3) {
  // A flat stone + a little "tool scatter" cluster (purely visual)
  const baseMat = mats.get('lanternBoulderMat', () => {
    const m = new StandardMaterial('lanternBoulderMat', scene);
    m.diffuseColor = new Color3(0.52, 0.5, 0.47);
    m.ambientColor = new Color3(0.18, 0.18, 0.18);
    m.specularColor = Color3.Black();
    return m;
  });

  const base = bag.trackMesh(
    MeshBuilder.CreateBox('lantern_boulder', { width: 3.5, height: 0.7, depth: 2.4 }, scene)
  );
  base.position = position.add(new Vector3(0, 0.35, 0));
  base.material = baseMat;
  base.receiveShadows = true;

  const toolMat = mats.get('lanternToolMat', () => {
    const m = new StandardMaterial('lanternToolMat', scene);
    m.diffuseColor = new Color3(0.25, 0.25, 0.26);
    m.ambientColor = new Color3(0.12, 0.12, 0.12);
    m.specularColor = new Color3(0.25, 0.25, 0.25);
    return m;
  });

  for (let i = 0; i < 6; i++) {
    const tool = bag.trackMesh(MeshBuilder.CreateBox(`lantern_tool_${i}`, { width: 0.25, height: 0.08, depth: 0.7 }, scene));
    tool.position = position.add(new Vector3(-0.8 + i * 0.3, 0.78, -0.2 + (i % 2) * 0.25));
    tool.rotation.y = i * 0.4;
    tool.material = toolMat;
    tool.receiveShadows = true;
  }
}
