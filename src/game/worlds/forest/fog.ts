/**
 * Forest fog - atmospheric depth for cozy 3D feel
 */

import { Scene, Color3 } from '@babylonjs/core';

export function setupForestFog(scene: Scene): void {
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.02;
  scene.fogColor = new Color3(0.8, 0.85, 0.9);
}
