/**
 * Camera Rig - 3rd-person follow with dynamic framing modes (robust + spawn-safe)
 * -----------------------------------------------------------------------------
 * Key fixes / polish:
 * - Adds an explicit "spawn snap" API so the camera aligns with the player's spawn forward.
 * - Keeps a persistent "behind the player" reference alpha (behindAlpha) that tracks player yaw changes.
 * - Aim assist now nudges toward behindAlpha (NOT a hardcoded world alpha=0).
 * - Beta steering only during short mode transitions (and never while the user is dragging).
 * - Fewer per-frame allocations (uses temp vectors + ToRef lerps).
 * - Pointer tracking cleanup + proper observer disposal.
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

export type MoveIntent = {
  isMoving: boolean;
  forwardAmount: number; // -1 (backing) to +1 (forward)
};

interface CameraSettings {
  radius: number;
  beta: number; // Vertical angle
  alpha: number; // Horizontal angle (kept for completeness; we treat behindAlpha as the real reference)
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

  // Target offset
  targetHeightOffset?: number;
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
  // - higher beta => camera lower looking up more (up toward sky)
  private minBeta = 0.5;
  private maxBeta = Math.PI / 2 + 0.85;
  private maxZ = 10000;

  // Input tuning (lower => faster)
  private wheelPrecision = 50;
  private pinchPrecision = 12;
  private angularSensibilityX = 700;
  private angularSensibilityY = 900;

  // Smoothing
  private targetLerp = 0.12;
  private settingsLerp = 0.10;
  private teleportSnapDistance = 10;

  // Target offset - how high above player position to look at
  private targetHeightOffset = 3.0;

  // Aim assist
  private aimAssistStrength = 0.18;

  // Free-look recenter (soft pull when moving forward)
  private recenterDelayMs = 600; // wait after mouse orbit before recentering (higher = more patient)
  private recenterStrength = 0.01; // how hard we pull toward behind (lower = gentler, 0.04-0.12 range)

  // Pointer tracking
  private pointerObs: Observer<PointerInfo> | null = null;
  private failsafeObs: Observer<Scene> | null = null;
  private userIsDraggingOrbit = false;
  private lastPointerMoveMs = 0;

  // "Behind the player" reference alpha (world-space alpha for ArcRotateCamera).
  // This is what we nudge toward in aim mode and what we set on spawn snap.
  private behindAlpha = 0;

  // Temp vectors (avoid allocations)
  private readonly _tmpA = new Vector3();

  // Mode presets (adjusted to look down slightly at character)
  private readonly presets: Record<CameraMode, CameraSettings> = {
    FOLLOW: { radius: 11, beta: 1.28, alpha: 0 },
    LEAD: { radius: 17, beta: 1.36, alpha: 0 },
    CELEBRATE: { radius: 9, beta: 1.22, alpha: 0 },
  };

  // Aim overlay (optional)
  private readonly aimPreset: CameraSettings = {
    radius: 8.5,
    beta: 1.15,
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
    this.targetHeightOffset = opts.targetHeightOffset ?? this.targetHeightOffset;

    const follow = this.presets.FOLLOW;
    this.currentSettings = { ...follow };
    this.targetSettings = { ...follow };

    this.camera = new ArcRotateCamera(
      'camera',
      follow.alpha,
      follow.beta,
      follow.radius,
      Vector3.Zero(),
      scene
    );
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

    // Initialize behindAlpha to current alpha
    this.behindAlpha = this.camera.alpha;

    // Block context menu on right-click drag (clean orbit feel)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });

    this.setupPointerActivityTracking(scene);
  }

  /**
   * Call this immediately after you spawn the player (or when switching worlds)
   * so the camera aligns with the player’s spawn forward.
   *
   * - spawnForward should be the direction the player is facing INTO the world.
   * - This snaps the camera alpha so the camera sits behind the player.
   */
  snapBehindForward(spawnForward: Vector3): void {
    // Direction from target -> camera should be behind the player => -forward on XZ plane
    this._tmpA.copyFrom(spawnForward);
    this._tmpA.y = 0;
    if (this._tmpA.lengthSquared() < 1e-6) return;
    this._tmpA.normalize().scaleInPlace(-1);

    const desiredAlpha = CameraRig.alphaFromToCameraDir(this._tmpA);

    // Snap instantly (avoid inertia fighting you on first frame)
    const oldInertia = this.camera.inertia;
    this.camera.inertia = 0;
    this.camera.alpha = desiredAlpha;
    this.camera.inertia = oldInertia;

    // Update behind reference so aim assist + future smoothing align to spawn
    this.behindAlpha = desiredAlpha;

    // Also keep currentSettings.alpha coherent (even though we don’t actively blend alpha presets)
    this.currentSettings.alpha = desiredAlpha;
    this.targetSettings.alpha = desiredAlpha;

    // Give a brief transition window so beta/radius settle nicely after a hard snap
    this.modeTransitionUntilMs = Date.now() + this.modeTransitionSeconds * 1000;
  }

  setMode(mode: CameraMode): void {
    if (this.currentMode === mode) return;

    // console.log(`[CameraRig] Mode: ${this.currentMode} -> ${mode}`);
    this.currentMode = mode;
    this.targetSettings = { ...this.presets[mode] };

    // Briefly steer toward the new preset so it feels intentional,
    // then hands control back to the user.
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

  /**
   * Update camera each frame.
   *
   * @param playerPos - player world position
   * @param interestPos - optional override for look target (e.g. interact focus)
   * @param dt - delta time (seconds)
   * @param playerYawDelta - how much the player rotated this frame (radians).
   *   If provided, we rotate BOTH camera.alpha and behindAlpha so the camera keeps its relative framing.
   * @param moveIntent - player's movement state (for soft recenter logic)
   */
  update(playerPos: Vector3, interestPos?: Vector3, dt = 1 / 60, playerYawDelta = 0, moveIntent?: MoveIntent): void {
    dt = Math.min(Math.max(dt, 0), 0.05);

    // Apply player yaw to camera + behind reference (keeps "behind player" stable relative to player turns)
    if (playerYawDelta !== 0) {
      // NOTE: sign depends on your player/controller convention.
      // Your original code used alpha -= delta; we keep that behavior.
      this.camera.alpha -= playerYawDelta;
      this.behindAlpha -= playerYawDelta;
    }

    // Target smoothing - add height offset for better third-person framing
    const desiredTarget = this._tmpA;
    if (interestPos) {
      desiredTarget.copyFrom(interestPos);
    } else {
      desiredTarget.copyFrom(playerPos);
      desiredTarget.y += this.targetHeightOffset;
    }

    const distToDesired = Vector3.Distance(this.targetPosition, desiredTarget);

    if (distToDesired > this.teleportSnapDistance) {
      this.targetPosition.copyFrom(desiredTarget);
    } else {
      const t = 1 - Math.exp(-this.targetLerp * 60 * dt);
      Vector3.LerpToRef(this.targetPosition, desiredTarget, t, this.targetPosition);
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

    // We DO NOT "pull down" the user's pitch anymore.
    // We only steer beta during transition windows (and only if the user isn't dragging).
    if (isTransitioning && !this.userIsDraggingOrbit) {
      const lower = this.camera.lowerBetaLimit ?? this.minBeta;
      const upper = this.camera.upperBetaLimit ?? this.maxBeta;
      const targetBeta = Scalar.Clamp(desired.beta, lower, upper);
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
      const a = 1 - Math.exp(-this.aimAssistStrength * 60 * dt);
      this.camera.alpha = lerpAngle(this.camera.alpha, this.behindAlpha, a);
    }

    // Free-look soft recenter: when player moves forward after free-looking,
    // gently pull camera back behind them (respects player intent)
    const userRecentlyOriented = this.userIsDraggingOrbit || (now - this.lastPointerMoveMs) < this.recenterDelayMs;
    if (!this.aimMode && !userRecentlyOriented && moveIntent?.isMoving) {
      // Only recenter when moving forward enough (not backing up or strafing)
      const forward = Math.max(0, moveIntent.forwardAmount ?? 0);
      if (forward > 0.15) {
        // Strength scales with forward input so it feels "earned"
        const k = this.recenterStrength * forward;
        const a = 1 - Math.exp(-k * 60 * dt);
        this.camera.alpha = lerpAngle(this.camera.alpha, this.behindAlpha, a);
      }
    }
  }

  getCamera(): ArcRotateCamera {
    return this.camera;
  }

  /**
   * Locks/unlocks pointer inputs (useful if you're rotating camera by keyboard/controller).
   * This clears all inputs (including pointer) when locked, and restores wheel+pointers when unlocked.
   */
  lockRotation(locked: boolean): void {
    if (locked) {
      this.camera.inputs.clear();
    } else {
      // Restore common inputs. Add more here if you use gamepad/keyboard camera inputs.
      this.camera.inputs.addMouseWheel();
      this.camera.inputs.addPointers();
    }
  }

  dispose(): void {
    const scene = this.camera.getScene();

    if (this.pointerObs) {
      scene.onPointerObservable.remove(this.pointerObs);
      this.pointerObs = null;
    }

    if (this.failsafeObs) {
      scene.onBeforeRenderObservable.remove(this.failsafeObs);
      this.failsafeObs = null;
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
    this.failsafeObs = scene.onBeforeRenderObservable.add(() => {
      if (!this.userIsDraggingOrbit) return;
      const elapsed = Date.now() - this.lastPointerMoveMs;
      if (elapsed > 2500) this.userIsDraggingOrbit = false;
    });
  }

  /**
   * Given a normalized XZ direction from target -> camera, compute ArcRotateCamera alpha.
   * Alpha = 0 means camera sits on +X axis relative to target.
   */
  private static alphaFromToCameraDir(dirToCamera: Vector3): number {
    // dirToCamera should be normalized, y ignored.
    return Math.atan2(dirToCamera.z, dirToCamera.x);
  }
}
