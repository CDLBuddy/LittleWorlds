/**
 * PlayerController
 * -----------------------------------------------------------------------------
 * Hybrid controller: click/tap-to-move + direct WASD/virtual-joystick + mouse-look.
 *
 * Desktop (default):
 * - Click/Tap ground: set move target (arrive + smooth turn)
 * - WASD: direct movement (accel/decel). Clears click target while active.
 * - Right Mouse (hold) OR PointerLock: mouse-look (yaw/pitch). Movement becomes camera-facing.
 * - Space: jump (simple gravity + ground snapping)
 * - E: interact (fires optional handler)
 * - Left Click while pointer-locked: primary action (fires optional handler) (ex: slingshot)
 *
 * Touch (basic, no UI):
 * - One finger tap: click-to-move
 * - Two touches: left touch = movement joystick, right touch = look joystick
 *
 * Notes:
 * - Walkable surfaces: mesh.name === 'ground' OR mesh.metadata?.walkable === true
 * - Collision: lightweight ray-based “poor man’s capsule” sweep in XZ plane
 * - Grounding: downward raycast to walkable surfaces; jump uses vertical velocity + gravity
 */

import {
  Scene,
  Vector3,
  Observer,
  PointerInfo,
  PointerEventTypes,
  TransformNode,
  Ray,
  KeyboardInfo,
  KeyboardEventTypes,
  Scalar,
  AbstractMesh,
  PickingInfo,
  Engine,
} from '@babylonjs/core';
import { lerpAngle } from '@game/shared/math';
import { Player } from './Player';

type InputMode = 'auto' | 'click' | 'direct';

type ActionHandlers = {
  /** E / tap-interact / “use” */
  onInteract?: (hit: PickingInfo | null) => void;
  /** Primary action (LMB while aiming) */
  onPrimary?: (hit: PickingInfo | null) => void;
  /** Secondary action (optional) */
  onSecondary?: (hit: PickingInfo | null) => void;
  /** Called when look yaw/pitch updates (useful for cameras) */
  onLook?: (yaw: number, pitch: number) => void;
};

type ControllerOptions = {
  inputMode?: InputMode;
  /** Player visual/feet height above ground hit-point */
  playerHeight?: number;
  /** Collision radius in world units */
  collisionRadius?: number;
  /** Interaction range for E / interact rays */
  interactRange?: number;

  // Movement tuning
  maxSpeed?: number;
  acceleration?: number;
  deceleration?: number;
  stopDistance?: number;
  arriveRadius?: number;
  turnSmoothness?: number;

  // Jump/Gravity
  gravity?: number; // negative
  jumpSpeed?: number;

  // Look
  mouseSensitivity?: number;
  touchLookSensitivity?: number;
  pitchMin?: number;
  pitchMax?: number;

  // Click-to-move behavior
  allowDragRetarget?: boolean;
};

export class PlayerController {
  private playerEntity: Player | null = null;

  // Mode + state
  private enabled = true;
  private inputMode: InputMode = 'auto';

  // Click-to-move
  private targetPosition: Vector3 | null = null;

  // Direct movement
  private velocity = Vector3.Zero();
  private currentYaw = 0;
  private lastYaw = 0; // Track last frame yaw for delta calculation

  // Vertical / jump
  private verticalVelocity = 0;
  private grounded = false;

  // Look
  private lookYaw = 0;
  private lookPitch = 0;
  private pointerLocked = false;
  private aiming = false; // RMB hold or pointerlock
  private actions: ActionHandlers = {};

  // Movement parameters
  private maxSpeed = 6.0;
  private acceleration = 18.0;
  private deceleration = 22.0;
  private stopDistance = 0.25;
  private arriveRadius = 2.0;
  private turnSmoothness = 12.0;

  // Jump/Gravity
  private gravity = -24.0;
  private jumpSpeed = 8.0;

  // Collision + grounding
  private playerHeight = 0.5;
  private collisionRadius = 0.4;

  // Interaction
  private interactRange = 3.0;

  // Look tuning
  private mouseSensitivity = 0.0022;
  private touchLookSensitivity = 0.008;
  private pitchMin = -1.1;
  private pitchMax = 0.9;

  private allowDragRetarget = true;

  // Input tracking
  private keysDown = new Map<string, boolean>();
  private jumpQueued = false;

  // Observers/listeners
  private pointerObserver: Observer<PointerInfo> | null = null;
  private keyboardObserver: Observer<KeyboardInfo> | null = null;

  // Canvas / pointer lock
  private engine: Engine;
  private canvas: HTMLCanvasElement | null;



  // Touch joystick (no UI; “two-touch split”)
  private touchMoveId: number | null = null;
  private touchLookId: number | null = null;
  private touchMoveStart = new Vector3(0, 0, 0); // x,y used
  private touchLookStart = new Vector3(0, 0, 0);
  private touchMoveVec = new Vector3(0, 0, 0); // x,z used as axes
  private touchLookVec = new Vector3(0, 0, 0); // x,y used as look deltas
  private touchDeadzone = 12; // pixels
  private touchMax = 80; // pixels

  // Scratch vectors to reduce GC
  private v3a = new Vector3();
  private v3b = new Vector3();
  private v3c = new Vector3();

  constructor(private scene: Scene, private player: TransformNode, opts: ControllerOptions = {}) {
    this.engine = this.scene.getEngine() as Engine;
    this.canvas = this.engine.getRenderingCanvas();

    // console.log('[PlayerController] Constructing controller:', {
    //   playerName: player.name,
    //   sceneId: scene.uid,
    //   canvas: !!this.canvas
    // });

    if (!this.canvas) {
      console.error('[PlayerController] No canvas found! Controller will not work. This may be React Strict Mode double-render.');
      // Don't setup observers without a canvas
      return;
    }

    this.inputMode = opts.inputMode ?? this.inputMode;

    this.playerHeight = opts.playerHeight ?? this.playerHeight;
    this.collisionRadius = opts.collisionRadius ?? this.collisionRadius;
    this.interactRange = opts.interactRange ?? this.interactRange;

    this.maxSpeed = opts.maxSpeed ?? this.maxSpeed;
    this.acceleration = opts.acceleration ?? this.acceleration;
    this.deceleration = opts.deceleration ?? this.deceleration;
    this.stopDistance = opts.stopDistance ?? this.stopDistance;
    this.arriveRadius = opts.arriveRadius ?? this.arriveRadius;
    this.turnSmoothness = opts.turnSmoothness ?? this.turnSmoothness;

    this.gravity = opts.gravity ?? this.gravity;
    this.jumpSpeed = opts.jumpSpeed ?? this.jumpSpeed;

    this.mouseSensitivity = opts.mouseSensitivity ?? this.mouseSensitivity;
    this.touchLookSensitivity = opts.touchLookSensitivity ?? this.touchLookSensitivity;
    this.pitchMin = opts.pitchMin ?? this.pitchMin;
    this.pitchMax = opts.pitchMax ?? this.pitchMax;

    this.allowDragRetarget = opts.allowDragRetarget ?? this.allowDragRetarget;

    this.currentYaw = this.player.rotation.y;
    this.lookYaw = this.currentYaw;

    this.setupPointerObserver();
    this.setupKeyboardObserver();
    this.setupPointerLockTracking();
    
    // console.log('[PlayerController] Controller initialized, enabled:', this.enabled);
  }

  public setPlayerEntity(player: Player): void {
    this.playerEntity = player;
    // Update the controlled mesh reference
    this.player = player.mesh;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.targetPosition = null;
      this.velocity.scaleInPlace(0);
      this.keysDown.clear();
      this.jumpQueued = false;
      this.aiming = false;
      this.exitPointerLock();
    }
  }

  public setInputMode(mode: InputMode): void {
    this.inputMode = mode;
    if (mode === 'click') {
      // Don’t keep stale direct-move velocity
      this.velocity.scaleInPlace(0);
    } else if (mode === 'direct') {
      // Don’t keep stale click target
      this.targetPosition = null;
    }
  }

  public setActionHandlers(handlers: ActionHandlers): void {
    this.actions = handlers;
  }

  public getLookAngles(): { yaw: number; pitch: number } {
    return { yaw: this.lookYaw, pitch: this.lookPitch };
  }

  public getYawDelta(): number {
    const delta = this.currentYaw - this.lastYaw;
    this.lastYaw = this.currentYaw;
    return delta;
  }
  
  /**
   * Reset yaw baseline to prevent stale delta on world load.
   * Call this after world swap / spawn to ensure first frame delta = 0.
   */
  public resetYawBaseline(): void {
    this.lastYaw = this.currentYaw;
  }

  /**
   * Get player's movement intent for camera recenter logic.
   * Returns forward amount: +1 = W key, -1 = S key, 0 = no input.
   */
  public getMoveIntent(): { isMoving: boolean; forwardAmount: number } {
    const k = this.getKeyboardAxes();
    const t = this.getTouchMoveAxes();
    // Use keyboard if present, otherwise touch
    const forwardAmount = k.x !== 0 || k.y !== 0 ? k.y : t.y;
    const isMoving = Math.abs(forwardAmount) > 0.05 || this.velocity.length() > 0.1;
    return { isMoving, forwardAmount };
  }

  // ---- Input + picking helpers ------------------------------------------------

  private isWalkableMesh(mesh: AbstractMesh): boolean {
    const walkable = mesh.metadata as { walkable?: boolean } | null | undefined;
    return mesh.name === 'ground' || walkable?.walkable === true;
  }

  private pickWalkableAtScreen(x: number, y: number): PickingInfo | null {
    const ray = this.scene.createPickingRay(x, y, null, null);
    const hit = this.scene.pickWithRay(ray, (m) => this.isWalkableMesh(m));
    return hit ?? null;
  }

  private pickInteractableFromView(): PickingInfo | null {
    const cam = this.scene.activeCamera;
    if (!cam) return null;

    // Prefer center-screen aim while aiming/pointerlocked; otherwise use pointer position
    if (this.pointerLocked || this.aiming) {
      const ray = cam.getForwardRay(this.interactRange);
      const hit = this.scene.pickWithRay(ray, (m) => {
        if (!m.isPickable) return false;
        if (this.isWalkableMesh(m)) return false;
        // Heuristic: interactables typically have metadata or are non-walkable & close.
        return true;
      });
      return hit ?? null;
    }

    // Non-aim mode: use current pointer position if available
    const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, null, cam);
    const hit = this.scene.pickWithRay(ray, (m) => {
      if (!m.isPickable) return false;
      if (this.isWalkableMesh(m)) return false;
      return true;
    });
    return hit ?? null;
  }

  private setupPointerLockTracking(): void {
    if (!this.canvas) return;

    const onChange = () => {
      const doc = document as unknown as { pointerLockElement?: Element | null };
      this.pointerLocked = !!doc.pointerLockElement;
      if (!this.pointerLocked) this.aiming = false;
    };

    document.addEventListener('pointerlockchange', onChange, { passive: true });
  }

  private requestPointerLock(): void {
    if (!this.canvas) return;
    // Babylon engine helpers exist, but canvas API is universal.
    if (this.canvas.requestPointerLock) void this.canvas.requestPointerLock();
  }

  private exitPointerLock(): void {
    if (document.exitPointerLock) document.exitPointerLock();
  }

  private setupKeyboardObserver(): void {
    // console.log('[PlayerController] Setting up keyboard observer on scene', this.scene.uid);
    
    // Try Babylon's keyboard observable first
    this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (!this.enabled) {
        // console.log('[PlayerController] Keyboard event but controller disabled');
        return;
      }

      const ev = kbInfo.event;
      const key = (ev.key || '').toLowerCase();

      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        this.keysDown.set(key, true);

        // Jump
        if (key === ' ' || key === 'space') {
          this.jumpQueued = true;
          ev.preventDefault?.();
        }

        // Interact
        if (key === 'e') {
          const hit = this.pickInteractableFromView();
          this.actions.onInteract?.(hit);
        }

        // Primary/secondary actions (useful for “tool mode”)
        if (key === 'f') {
          const hit = this.pickInteractableFromView();
          this.actions.onPrimary?.(hit);
        }
        if (key === 'q') {
          const hit = this.pickInteractableFromView();
          this.actions.onSecondary?.(hit);
        }

        // Toggle pointer lock (optional convenience)
        if (key === 'l') {
          if (this.pointerLocked) this.exitPointerLock();
          else this.requestPointerLock();
        }

        // Toggle control mode (optional convenience)
        if (key === 'tab') {
          ev.preventDefault?.();
          this.setInputMode(this.inputMode === 'click' ? 'direct' : 'click');
        }
      } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        this.keysDown.delete(key); // Remove key from map on release
      }
    });
  }

  private setupPointerObserver(): void {
    this.pointerObserver = this.scene.onPointerObservable.add((pi) => {
      if (!this.enabled) return;

      const ev = pi.event;
      const pointerType = (ev as PointerEvent).pointerType ?? 'mouse';

      // Mouse move look while aiming/pointerlocked
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if ((this.pointerLocked || this.aiming) && pointerType === 'mouse') {
          const dx = (ev as MouseEvent).movementX ?? 0;
          const dy = (ev as MouseEvent).movementY ?? 0;
          this.applyLookDelta(dx, dy, this.mouseSensitivity);
        }

        // Touch joystick tracking
        if (pointerType === 'touch') {
          const pe = ev as PointerEvent;
          this.handleTouchMove(pe.pointerId, pe.clientX, pe.clientY);
        }

        // Drag-to-retarget for click-to-move (optional)
        if (this.allowDragRetarget && !this.pointerLocked && pointerType !== 'mouse') {
          // For touch drag, we allow continuous retarget when NOT using 2-touch joystick
          if (this.touchMoveId === null && this.touchLookId === null) {
            const hit = this.pickWalkableAtScreen(this.scene.pointerX, this.scene.pointerY);
            if (hit?.hit && hit.pickedPoint) this.targetPosition = hit.pickedPoint.clone();
          }
        }

        return;
      }

      // Pointer down
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        const pe = ev as PointerEvent;

        // Touch: decide whether this touch becomes a joystick control
        if (pointerType === 'touch') {
          this.handleTouchDown(pe.pointerId, pe.clientX, pe.clientY);
          return;
        }

        // Mouse:
        const me = ev as MouseEvent;

        // RMB: aim/look (hold) + pointer lock request
        if (me.button === 2) {
          this.aiming = true;
          // Optionally lock pointer for better look control
          this.requestPointerLock();
          me.preventDefault?.();
          return;
        }

        // LMB behavior depends on aiming state:
        if (me.button === 0) {
          if (this.pointerLocked || this.aiming) {
            // Aim-mode primary action (slingshot, etc.)
            const hit = this.pickInteractableFromView();
            this.actions.onPrimary?.(hit);
            return;
          }

          // Non-aim mode: click-to-move to walkable
          const hit = this.pickWalkableAtScreen(this.scene.pointerX, this.scene.pointerY);
          if (hit?.hit && hit.pickedPoint) {
            // Only set target if it's far enough away to avoid infinite loops
            const dist = Vector3.Distance(this.player.position, hit.pickedPoint);
            if (dist > this.stopDistance) {
              this.targetPosition = hit.pickedPoint.clone();
            }
          }
        }
        return;
      }

      // Pointer up
      if (pi.type === PointerEventTypes.POINTERUP) {
        const pe = ev as PointerEvent;

        if ((pe.pointerType ?? 'mouse') === 'touch') {
          this.handleTouchUp(pe.pointerId);
          return;
        }

        const me = ev as MouseEvent;
        if (me.button === 2) {
          // Stop “hold to aim”
          this.aiming = false;
          // If we’re pointerlocked, keep it until user toggles off (common FPS behavior)
          // If you want “release RMB exits lock”, uncomment:
          // if (this.pointerLocked) this.exitPointerLock();
        }
      }
    });
  }

  private applyLookDelta(dx: number, dy: number, sensitivity: number): void {
    // Yaw rotates the player; pitch is for camera consumers
    this.lookYaw += dx * sensitivity;
    this.lookPitch = Scalar.Clamp(this.lookPitch - dy * sensitivity, this.pitchMin, this.pitchMax);

    // Apply yaw to player immediately (direct look feel)
    this.player.rotation.y = this.lookYaw;
    this.currentYaw = this.lookYaw;

    this.actions.onLook?.(this.lookYaw, this.lookPitch);
  }

  // ---- Touch joystick ---------------------------------------------------------

  private handleTouchDown(pointerId: number, x: number, y: number): void {
    // Two-touch split:
    // First touch becomes move OR look depending on screen side.
    // Second touch claims the other role.
    const w = this.engine.getRenderWidth();
    const isLeftSide = x < w * 0.5;

    if (this.touchMoveId === null && (isLeftSide || this.touchLookId !== null)) {
      this.touchMoveId = pointerId;
      this.touchMoveStart.set(x, y, 0);
      this.touchMoveVec.set(0, 0, 0);
      return;
    }

    if (this.touchLookId === null) {
      this.touchLookId = pointerId;
      this.touchLookStart.set(x, y, 0);
      this.touchLookVec.set(0, 0, 0);
      return;
    }

    // If we already have both, ignore extras
  }

  private handleTouchMove(pointerId: number, x: number, y: number): void {
    if (pointerId === this.touchMoveId) {
      const dx = x - this.touchMoveStart.x;
      const dy = y - this.touchMoveStart.y;
      this.touchMoveVec.x = dx;
      this.touchMoveVec.z = dy;
      return;
    }
    if (pointerId === this.touchLookId) {
      const dx = x - this.touchLookStart.x;
      const dy = y - this.touchLookStart.y;
      this.touchLookVec.x = dx;
      this.touchLookVec.y = dy;
      return;
    }
  }

  private handleTouchUp(pointerId: number): void {
    // If a single-touch ended and we never engaged joystick, treat it as tap-to-move
    const wasMove = pointerId === this.touchMoveId;
    const wasLook = pointerId === this.touchLookId;

    if (wasMove) {
      const moved = Math.hypot(this.touchMoveVec.x, this.touchMoveVec.z);
      if (this.touchLookId === null && moved < this.touchDeadzone) {
        // Tap-to-move: pick at current pointer position
        const hit = this.pickWalkableAtScreen(this.scene.pointerX, this.scene.pointerY);
        if (hit?.hit && hit.pickedPoint) this.targetPosition = hit.pickedPoint.clone();
      }
      this.touchMoveId = null;
      this.touchMoveVec.set(0, 0, 0);
    }

    if (wasLook) {
      this.touchLookId = null;
      this.touchLookVec.set(0, 0, 0);
    }
  }

  private getTouchMoveAxes(): { x: number; y: number; active: boolean } {
    if (this.touchMoveId === null) return { x: 0, y: 0, active: false };

    const rawX = this.touchMoveVec.x;
    const rawY = this.touchMoveVec.z;

    const mag = Math.hypot(rawX, rawY);
    if (mag < this.touchDeadzone) return { x: 0, y: 0, active: true };

    const clamped = Math.min(mag, this.touchMax);
    const nx = (rawX / mag) * (clamped / this.touchMax);
    const ny = (rawY / mag) * (clamped / this.touchMax);

    // Note: ny is screen-down; map to forward/back with sign inversion
    return { x: nx, y: -ny, active: true };
  }

  private applyTouchLook(dt: number): void {
    if (this.touchLookId === null) return;

    const rawX = this.touchLookVec.x;
    const rawY = this.touchLookVec.y;
    const mag = Math.hypot(rawX, rawY);
    if (mag < this.touchDeadzone) return;

    // Smooth it a bit
    const dx = rawX * this.touchLookSensitivity;
    const dy = rawY * this.touchLookSensitivity;

    // Scale by dt so it feels consistent across FPS
    this.applyLookDelta(dx * (dt * 60), dy * (dt * 60), 1.0);
  }

  // ---- Movement + physics -----------------------------------------------------

  private getKeyboardAxes(): { x: number; y: number } {
    // Only forward/back movement now (no strafe)
    // A/D will be used for rotation instead
    const up = this.keysDown.get('w') || this.keysDown.get('arrowup');
    const down = this.keysDown.get('s') || this.keysDown.get('arrowdown');

    const x = 0; // No strafe
    const y = (up ? 1 : 0) + (down ? -1 : 0);
    
    return { x, y };
  }

  private getKeyboardRotation(): number {
    // A/D for rotation (radians per frame will be scaled by dt)
    const left = this.keysDown.get('a') || this.keysDown.get('arrowleft');
    const right = this.keysDown.get('d') || this.keysDown.get('arrowright');
    // left = negative (turn left), right = positive (turn right)
    return (right ? 1 : 0) + (left ? -1 : 0);
  }

  private hasDirectInput(): boolean {
    const k = this.getKeyboardAxes();
    if (k.x !== 0 || k.y !== 0) return true;
    // Also check for rotation input (A/D keys)
    const rot = this.getKeyboardRotation();
    if (rot !== 0) return true;
    const t = this.getTouchMoveAxes();
    return t.active && (Math.abs(t.x) > 0.01 || Math.abs(t.y) > 0.01);
  }

  private getGroundYAt(x: number, z: number): number {
    // Ray from above down to walkable surfaces
    const origin = this.v3a.set(x, 10, z);
    const ray = new Ray(origin, Vector3.Down(), 50);

    const hit = this.scene.pickWithRay(ray, (m) => this.isWalkableMesh(m));
    if (hit?.hit && hit.pickedPoint) return hit.pickedPoint.y;

    // Fallback
    return 0;
  }

  private checkCollisionSweep(from: Vector3, to: Vector3, radius: number): boolean {
    // XZ sweep with 4 rays around the radius (cheap but much more reliable than center-only)
    const dir = this.v3a.copyFrom(to).subtractInPlace(from);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.0005) return false;

    dir.scaleInPlace(1 / dist);

    const offsets = [
      this.v3b.set(radius, 0, 0),
      this.v3b.set(-radius, 0, 0),
      this.v3b.set(0, 0, radius),
      this.v3b.set(0, 0, -radius),
    ];

    for (const off of offsets) {
      const origin = this.v3c.copyFrom(from).addInPlace(off);
      const ray = new Ray(origin, dir, dist);

      const hit = this.scene.pickWithRay(ray, (m) => {
        if (!m.checkCollisions) return false;
        if (this.isWalkableMesh(m)) return false;
        return true;
      });

      if (hit?.hit && hit.pickedPoint) {
        const d = Vector3.Distance(origin, hit.pickedPoint);
        if (d < radius * 0.98) return true;
      }
    }

    return false;
  }

  private moveWithCollisionAndSlide(dt: number): void {
    const pos = this.player.position;

    // Horizontal movement proposal
    const move = this.v3a.copyFrom(this.velocity).scaleInPlace(dt);
    move.y = 0;

    if (move.lengthSquared() < 1e-8) return;

    const baseY = pos.y; // keep current vertical position

    // Try full move - calculate target position
    const full = this.v3b.copyFrom(pos).addInPlace(move);
    full.y = baseY;
    
    // CRITICAL: Store target BEFORE collision check (checkCollisionSweep modifies the vector!)
    const targetX = full.x;
    const targetY = full.y;
    const targetZ = full.z;

    const fullCollision = this.checkCollisionSweep(pos, full, this.collisionRadius);
    
    if (!fullCollision) {
      // Use stored target (full was corrupted by collision check)
      this.player.position.x = targetX;
      this.player.position.y = targetY;
      this.player.position.z = targetZ;
      return;
    }
    
    // Slide: try X only, then Z only
    const xOnly = this.v3c.copyFrom(pos);
    xOnly.x += move.x;
    xOnly.y = baseY;
    const xTargetX = xOnly.x;
    const xTargetZ = xOnly.z;

    const xCollision = this.checkCollisionSweep(pos, xOnly, this.collisionRadius);
    
    if (!xCollision) {
      this.player.position.x = xTargetX;
      this.player.position.z = xTargetZ;
      this.player.position.y = baseY;
      return;
    }

    const zOnly = this.v3c.copyFrom(pos);
    zOnly.z += move.z;
    zOnly.y = baseY;
    const zTargetX = zOnly.x;
    const zTargetZ = zOnly.z;

    const zCollision = this.checkCollisionSweep(pos, zOnly, this.collisionRadius);
    
    if (!zCollision) {
      this.player.position.x = zTargetX;
      this.player.position.z = zTargetZ;
      this.player.position.y = baseY;
      return;
    }

    // Blocked in all directions
    this.velocity.scaleInPlace(0);
    this.targetPosition = null;
  }

  // ---- Update ----------------------------------------------------------------

  public update(dt: number): void {
    if (!this.enabled) return;
    if (!Number.isFinite(dt) || dt <= 0) return;
    
    // Only control the active player
    if (this.playerEntity && !this.playerEntity.isActive) {
      return;
    }

    // Clamp dt for stability (tab switching / frame spikes)
    dt = Math.min(dt, 0.05);

    // Touch look while held
    this.applyTouchLook(dt);

    const pos = this.player.position;

    // Grounding check at current XZ
    const groundY = this.getGroundYAt(pos.x, pos.z);
    const feetY = groundY + this.playerHeight;

    // Determine grounded
    const epsilon = 0.03;
    this.grounded = pos.y <= feetY + epsilon && this.verticalVelocity <= 0;

    // Jump
    if (this.jumpQueued) {
      this.jumpQueued = false;
      if (this.grounded) {
        this.verticalVelocity = this.jumpSpeed;
        this.grounded = false;
      }
    }

    // Decide input mode for this frame
    const directActive = this.inputMode === 'direct' || (this.inputMode === 'auto' && this.hasDirectInput());
    const clickActive = this.inputMode === 'click' || (this.inputMode === 'auto' && !directActive);

    // DIRECT MOVEMENT (WASD / touch joystick)
    if (directActive) {
      this.targetPosition = null;

      // Handle keyboard rotation (A/D keys)
      const keyRot = this.getKeyboardRotation();
      if (keyRot !== 0) {
        const rotSpeed = 3.0; // radians per second
        const rotDelta = keyRot * rotSpeed * dt;
        this.lookYaw += rotDelta;
        this.currentYaw = this.lookYaw;
        this.player.rotation.y = this.currentYaw;
        // Camera will be updated via getYawDelta() in GameApp
      }

      const k = this.getKeyboardAxes();
      const t = this.getTouchMoveAxes();

      // Combine (keyboard wins if present)
      const ax = k.x !== 0 || k.y !== 0 ? k.x : t.x;
      const ay = k.x !== 0 || k.y !== 0 ? k.y : t.y;

      // Desired direction in local space (forward = +Z)
      this.v3a.set(ax, 0, ay);

      let desiredSpeed = this.maxSpeed;
      const mag = this.v3a.length();
      if (mag > 1e-6) {
        // Normalize input to avoid faster diagonals
        this.v3a.scaleInPlace(1 / mag);
        desiredSpeed *= Scalar.Clamp(mag, 0, 1);
      } else {
        desiredSpeed = 0;
      }

      // If aiming/pointerlocked, movement is relative to look yaw
      const yaw = (this.pointerLocked || this.aiming) ? this.lookYaw : this.player.rotation.y;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);

      // Rotate local input by yaw into world
      const worldDir = this.v3b.set(
        this.v3a.x * cos + this.v3a.z * sin,
        0,
        this.v3a.z * cos - this.v3a.x * sin
      );

      const desiredVel = worldDir.scaleInPlace(desiredSpeed);

      // Accelerate/decelerate toward desired velocity
      const velDiff = this.v3c.copyFrom(desiredVel).subtractInPlace(this.velocity);
      const accel = (desiredSpeed > 0 ? this.acceleration : this.deceleration) * dt;

      if (velDiff.length() > accel) {
        velDiff.normalize().scaleInPlace(accel);
        this.velocity.addInPlace(velDiff);
      } else {
        this.velocity.copyFrom(desiredVel);
      }
      
      // Facing
      if (this.pointerLocked || this.aiming) {
        // Look controls facing
        this.player.rotation.y = this.lookYaw;
        this.currentYaw = this.lookYaw;
      } else {
        // Otherwise face movement when moving
        const speed = this.velocity.length();
        if (speed > 0.5) {
          const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
          this.currentYaw = lerpAngle(this.currentYaw, targetYaw, 1 - Math.exp(-this.turnSmoothness * dt));
          this.player.rotation.y = this.currentYaw;
          this.lookYaw = this.currentYaw;
        }
      }
    }

    // CLICK-TO-MOVE
    if (clickActive && this.targetPosition) {
      const toTarget = this.v3a.copyFrom(this.targetPosition).subtractInPlace(pos);
      toTarget.y = 0;
      const dist = toTarget.length();

      if (dist < this.stopDistance) {
        this.targetPosition = null;
        this.velocity.set(0, 0, 0);
      } else {
        const dir = toTarget.scaleInPlace(1 / dist);
        let desiredSpeed = this.maxSpeed;
        if (dist < this.arriveRadius) desiredSpeed *= dist / this.arriveRadius;

        const desiredVel = this.v3b.copyFrom(dir).scaleInPlace(desiredSpeed);

        const velDiff = this.v3c.copyFrom(desiredVel).subtractInPlace(this.velocity);
        const accel = this.acceleration * dt;

        if (velDiff.length() > accel) {
          velDiff.normalize().scaleInPlace(accel);
          this.velocity.addInPlace(velDiff);
        } else {
          this.velocity.copyFrom(desiredVel);
        }
      }

      // Rotate toward movement direction
      const speed = this.velocity.length();
      if (speed > 0.5) {
        const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
        this.currentYaw = lerpAngle(this.currentYaw, targetYaw, 1 - Math.exp(-this.turnSmoothness * dt));
        this.player.rotation.y = this.currentYaw;
        this.lookYaw = this.currentYaw;
      }
    }
    
    // Decelerate if no active input from either mode
    if (!directActive && (!clickActive || !this.targetPosition)) {
      const speed = this.velocity.length();
      if (speed > 0.01) {
        const decel = this.deceleration * dt;
        if (speed < decel) {
          this.velocity.set(0, 0, 0);
        } else {
          // Use temp vector to avoid mutating velocity during normalize
          const decelerationDir = this.v3a.copyFrom(this.velocity).normalize();
          this.velocity.addInPlace(decelerationDir.scaleInPlace(-decel));
        }
      } else {
        this.velocity.set(0, 0, 0);
      }
    }

    // Horizontal move + collision
    this.moveWithCollisionAndSlide(dt);

    // Vertical integration
    if (!this.grounded) {
      this.verticalVelocity += this.gravity * dt;
      pos.y += this.verticalVelocity * dt;
    }

    // Snap to ground if falling below
    const groundY2 = this.getGroundYAt(pos.x, pos.z);
    const feetY2 = groundY2 + this.playerHeight;

    if (pos.y <= feetY2) {
      pos.y = feetY2;
      this.verticalVelocity = 0;
      this.grounded = true;
    }

    // Animations
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.playerEntity) this.playerEntity.isMoving(horizSpeed);
  }

  // ---- Disposal --------------------------------------------------------------

  public dispose(): void {
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
    }
    if (this.keyboardObserver) {
      this.scene.onKeyboardObservable.remove(this.keyboardObserver);
      this.keyboardObserver = null;
    }
    this.exitPointerLock();
    this.keysDown.clear();
  }
}
