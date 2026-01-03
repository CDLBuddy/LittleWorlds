/**
 * Pine World - Forest material helper
 */

import { Color3, type Scene, StandardMaterial } from '@babylonjs/core';

export function mkMat(scene: Scene, diffuse: Color3, key: string) {
  const m = new StandardMaterial(key, scene);
  m.diffuseColor = diffuse;
  m.ambientColor = diffuse.scale(0.35);
  m.specularColor = Color3.Black();
  return m;
}
