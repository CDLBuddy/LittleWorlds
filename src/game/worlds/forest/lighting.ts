/**
 * Forest lighting - soft lighting tuned for cozy vibe
 */

import { Scene, HemisphericLight, Vector3, Color3 } from '@babylonjs/core';

export function setupForestLighting(scene: Scene): void {
  // Soft ambient light
  const light = new HemisphericLight('forestLight', new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;
  light.diffuse = new Color3(1, 0.95, 0.8);
  light.groundColor = new Color3(0.3, 0.4, 0.3);
}
