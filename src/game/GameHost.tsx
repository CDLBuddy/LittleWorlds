import { useEffect, useRef } from 'react';
import { GameApp } from './GameApp';
import { eventBus } from './shared/events';
import HUD from '@ui/hud/HUD';
import { useGameSession } from './session/useGameSession';
import { saveFacade } from './systems/saves/saveFacade';
import type { RoleId, AreaId } from './content/areas';

interface GameHostProps {
  running: boolean;
  onReady?: () => void;
}

export default function GameHost({ running, onReady }: GameHostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameApp | null>(null);

  useEffect(() => {
    if (!running || !canvasRef.current) return;

    // Get session params
    const session = useGameSession.getState();
    let roleId: RoleId = session.roleId || 'boy';
    const areaId: AreaId = session.areaId || 'backyard';

    // Fallback: use save data if session is empty
    if (!session.roleId) {
      const save = saveFacade.loadMain();
      roleId = save.lastSelectedRole || 'boy';
      console.log('[GameHost] Using fallback role from save:', roleId);
    }

    console.log('[GameHost] Starting game with:', { roleId, areaId });

    // Initialize game with start params
    const game = new GameApp(canvasRef.current, eventBus, { roleId, areaId });
    gameRef.current = game;
    
    // Listen for ready event
    const unsub = eventBus.on((event) => {
      if (event.type === 'game/ready') {
        onReady?.();
      }
    });

    game.start();

    // Cleanup on unmount or when running becomes false
    return () => {
      unsub();
      game.stop();
      gameRef.current = null;
    };
  }, [running, onReady]);

  return (
    <div className="game-host" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        id="lw-canvas"
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        onPointerDown={() => {
          // Ensure audio unlocks on first interaction
          eventBus.emit({ type: 'ui/audio/unlock' });
        }}
      />
      {running && <HUD />}
    </div>
  );
}
