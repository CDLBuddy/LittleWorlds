/**
 * Camera Rig - 3rd-person follow with dynamic framing modes
 * FOLLOW: comfortable close follow
 * LEAD: zoom out when companion is leading to show more world
 * CELEBRATE: slight zoom in with gentle orbit
 */

import { Scene, ArcRotateCamera, Vector3 } from '@babylonjs/core';
import type { CameraMode } from '@game/shared/events';

interface CameraSettings {
  radius: number;
  beta: number; // Vertical angle
  alpha: number; // Horizontal angle
}

export class CameraRig {
  private camera: ArcRotateCamera;
  private targetPosition = Vector3.Zero();
  private currentMode: CameraMode = 'FOLLOW';
  private targetSettings: CameraSettings;
  private currentSettings: CameraSettings;
  private celebrateStartTime = 0;
  private celebrateDuration = 1.0; // seconds
  
  // Mode presets
  private readonly presets: Record<CameraMode, CameraSettings> = {
    FOLLOW: { radius: 11, beta: Math.PI / 3, alpha: 0 },
    LEAD: { radius: 17, beta: Math.PI / 2.5, alpha: 0 }, // Higher angle, farther back
    CELEBRATE: { radius: 9, beta: Math.PI / 3.2, alpha: 0 },
  };

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new ArcRotateCamera(
      'camera',
      0, // Horizontal angle: 0 = camera behind character looking forward
      Math.PI / 3, // Vertical angle (comfortable 3rd person view)
      11, // Distance
      Vector3.Zero(),
      scene
    );

    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 5;
    this.camera.upperRadiusLimit = 20;
    this.camera.wheelPrecision = 50;
    this.camera.panningSensibility = 0; // Disable panning for now
    this.camera.maxZ = 10000; // Increase far clip plane to see skybox
    
    // Vertical rotation limits (beta: 0 = straight down, PI/2 = horizontal, PI = straight up from below)
    this.camera.lowerBetaLimit = 0.5; // Prevent looking too far down
    this.camera.upperBetaLimit = Math.PI / 2 + 0.4; // Allow looking up above horizontal
    
    // Initialize current settings
    const follow = this.presets.FOLLOW;
    this.currentSettings = { ...follow };
    this.targetSettings = { ...follow };
  }

  setMode(mode: CameraMode): void {
    if (this.currentMode === mode) return;
    
    console.log(`[CameraRig] Mode: ${this.currentMode} -> ${mode}`);
    this.currentMode = mode;
    this.targetSettings = { ...this.presets[mode] };
    
    if (mode === 'CELEBRATE') {
      this.celebrateStartTime = Date.now();
    }
  }

  update(playerPos: Vector3, interestPos?: Vector3, dt?: number): void {
    // Smooth target position
    const targetPos = interestPos || playerPos;
    this.targetPosition = Vector3.Lerp(this.targetPosition, targetPos, 0.1);
    this.camera.setTarget(this.targetPosition);
    
    // Smooth camera settings transitions (only radius, let user control beta/alpha)
    const smoothing = 0.05; // Lower = smoother
    this.currentSettings.radius += (this.targetSettings.radius - this.currentSettings.radius) * smoothing;
    
    // Apply radius
    this.camera.radius = this.currentSettings.radius;
    
    // User can freely control beta (vertical) and alpha (horizontal) with mouse
    
    // Celebrate mode: gentle orbit
    if (this.currentMode === 'CELEBRATE' && dt) {
      const elapsed = (Date.now() - this.celebrateStartTime) / 1000;
      if (elapsed < this.celebrateDuration) {
        this.camera.alpha += dt * 0.5; // Slow rotation
      } else {
        // Auto-return to FOLLOW after celebration
        this.setMode('FOLLOW');
      }
    }
  }

  getCamera(): ArcRotateCamera {
    return this.camera;
  }

  dispose(): void {
    this.camera.dispose();
  }
}
