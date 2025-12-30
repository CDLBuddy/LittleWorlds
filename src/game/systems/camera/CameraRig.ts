/**
 * Camera Rig - 3rd-person follow with dynamic framing modes (polished)
 * -----------------------------------------------------------------------------
 * Fixes:
 * - No more "pulling pitch back down" while the player is trying to look around.
 * - Faster left/right orbit (tuned sensibility).
 * - Allows looking higher toward the sky (raised upperBetaLimit).
 *
 * Behavior:
 * - We ONLY steer beta toward preset during brief mode transitions (e.g., FOLLOW->LEAD),
 *   otherwise we respect user camera pitch/orbit.
 * - Radius still blends smoothly for framing.
 * - CELEBRATE mode does a gentle orbit then returns to FOLLOW.
 * - Optional aim mode tightens framing + gentle behind-the-player alpha assist.
 */

import {
  Scene,
  ArcRotateCamera,
  Vector3,
  Scalar,
  Observer,
  PointerInfo,
  PointerEventTypes,
} from '@babylonjs/core';
import type { CameraMode } from '@game/shared/events';
import { lerpAngle } from '@game/shared/math';

interface CameraSettings {
  radius: number;
  beta: number; // Vertical angle
  alpha: number; // Horizontal angle
}

type CameraRigOptions = {
  // Limits
  minRadius?: number;
  maxRadius?: number;
  minBeta?: number;
  maxBeta?: number;
  maxZ?: number;

  // Input tuning (Babylon: LOWER = FASTER rotation)
  wheelPrecision?: number;
  pinchPrecision?: number;
  angularSensibilityX?: number;
  angularSensibilityY?: number;

  // Follow tuning
  targetLerp?: number; // target smoothing
  settingsLerp?: number; // preset blending
  teleportSnapDistance?: number;

  // Mode transition steering
  modeTransitionSeconds?: number;

  // Celebrate
  celebrateDuration?: number;
  celebrateOrbitSpeed?: number;

  // Aim
  aimAssistStrength?: number;
};

export class CameraRig {
  private camera: ArcRotateCamera;
  private targetPosition = Vector3.Zero();

  private currentMode: CameraMode = 'FOLLOW';

  private targetSettings: CameraSettings;
  private currentSettings: CameraSettings;

  private celebrateStartTime = 0;
  private celebrateDuration = 1.0; // seconds
  private celebrateOrbitSpeed = 0.5; // rad/sec

  // Steering window (only during mode changes / scripted moments)
  private modeTransitionUntilMs = 0;
  private modeTransitionSeconds = 0.6;

  // Flags
  private userControlEnabled = true;
  private aimMode = false;

  // Limits
  private minRadius = 5;
  private maxRadius = 22;

  // Beta notes:
  // - beta ~ PI/2 is level horizon-ish
  // - lower beta => camera higher looking down
  // - higher beta => camera lower looking up more
  private minBeta = 0.5;
  private maxBeta = Math.PI / 2 + 0.85; // ⬅️ raised: lets you look up more
  private maxZ = 10000;

  // Input tuning (lower => faster)
  private wheelPrecision = 50;
  private pinchPrecision = 12;
  private angularSensibilityX = 700; // ⬅️ faster left/right than your 1200
  private angularSensibilityY = 900; // slightly slower vertical (less twitchy)

  // Smoothing
  private targetLerp = 0.12;
  private settingsLerp = 0.10;
  private teleportSnapDistance = 10;

  // Target offset - how high above player position to look at (chest/head height)
  private targetHeightOffset = 3.0;

  // Aim assist
  private aimAssistStrength = 0.18;

  // Pointer tracking
  private pointerObs: Observer<PointerInfo> | null = null;
  private userIsDraggingOrbit = false;
  private lastPointerMoveMs = 0;

  // Mode presets (adjusted to look down slightly at character)
  private readonly presets: Record<CameraMode, CameraSettings> = {
    FOLLOW: { radius: 11, beta: 1.28, alpha: 0 },     // lowered from 1.28 to angle down
    LEAD: { radius: 17, beta: 1.36, alpha: 0 },       // lowered from 1.36 to angle down
    CELEBRATE: { radius: 9, beta: 1.22, alpha: 0 },   // lowered from 1.22 to angle down
  };

  // Aim overlay (optional)
  private readonly aimPreset: CameraSettings = {
    radius: 8.5,
    beta: 1.15,                                       // lowered from 1.25 to angle down
    alpha: 0,
  };

  constructor(scene: Scene, canvas: HTMLCanvasElement, opts: CameraRigOptions = {}) {
    // Options
    this.minRadius = opts.minRadius ?? this.minRadius;
    this.maxRadius = opts.maxRadius ?? this.maxRadius;
    this.minBeta = opts.minBeta ?? this.minBeta;
    this.maxBeta = opts.maxBeta ?? this.maxBeta;
    this.maxZ = opts.maxZ ?? this.maxZ;

    this.wheelPrecision = opts.wheelPrecision ?? this.wheelPrecision;
    this.pinchPrecision = opts.pinchPrecision ?? this.pinchPrecision;
    this.angularSensibilityX = opts.angularSensibilityX ?? this.angularSensibilityX;
    this.angularSensibilityY = opts.angularSensibilityY ?? this.angularSensibilityY;

    this.targetLerp = opts.targetLerp ?? this.targetLerp;
    this.settingsLerp = opts.settingsLerp ?? this.settingsLerp;
    this.teleportSnapDistance = opts.teleportSnapDistance ?? this.teleportSnapDistance;

    this.modeTransitionSeconds = opts.modeTransitionSeconds ?? this.modeTransitionSeconds;

    this.celebrateDuration = opts.celebrateDuration ?? this.celebrateDuration;
    this.celebrateOrbitSpeed = opts.celebrateOrbitSpeed ?? this.celebrateOrbitSpeed;

    this.aimAssistStrength = opts.aimAssistStrength ?? this.aimAssistStrength;

    const follow = this.presets.FOLLOW;
    this.currentSettings = { ...follow };
    this.targetSettings = { ...follow };

    this.camera = new ArcRotateCamera('camera', follow.alpha, follow.beta, follow.radius, Vector3.Zero(), scene);
    this.camera.attachControl(canvas, true);

    // Limits
    this.camera.lowerRadiusLimit = this.minRadius;
    this.camera.upperRadiusLimit = this.maxRadius;
    this.camera.lowerBetaLimit = this.minBeta;
    this.camera.upperBetaLimit = this.maxBeta;
    this.camera.maxZ = this.maxZ;

    // 3rd-person feel: no panning
    this.camera.panningSensibility = 0;

    // Input tuning
    this.camera.wheelPrecision = this.wheelPrecision;
    this.camera.pinchPrecision = this.pinchPrecision;
    this.camera.angularSensibilityX = this.angularSensibilityX;
    this.camera.angularSensibilityY = this.angularSensibilityY;

    // Reduce drift
    this.camera.inertia = 0.2;

    // Block context menu on right-click drag (clean orbit feel)
    canvas.addEventListener(
      'contextmenu',
      (e) => e.preventDefault(),
      { passive: false }
    );

    this.setupPointerActivityTracking(scene);
  }

  setMode(mode: CameraMode): void {
    if (this.currentMode === mode) return;

    console.log(`[CameraRig] Mode: ${this.currentMode} -> ${mode}`);
    this.currentMode = mode;
    this.targetSettings = { ...this.presets[mode] };

    // Briefly steer toward the new preset so it feels intentional,
    // but then hands control back to the user.
    this.modeTransitionUntilMs = Date.now() + this.modeTransitionSeconds * 1000;

    if (mode === 'CELEBRATE') {
      this.celebrateStartTime = Date.now();
    }
  }

  setAim(enabled: boolean): void {
    if (this.aimMode === enabled) return;
    this.aimMode = enabled;

    // Nudge into a tighter feel, but still allow looking up.
    if (enabled) {
      this.camera.lowerRadiusLimit = Math.max(this.minRadius, 6);
      this.camera.upperRadiusLimit = Math.min(this.maxRadius, 14);
      this.camera.lowerBetaLimit = Math.max(this.minBeta, 0.6);
      this.camera.upperBetaLimit = Math.min(this.maxBeta, Math.PI / 2 + 0.75);
      this.camera.inertia = 0.12;
    } else {
      this.camera.lowerRadiusLimit = this.minRadius;
      this.camera.upperRadiusLimit = this.maxRadius;
      this.camera.lowerBetaLimit = this.minBeta;
      this.camera.upperBetaLimit = this.maxBeta;
      this.camera.inertia = 0.2;
    }

    // Give a short transition window so the framing tightens smoothly.
    this.modeTransitionUntilMs = Date.now() + this.modeTransitionSeconds * 1000;
  }

  setUserControlEnabled(enabled: boolean): void {
    if (this.userControlEnabled === enabled) return;
    this.userControlEnabled = enabled;

    const canvas = this.camera.getScene().getEngine().getRenderingCanvas();
    if (!canvas) return;

    if (enabled) this.camera.attachControl(canvas, true);
    else this.camera.detachControl();
  }

  update(playerPos: Vector3, interestPos?: Vector3, dt = 1 / 60, playerYawDelta = 0): void {
    dt = Math.min(Math.max(dt, 0), 0.05);

    // Apply player rotation to camera
    if (playerYawDelta !== 0) {
      this.camera.alpha -= playerYawDelta;
    }

    // Target smoothing - add height offset for better third-person framing
    const desiredTarget = interestPos ?? playerPos.clone().addInPlace(new Vector3(0, this.targetHeightOffset, 0));
    const distToDesired = Vector3.Distance(this.targetPosition, desiredTarget);

    if (distToDesired > this.teleportSnapDistance) {
      this.targetPosition.copyFrom(desiredTarget);
    } else {
      const t = 1 - Math.exp(-this.targetLerp * 60 * dt);
      this.targetPosition = Vector3.Lerp(this.targetPosition, desiredTarget, t);
    }

    this.camera.setTarget(this.targetPosition);

    // Determine desired preset (plus aim overlay)
    let desired = this.targetSettings;
    if (this.aimMode) {
      desired = {
        radius: Scalar.Lerp(this.targetSettings.radius, this.aimPreset.radius, 0.85),
        beta: Scalar.Lerp(this.targetSettings.beta, this.aimPreset.beta, 0.75),
        alpha: this.targetSettings.alpha,
      };
    }

    // Smooth preset blending (radius always; beta only during transitions)
    const s = 1 - Math.exp(-this.settingsLerp * 60 * dt);

    this.currentSettings.radius = Scalar.Lerp(this.currentSettings.radius, desired.radius, s);
    this.camera.radius = Scalar.Clamp(this.currentSettings.radius, this.minRadius, this.maxRadius);

    const now = Date.now();
    const isTransitioning = now < this.modeTransitionUntilMs;

    // ✅ KEY CHANGE:
    // We DO NOT "pull down" the user's pitch anymore.
    // We only steer beta during transition windows (and only if the user isn't dragging).
    if (isTransitioning && !this.userIsDraggingOrbit) {
      const targetBeta = Scalar.Clamp(desired.beta, this.camera.lowerBetaLimit ?? this.minBeta, this.camera.upperBetaLimit ?? this.maxBeta);
      this.camera.beta = Scalar.Clamp(Scalar.Lerp(this.camera.beta, targetBeta, s), this.minBeta, this.maxBeta);
    }

    // Celebrate mode orbit
    if (this.currentMode === 'CELEBRATE') {
      const elapsed = (now - this.celebrateStartTime) / 1000;
      if (elapsed < this.celebrateDuration) {
        this.camera.alpha += dt * this.celebrateOrbitSpeed;
      } else {
        this.setMode('FOLLOW');
      }
      return;
    }

    // Aim assist: gently center behind player if user isn't dragging
    // (Still respects pitch; only nudges yaw.)
    if (this.aimMode && !this.userIsDraggingOrbit) {
      const targetAlpha = 0;
      const a = 1 - Math.exp(-this.aimAssistStrength * 60 * dt);
      this.camera.alpha = lerpAngle(this.camera.alpha, targetAlpha, a);
    }
  }

  getCamera(): ArcRotateCamera {
    return this.camera;
  }

  lockRotation(locked: boolean): void {
    // Disable camera's input controls when keyboard rotation is active
    if (locked) {
      this.camera.inputs.clear();
    } else {
      this.camera.inputs.addMouseWheel();
      this.camera.inputs.addPointers();
    }
  }

  dispose(): void {
    if (this.pointerObs) {
      this.camera.getScene().onPointerObservable.remove(this.pointerObs);
      this.pointerObs = null;
    }
    this.camera.dispose();
  }

  private setupPointerActivityTracking(scene: Scene): void {
    this.lastPointerMoveMs = Date.now();

    this.pointerObs = scene.onPointerObservable.add((pi) => {
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        this.userIsDraggingOrbit = true;
        this.lastPointerMoveMs = Date.now();
      }

      if (pi.type === PointerEventTypes.POINTERUP) {
        this.userIsDraggingOrbit = false;
      }

      if (pi.type === PointerEventTypes.POINTERMOVE && this.userIsDraggingOrbit) {
        this.lastPointerMoveMs = Date.now();
      }
    });

    // Failsafe only (prevents “stuck dragging” edge cases)
    scene.onBeforeRenderObservable.add(() => {
      if (!this.userIsDraggingOrbit) return;
      const elapsed = Date.now() - this.lastPointerMoveMs;
      if (elapsed > 2500) this.userIsDraggingOrbit = false;
    });
  }
}
