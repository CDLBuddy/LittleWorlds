// src/ui/hud/widgets/DualStickControls.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { eventBus } from '@game/shared/events';

type StickKind = 'move' | 'look';

type StickState = {
  active: boolean;
  pointerId: number | null;
  centerX: number;
  centerY: number;
  dx: number;
  dy: number;
};

function normStick(dx: number, dy: number, max: number) {
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-6) return { x: 0, y: 0, mag: 0 };
  const clamped = Math.min(mag, max);
  const nx = (dx / mag) * (clamped / max);
  const ny = (dy / mag) * (clamped / max);
  return { x: nx, y: ny, mag: clamped / max };
}

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

  // Mirror dx/dy into state so the knob animates (refs alone don't re-render)
  const [moveKnob, setMoveKnob] = useState({ dx: 0, dy: 0 });
  const [lookKnob, setLookKnob] = useState({ dx: 0, dy: 0 });

  // Tuning (px)
  const cfg = useMemo(
    () => ({
      max: 56, // clamp travel
      deadzone: 0.12, // normalized
      // Lift sticks slightly so they're never under iOS Safari bottom chrome.
      bottomOffset: 28,
    }),
    []
  );

  useEffect(() => {
    (eventBus as any).emit({ type: 'ui/stick/enabled', enabled: true });

    return () => {
      (eventBus as any).emit({ type: 'ui/stick/enabled', enabled: false });
      (eventBus as any).emit({ type: 'ui/stick/move', x: 0, y: 0, active: false });
      (eventBus as any).emit({ type: 'ui/stick/look', x: 0, y: 0, active: false });
    };
  }, []);

  const emit = (kind: StickKind, x: number, y: number, active: boolean) => {
    (eventBus as any).emit(
      kind === 'move'
        ? { type: 'ui/stick/move', x, y, active }
        : { type: 'ui/stick/look', x, y, active }
    );
  };

  const syncKnob = (kind: StickKind) => {
    const s = kind === 'move' ? move.current : look.current;
    if (kind === 'move') setMoveKnob({ dx: s.dx, dy: s.dy });
    else setLookKnob({ dx: s.dx, dy: s.dy });
  };

  const begin = (kind: StickKind, e: React.PointerEvent<HTMLDivElement>) => {
    const el = kind === 'move' ? moveRef.current : lookRef.current;
    if (!el) return;

    e.preventDefault();

    const rect = el.getBoundingClientRect();
    const s = kind === 'move' ? move.current : look.current;

    s.active = true;
    s.pointerId = e.pointerId;
    s.centerX = rect.left + rect.width / 2;
    s.centerY = rect.top + rect.height / 2;
    s.dx = 0;
    s.dy = 0;

    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    syncKnob(kind);
    emit(kind, 0, 0, true);
  };

  const movePtr = (kind: StickKind, e: React.PointerEvent<HTMLDivElement>) => {
    const s = kind === 'move' ? move.current : look.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    e.preventDefault();

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

    syncKnob(kind);

    const n = normStick(s.dx, s.dy, cfg.max);

    // deadzone
    const ax = Math.abs(n.x) < cfg.deadzone ? 0 : n.x;
    const ay = Math.abs(n.y) < cfg.deadzone ? 0 : n.y;

    // MOVE: screen up => forward => invert y
    // LOOK: screen up => pitch up => invert y
    emit(kind, ax, -ay, true);
  };

  const end = (kind: StickKind, e: React.PointerEvent<HTMLDivElement>) => {
    const el = kind === 'move' ? moveRef.current : lookRef.current;
    const s = kind === 'move' ? move.current : look.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    e.preventDefault();

    s.active = false;
    s.pointerId = null;
    s.dx = 0;
    s.dy = 0;

    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    syncKnob(kind);
    emit(kind, 0, 0, false);
  };

  // Hard failsafe: if browser drops pointerup/cancel, reset on blur
  useEffect(() => {
    const onBlur = () => {
      if (move.current.active) {
        move.current.active = false;
        move.current.pointerId = null;
        move.current.dx = 0;
        move.current.dy = 0;
        setMoveKnob({ dx: 0, dy: 0 });
        emit('move', 0, 0, false);
      }
      if (look.current.active) {
        look.current.active = false;
        look.current.pointerId = null;
        look.current.dx = 0;
        look.current.dy = 0;
        setLookKnob({ dx: 0, dy: 0 });
        emit('look', 0, 0, false);
      }
    };

    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: '44vh',
    pointerEvents: 'none',
    zIndex: 50, // sticks should be above Call button (which is 40)
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
    WebkitUserSelect: 'none',
    userSelect: 'none',
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

  const bottom = `calc(env(safe-area-inset-bottom, 0px) + ${cfg.bottomOffset}px)`;

  const leftWrap: React.CSSProperties = {
    position: 'absolute',
    left: 18,
    bottom,
    pointerEvents: 'auto',
  };

  const rightWrap: React.CSSProperties = {
    position: 'absolute',
    right: 18,
    bottom,
    pointerEvents: 'auto',
  };

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
          onLostPointerCapture={(e) => end('move', e)}
        >
          <div style={knob(moveKnob.dx, moveKnob.dy)} />
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
          onLostPointerCapture={(e) => end('look', e)}
        >
          <div style={knob(lookKnob.dx, lookKnob.dy)} />
        </div>
      </div>
    </div>
  );
}