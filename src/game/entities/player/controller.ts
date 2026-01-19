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
 * - Collision: lightweight ray-based "poor man’s capsule" sweep in XZ plane
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
  /** E / tap-interact / "use" */
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

type StickAxes = { x: number; y: number; active?: boolean };

/**
 * Virtual input injection for on-screen joysticks (future HUD).
 * - move: normalized axes (x strafe, y forward) OR (x=0,y forward only) if you prefer.
 * - look: pixel-like deltas OR normalized deltas; controller will scale consistently.
 */
type VirtualInputState = {
  move: StickAxes;
  look: StickAxes; // x = yaw delta, y = pitch delta (screen-style: +y = down)
  // Optional flags to force behavior:
  isAiming?: boolean; // treat movement as camera-facing
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
  private maxSpeed = 20.0;
  private acceleration = 20.0;
  private deceleration = 24.0;
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
  private mouseSensitivity = 0.02;
  private touchLookSensitivity = 0.08;
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

  // Pointer lock tracking cleanup
  private onPointerLockChange: (() => void) | null = null;

  // Touch joystick (no UI; "two-touch split")
  private touchMoveId: number | null = null;
  private touchLookId: number | null = null;
  private touchMoveStart = new Vector3(0, 0, 0); // x,y used
  private touchLookStart = new Vector3(0, 0, 0);
  private touchMoveVec = new Vector3(0, 0, 0); // x,z used as axes
  private touchLookVec = new Vector3(0, 0, 0); // x,y used as look deltas
  private touchDeadzone = 12; // pixels
  private touchMax = 80; // pixels

  // === NEW: Virtual stick injection (HUD joysticks) ===
  private virtual: VirtualInputState = {
    move: { x: 0, y: 0, active: false },
    look: { x: 0, y: 0, active: false },
    isAiming: false,
  };

  // Scratch vectors to reduce GC
  private v3a = new Vector3();
  private v3b = new Vector3();
  private v3c = new Vector3();

  constructor(private scene: Scene, private player: TransformNode, opts: ControllerOptions = {}) {
    this.engine = this.scene.getEngine() as Engine;
    this.canvas = this.engine.getRenderingCanvas();

    if (!this.canvas) {
      console.error(
        '[PlayerController] No canvas found! Controller will not work. This may be React Strict Mode double-render.'
      );
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
  }

  public setPlayerEntity(player: Player): void {
    this.playerEntity = player;
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
      this.virtual.move = { x: 0, y: 0, active: false };
      this.virtual.look = { x: 0, y: 0, active: false };
      this.virtual.isAiming = false;
      this.exitPointerLock();
    }
  }

  public setInputMode(mode: InputMode): void {
    this.inputMode = mode;
    if (mode === 'click') {
      this.velocity.scaleInPlace(0);
    } else if (mode === 'direct') {
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
   * NEW: HUD joystick can push movement/look without touching internals.
   * - move.x/move.y should be in [-1..1] typically.
   * - look.x/look.y are deltas (we scale by dt for FPS stability).
   */
  public setVirtualInput(input: Partial<VirtualInputState>): void {
    if (input.move) {
      const x = Scalar.Clamp(input.move.x ?? 0, -1, 1);
      const y = Scalar.Clamp(input.move.y ?? 0, -1, 1);
      const active = input.move.active ?? (Math.abs(x) > 0.01 || Math.abs(y) > 0.01);
      this.virtual.move = { x, y, active };
    }
    if (input.look) {
      // For look, we allow a wider range but still keep it sane.
      const lx = input.look.x ?? 0;
      const ly = input.look.y ?? 0;
      const active = input.look.active ?? (Math.abs(lx) > 0.01 || Math.abs(ly) > 0.01);
      this.virtual.look = { x: lx, y: ly, active };
    }
    if (typeof input.isAiming === 'boolean') {
      this.virtual.isAiming = input.isAiming;
    }
  }

  /**
   * Convenience: clear virtual input each frame if your HUD runs "edge-triggered".
   * Most joysticks will continuously send input, so you probably won't call this.
   */
  public clearVirtualInput(): void {
    this.virtual.move = { x: 0, y: 0, active: false };
    this.virtual.look = { x: 0, y: 0, active: false };
    this.virtual.isAiming = false;
  }

  /**
   * Get player's movement intent for camera recenter logic.
   * Returns forward amount: +1 = W key, -1 = S key, 0 = no input.
   */
  public getMoveIntent(): { isMoving: boolean; forwardAmount: number } {
    const k = this.getKeyboardAxes();
    const v = this.getVirtualMoveAxes();
    const t = this.getTouchMoveAxes();

    // Priority: keyboard > virtual stick > fallback touch split
    const hasKeyboard = k.x !== 0 || k.y !== 0;
    const hasVirtual = v.active && (Math.abs(v.x) > 0.01 || Math.abs(v.y) > 0.01);

    const forwardAmount = hasKeyboard ? k.y : hasVirtual ? v.y : t.y;
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

    if (this.pointerLocked || this.aiming) {
      const ray = cam.getForwardRay(this.interactRange);
      const hit = this.scene.pickWithRay(ray, (m) => {
        if (!m.isPickable) return false;
        if (this.isWalkableMesh(m)) return false;
        return true;
      });
      return hit ?? null;
    }

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

    this.onPointerLockChange = onChange;
    document.addEventListener('pointerlockchange', onChange, { passive: true });
  }

  private requestPointerLock(): void {
    if (!this.canvas) return;
    if (this.canvas.requestPointerLock) void this.canvas.requestPointerLock();
  }

  private exitPointerLock(): void {
    if (document.exitPointerLock) document.exitPointerLock();
  }

  private setupKeyboardObserver(): void {
    this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (!this.enabled) return;

      const ev = kbInfo.event;
      const key = (ev.key || '').toLowerCase();

      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        this.keysDown.set(key, true);

        if (key === ' ' || key === 'space') {
          this.jumpQueued = true;
          ev.preventDefault?.();
        }

        if (key === 'e') {
          const hit = this.pickInteractableFromView();
          this.actions.onInteract?.(hit);
        }

        if (key === 'f') {
          const hit = this.pickInteractableFromView();
          this.actions.onPrimary?.(hit);
        }
        if (key === 'q') {
          const hit = this.pickInteractableFromView();
          this.actions.onSecondary?.(hit);
        }

        if (key === 'l') {
          if (this.pointerLocked) this.exitPointerLock();
          else this.requestPointerLock();
        }

        if (key === 'tab') {
          ev.preventDefault?.();
          this.setInputMode(this.inputMode === 'click' ? 'direct' : 'click');
        }
      } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        this.keysDown.delete(key);
      }
    });
  }

  private setupPointerObserver(): void {
    this.pointerObserver = this.scene.onPointerObservable.add((pi) => {
      if (!this.enabled) return;

      const ev = pi.event;
      const pointerType = (ev as PointerEvent).pointerType ?? 'mouse';

      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if ((this.pointerLocked || this.aiming) && pointerType === 'mouse') {
          const dx = (ev as MouseEvent).movementX ?? 0;
          const dy = (ev as MouseEvent).movementY ?? 0;
          this.applyLookDelta(dx, dy, this.mouseSensitivity);
        }

        if (pointerType === 'touch') {
          const pe = ev as PointerEvent;
          this.handleTouchMove(pe.pointerId, pe.clientX, pe.clientY);
        }

        if (this.allowDragRetarget && !this.pointerLocked && pointerType !== 'mouse') {
          // Only retarget if NOT using two-touch split and NOT using virtual sticks.
          if (
            this.touchMoveId === null &&
            this.touchLookId === null &&
            !this.virtual.move.active &&
            !this.virtual.look.active
          ) {
            const hit = this.pickWalkableAtScreen(this.scene.pointerX, this.scene.pointerY);
            if (hit?.hit && hit.pickedPoint) this.targetPosition = hit.pickedPoint.clone();
          }
        }
        return;
      }

      if (pi.type === PointerEventTypes.POINTERDOWN) {
        const pe = ev as PointerEvent;

        if (pointerType === 'touch') {
          this.handleTouchDown(pe.pointerId, pe.clientX, pe.clientY);
          return;
        }

        const me = ev as MouseEvent;

        if (me.button === 2) {
          this.aiming = true;
          this.requestPointerLock();
          me.preventDefault?.();
          return;
        }

        if (me.button === 0) {
          if (this.pointerLocked || this.aiming) {
            const hit = this.pickInteractableFromView();
            this.actions.onPrimary?.(hit);
            return;
          }

          const hit = this.pickWalkableAtScreen(this.scene.pointerX, this.scene.pointerY);
          if (hit?.hit && hit.pickedPoint) {
            const dist = Vector3.Distance(this.player.position, hit.pickedPoint);
            if (dist > this.stopDistance) {
              this.targetPosition = hit.pickedPoint.clone();
            }
          }
        }
        return;
      }

      // Pointer up OR pointer cancel (mobile browsers cancel a lot)
      if (pi.type === PointerEventTypes.POINTERUP || pi.type === PointerEventTypes.POINTERDOUBLETAP) {
        const pe = ev as PointerEvent;

        if ((pe.pointerType ?? 'mouse') === 'touch') {
          this.handleTouchUp(pe.pointerId);
          return;
        }

        const me = ev as MouseEvent;
        if (me.button === 2) {
          this.aiming = false;
        }
      }
    });
  }

  private applyLookDelta(dx: number, dy: number, sensitivity: number): void {
    // Yaw rotates the player; pitch is for camera consumers
    this.lookYaw += dx * sensitivity;
    this.lookPitch = Scalar.Clamp(this.lookPitch - dy * sensitivity, this.pitchMin, this.pitchMax);

    this.player.rotation.y = this.lookYaw;
    this.currentYaw = this.lookYaw;

    this.actions.onLook?.(this.lookYaw, this.lookPitch);
  }

  // ---- Touch joystick ---------------------------------------------------------

  private handleTouchDown(pointerId: number, x: number, y: number): void {
    // If virtual sticks are active, ignore the legacy two-touch split entirely.
    // This prevents "ghost" touches from fighting the HUD controls later.
    if (this.virtual.move.active || this.virtual.look.active) return;

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
  }

  private handleTouchMove(pointerId: number, x: number, y: number): void {
    if (pointerId === this.touchMoveId) {
      this.touchMoveVec.x = x - this.touchMoveStart.x;
      this.touchMoveVec.z = y - this.touchMoveStart.y;
      return;
    }
    if (pointerId === this.touchLookId) {
      this.touchLookVec.x = x - this.touchLookStart.x;
      this.touchLookVec.y = y - this.touchLookStart.y;
      return;
    }
  }

  private handleTouchUp(pointerId: number): void {
    const wasMove = pointerId === this.touchMoveId;
    const wasLook = pointerId === this.touchLookId;

    if (wasMove) {
      const moved = Math.hypot(this.touchMoveVec.x, this.touchMoveVec.z);
      if (this.touchLookId === null && moved < this.touchDeadzone) {
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

    return { x: nx, y: -ny, active: true };
  }

  private applyTouchLook(dt: number): void {
    if (this.touchLookId === null) return;

    const rawX = this.touchLookVec.x;
    const rawY = this.touchLookVec.y;
    const mag = Math.hypot(rawX, rawY);
    if (mag < this.touchDeadzone) return;

    // dt-normalized (60fps baseline)
    const dx = rawX * this.touchLookSensitivity * (dt * 60);
    const dy = rawY * this.touchLookSensitivity * (dt * 60);

    this.applyLookDelta(dx, dy, 1.0);
  }

  // ---- Virtual stick helpers --------------------------------------------------

  private getVirtualMoveAxes(): { x: number; y: number; active: boolean } {
    const m = this.virtual.move;
    return { x: m.x, y: m.y, active: !!m.active };
  }

  private applyVirtualLook(dt: number): void {
    const l = this.virtual.look;
    if (!l.active) return;

    // Two ways to drive this:
    // 1) If HUD sends normalized deltas [-1..1], it still works--just smaller.
    // 2) If HUD sends pixel-ish deltas, it works--just bigger.
    //
    // We scale by dt for stability and by touchLookSensitivity to match touch feel.
    const dx = l.x * this.touchLookSensitivity * (dt * 60);
    const dy = l.y * this.touchLookSensitivity * (dt * 60);

    // sensitivity = 1.0 because we already scaled above.
    this.applyLookDelta(dx, dy, 1.0);
  }

  // ---- Movement + physics -----------------------------------------------------

  private getKeyboardAxes(): { x: number; y: number } {
    const up = this.keysDown.get('w') || this.keysDown.get('arrowup');
    const down = this.keysDown.get('s') || this.keysDown.get('arrowdown');

    const x = 0; // No strafe (by design right now)
    const y = (up ? 1 : 0) + (down ? -1 : 0);

    return { x, y };
  }

  private getKeyboardRotation(): number {
    const left = this.keysDown.get('a') || this.keysDown.get('arrowleft');
    const right = this.keysDown.get('d') || this.keysDown.get('arrowright');
    return (right ? 1 : 0) + (left ? -1 : 0);
  }

  private hasDirectInput(): boolean {
    const k = this.getKeyboardAxes();
    if (k.x !== 0 || k.y !== 0) return true;

    const rot = this.getKeyboardRotation();
    if (rot !== 0) return true;

    const v = this.getVirtualMoveAxes();
    if (v.active && (Math.abs(v.x) > 0.01 || Math.abs(v.y) > 0.01)) return true;

    const t = this.getTouchMoveAxes();
    return t.active && (Math.abs(t.x) > 0.01 || Math.abs(t.y) > 0.01);
  }

  private getGroundYAt(x: number, z: number): number {
    const origin = this.v3a.set(x, 10, z);
    const ray = new Ray(origin, Vector3.Down(), 50);

    const hit = this.scene.pickWithRay(ray, (m) => this.isWalkableMesh(m));
    if (hit?.hit && hit.pickedPoint) return hit.pickedPoint.y;
    return 0;
  }

  private checkCollisionSweep(from: Vector3, to: Vector3, radius: number): boolean {
    const dir = this.v3a.copyFrom(to).subtractInPlace(from);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 0.0005) return false;

    dir.scaleInPlace(1 / dist);

    // IMPORTANT: do NOT reuse the same Vector3 instance for every offset.
    // That silently makes all offsets identical.
    const offsets = [
      new Vector3(radius, 0, 0),
      new Vector3(-radius, 0, 0),
      new Vector3(0, 0, radius),
      new Vector3(0, 0, -radius),
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

    const move = this.v3a.copyFrom(this.velocity).scaleInPlace(dt);
    move.y = 0;
    if (move.lengthSquared() < 1e-8) return;

    const baseY = pos.y;

    const full = this.v3b.copyFrom(pos).addInPlace(move);
    full.y = baseY;

    // store target before collision check
    const targetX = full.x;
    const targetY = full.y;
    const targetZ = full.z;

    const fullCollision = this.checkCollisionSweep(pos, full, this.collisionRadius);

    if (!fullCollision) {
      this.player.position.x = targetX;
      this.player.position.y = targetY;
      this.player.position.z = targetZ;
      return;
    }

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

    this.velocity.scaleInPlace(0);
    this.targetPosition = null;
  }

  // ---- Update ----------------------------------------------------------------

  public update(dt: number): void {
    if (!this.enabled) return;
    if (!Number.isFinite(dt) || dt <= 0) return;

    // Only control the active player
    if (this.playerEntity && !this.playerEntity.isActive) return;

    // Clamp dt for stability
    dt = Math.min(dt, 0.05);

    // Apply virtual look FIRST (HUD right stick)
    this.applyVirtualLook(dt);

    // Apply legacy touch look (two-touch split)
    this.applyTouchLook(dt);

    const pos = this.player.position;

    // Grounding check
    const groundY = this.getGroundYAt(pos.x, pos.z);
    const feetY = groundY + this.playerHeight;

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

    // DIRECT MOVEMENT
    if (directActive) {
      this.targetPosition = null;

      // Keyboard rotation (A/D)
      const keyRot = this.getKeyboardRotation();
      if (keyRot !== 0) {
        const rotSpeed = 3.0; // radians/sec
        const rotDelta = keyRot * rotSpeed * dt;
        this.lookYaw += rotDelta;
        this.currentYaw = this.lookYaw;
        this.player.rotation.y = this.currentYaw;
      }

      const k = this.getKeyboardAxes();
      const v = this.getVirtualMoveAxes();
      const t = this.getTouchMoveAxes();

      const hasKeyboard = k.x !== 0 || k.y !== 0;
      const hasVirtual = v.active && (Math.abs(v.x) > 0.01 || Math.abs(v.y) > 0.01);

      // Priority: keyboard > virtual stick > legacy touch split
      const ax = hasKeyboard ? k.x : hasVirtual ? v.x : t.x;
      const ay = hasKeyboard ? k.y : hasVirtual ? v.y : t.y;

      // Local input (forward = +Z)
      this.v3a.set(ax, 0, ay);

      let desiredSpeed = this.maxSpeed;
      const mag = this.v3a.length();
      if (mag > 1e-6) {
        this.v3a.scaleInPlace(1 / mag);
        desiredSpeed *= Scalar.Clamp(mag, 0, 1);
      } else {
        desiredSpeed = 0;
      }

      // Treat virtual.isAiming like aiming/pointerlock for "move relative to camera yaw"
      const cameraFacingMove = this.pointerLocked || this.aiming || this.virtual.isAiming;

      const yaw = cameraFacingMove ? this.lookYaw : this.player.rotation.y;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);

      const worldDir = this.v3b.set(
        this.v3a.x * cos + this.v3a.z * sin,
        0,
        this.v3a.z * cos - this.v3a.x * sin
      );

      const desiredVel = worldDir.scaleInPlace(desiredSpeed);

      const velDiff = this.v3c.copyFrom(desiredVel).subtractInPlace(this.velocity);
      const accel = (desiredSpeed > 0 ? this.acceleration : this.deceleration) * dt;

      if (velDiff.length() > accel) {
        velDiff.normalize().scaleInPlace(accel);
        this.velocity.addInPlace(velDiff);
      } else {
        this.velocity.copyFrom(desiredVel);
      }

      // Facing
      if (cameraFacingMove) {
        this.player.rotation.y = this.lookYaw;
        this.currentYaw = this.lookYaw;
      } else {
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

      const speed = this.velocity.length();
      if (speed > 0.5) {
        const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
        this.currentYaw = lerpAngle(this.currentYaw, targetYaw, 1 - Math.exp(-this.turnSmoothness * dt));
        this.player.rotation.y = this.currentYaw;
        this.lookYaw = this.currentYaw;
      }
    }

    // Decelerate if no active input
    if (!directActive && (!clickActive || !this.targetPosition)) {
      const speed = this.velocity.length();
      if (speed > 0.01) {
        const decel = this.deceleration * dt;
        if (speed < decel) {
          this.velocity.set(0, 0, 0);
        } else {
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

    // Snap to ground
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

    if (this.onPointerLockChange) {
      document.removeEventListener('pointerlockchange', this.onPointerLockChange as EventListener);
      this.onPointerLockChange = null;
    }

    this.exitPointerLock();
    this.keysDown.clear();
  }
}