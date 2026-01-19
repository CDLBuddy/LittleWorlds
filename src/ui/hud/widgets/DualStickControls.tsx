// src/ui/hud/widgets/DualStickControls.tsx
import { useEffect, useMemo, useRef } from 'react';
import { eventBus } from '@game/shared/events';

type StickKind = 'move' | 'look';

type StickState = {
  active: boolean;
  pointerId: number | null;
  centerX: number;
  centerY: number;
  // current displacement in px
  dx: number;
  dy: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normStick(dx: number, dy: number, max: number) {
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-6) return { x: 0, y: 0, mag: 0 };
  const clamped = Math.min(mag, max);
  const nx = (dx / mag) * (clamped / max);
  const ny = (dy / mag) * (clamped / max);
  return { x: nx, y: ny, mag: clamped / max };
}

/**
 * DualStickControls
 * - Left stick: movement (x=strife/turn? you currently ignore strafe; y=forward/back)
 * - Right stick: camera/look (x=yaw, y=pitch)
 *
 * Emits:
 * - ui/stick/enabled { enabled: boolean }
 * - ui/stick/move { x, y, active }
 * - ui/stick/look { x, y, active }
 */
export default function DualStickControls() {
  const moveRef = useRef<HTMLDivElement | null>(null);
  const lookRef = useRef<HTMLDivElement | null>(null);

  const move = useRef<StickState>({
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    dx: 0,
    dy: 0,
  });

  const look = useRef<StickState>({
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    dx: 0,
    dy: 0,
  });

  // Tuning (px)
  const cfg = useMemo(
    () => ({
      radius: 62, // base visual radius
      max: 56, // clamp travel
      deadzone: 0.12, // normalized
    }),
    []
  );

  useEffect(() => {
    // Tell game we have UI sticks (so controller can ignore canvas-touch splitting)
    (eventBus as any).emit({ type: 'ui/stick/enabled', enabled: true });
    return () => {
      (eventBus as any).emit({ type: 'ui/stick/enabled', enabled: false });
      // Ensure we end any stuck state
      (eventBus as any).emit({ type: 'ui/stick/move', x: 0, y: 0, active: false });
      (eventBus as any).emit({ type: 'ui/stick/look', x: 0, y: 0, active: false });
    };
  }, []);

  const emit = (kind: StickKind, x: number, y: number, active: boolean) => {
    const payload =
      kind === 'move'
        ? { type: 'ui/stick/move', x, y, active }
        : { type: 'ui/stick/look', x, y, active };

    (eventBus as any).emit(payload);
  };

  const begin = (kind: StickKind, e: React.PointerEvent<HTMLDivElement>) => {
    const el = kind === 'move' ? moveRef.current : lookRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const s = kind === 'move' ? move.current : look.current;

    s.active = true;
    s.pointerId = e.pointerId;
    s.centerX = rect.left + rect.width / 2;
    s.centerY = rect.top + rect.height / 2;
    s.dx = 0;
    s.dy = 0;

    el.setPointerCapture(e.pointerId);

    // Immediately mark active (zero vector)
    emit(kind, 0, 0, true);
  };

  const movePtr = (kind: StickKind, e: React.PointerEvent<HTMLDivElement>) => {
    const s = kind === 'move' ? move.current : look.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    const dx = e.clientX - s.centerX;
    const dy = e.clientY - s.centerY;

    // clamp travel
    const mag = Math.hypot(dx, dy);
    if (mag > cfg.max) {
      const k = cfg.max / mag;
      s.dx = dx * k;
      s.dy = dy * k;
    } else {
      s.dx = dx;
      s.dy = dy;
    }

    const n = normStick(s.dx, s.dy, cfg.max);

    // deadzone
    const ax = Math.abs(n.x) < cfg.deadzone ? 0 : n.x;
    const ay = Math.abs(n.y) < cfg.deadzone ? 0 : n.y;

    // NOTE:
    // - For MOVE: screen up should mean forward => invert y
    // - For LOOK: screen up should mean pitch up (your controller uses dy to reduce pitch) => invert y too
    const outX = ax;
    const outY = -ay;

    emit(kind, outX, outY, true);
  };

  const end = (kind: StickKind, e: React.PointerEvent<HTMLDivElement>) => {
    const el = kind === 'move' ? moveRef.current : lookRef.current;
    const s = kind === 'move' ? move.current : look.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    s.active = false;
    s.pointerId = null;
    s.dx = 0;
    s.dy = 0;

    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    emit(kind, 0, 0, false);
  };

  // Visual layout: safe-area aware, big comfy sticks, never overlap the Call button.
  const rootStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42vh',
    pointerEvents: 'none',
    zIndex: 50,
  };

  const stickBaseCommon: React.CSSProperties = {
    width: 140,
    height: 140,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    touchAction: 'none',
    pointerEvents: 'auto',
    display: 'grid',
    placeItems: 'center',
  };

  const knob = (dx: number, dy: number): React.CSSProperties => ({
    width: 68,
    height: 68,
    borderRadius: 999,
    transform: `translate(${dx}px, ${dy}px)`,
    background: 'rgba(255,255,255,0.22)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 10px 22px rgba(0,0,0,0.22)',
  });

  const leftWrap: React.CSSProperties = {
    position: 'absolute',
    left: 18,
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
    pointerEvents: 'auto',
  };

  const rightWrap: React.CSSProperties = {
    position: 'absolute',
    right: 18,
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
    pointerEvents: 'auto',
  };

  // Keep sticks slightly lower on tiny phones to avoid covering center UI
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.75)',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  return (
    <div style={rootStyle}>
      {/* LEFT: MOVE */}
      <div style={leftWrap}>
        <div style={labelStyle}>MOVE</div>
        <div
          ref={moveRef}
          style={stickBaseCommon}
          onPointerDown={(e) => begin('move', e)}
          onPointerMove={(e) => movePtr('move', e)}
          onPointerUp={(e) => end('move', e)}
          onPointerCancel={(e) => end('move', e)}
        >
          <div style={knob(move.current.dx, move.current.dy)} />
        </div>
      </div>

      {/* RIGHT: LOOK */}
      <div style={rightWrap}>
        <div style={labelStyle}>LOOK</div>
        <div
          ref={lookRef}
          style={stickBaseCommon}
          onPointerDown={(e) => begin('look', e)}
          onPointerMove={(e) => movePtr('look', e)}
          onPointerUp={(e) => end('look', e)}
          onPointerCancel={(e) => end('look', e)}
        >
          <div style={knob(look.current.dx, look.current.dy)} />
        </div>
      </div>
    </div>
  );
}