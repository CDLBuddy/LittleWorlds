// src/game/GameHost.tsx
import { useEffect, useMemo, useRef } from 'react';
import { GameApp } from './GameApp';
import { eventBus } from './shared/events';
import HUD from '@ui/hud/HUD';
import PauseMenu from '@ui/screens/PauseMenu';
import { useUiStore } from '@ui/state/useUiStore';
import { useGameSession } from './session/useGameSession';
import { saveFacade } from './systems/saves/saveFacade';
import type { RoleId, AreaId } from './content/areas';
import DualStickControls from '@ui/hud/widgets/DualStickControls';

interface GameHostProps {
  running: boolean;
  onReady?: () => void;
}

export default function GameHost({ running, onReady }: GameHostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameApp | null>(null);
  const audioUnlockedRef = useRef(false);

  const { isPaused, setPaused } = useUiStore();

  // Subscribe to session changes to trigger remount
  const roleId = useGameSession((state) => state.roleId);
  const areaId = useGameSession((state) => state.areaId);
  const slotId = useGameSession((state) => state.slotId);

  // Show on-screen sticks on touch/coarse-pointer devices
  const showSticks = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const touch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
    return coarse || touch;
  }, []);

  useEffect(() => {
    if (!running || !canvasRef.current) return;

    // If something weird happened (StrictMode / hot reload), stop old instance first.
    if (gameRef.current) {
      try {
        gameRef.current.stop();
      } catch {
        // ignore
      }
      gameRef.current = null;
    }

    // Get session params
    const session = useGameSession.getState();
    let actualRoleId: RoleId = session.roleId || 'boy';
    const actualAreaId: AreaId = session.areaId || 'backyard';

    // Fallback: use save data if session is empty
    if (!session.roleId) {
      const save = saveFacade.loadMain();
      actualRoleId = save.lastSelectedRole || 'boy';
    }

    const game = new GameApp(canvasRef.current, eventBus, {
      roleId: actualRoleId,
      areaId: actualAreaId,
    });
    gameRef.current = game;

    const unsub = eventBus.on((event) => {
      if (event.type === 'game/ready') onReady?.();
    });

    void game.start();

    return () => {
      unsub();
      try {
        game.stop();
      } finally {
        gameRef.current = null;
      }
    };
  }, [running, onReady, roleId, areaId, slotId]);

  // Keyboard pause (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPaused(!isPaused);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, setPaused]);

  const handleResume = () => setPaused(false);
  const handleSettings = () => console.log('Settings not yet implemented');
  const handleQuit = () => {
    setPaused(false);
    eventBus.emit({ type: 'ui/quit' });
  };

  const onFirstPointerDown = () => {
    // Unlock audio once (mobile policies)
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    eventBus.emit({ type: 'ui/audio/unlock' });
  };

  return (
    <div className="game-host" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        id="lw-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none',
        }}
        onPointerDown={onFirstPointerDown}
      />

      {running && <HUD />}

      {/* Mobile sticks overlay */}
      {running && showSticks && !isPaused && <DualStickControls />}

      {running && isPaused && (
        <PauseMenu onResume={handleResume} onSettings={handleSettings} onQuit={handleQuit} />
      )}
    </div>
  );
}