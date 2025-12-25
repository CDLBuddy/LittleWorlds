/**
 * Camera Rig - 3rd-person follow + gentle damping
 */

import { Scene, ArcRotateCamera, Vector3 } from '@babylonjs/core';

export class CameraRig {
  private camera: ArcRotateCamera;
  private targetPosition = Vector3.Zero();

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      scene
    );

    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 15;
    this.camera.wheelPrecision = 50;
  }

  update(target: Vector3, smoothing = 0.1): void {
    this.targetPosition = Vector3.Lerp(this.targetPosition, target, smoothing);
    this.camera.setTarget(this.targetPosition);
  }

  getCamera(): ArcRotateCamera {
    return this.camera;
  }

  dispose(): void {
    this.camera.dispose();
  }
}
