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
  
  // Subscribe to session changes to trigger remount
  const roleId = useGameSession(state => state.roleId);
  const areaId = useGameSession(state => state.areaId);
  const slotId = useGameSession(state => state.slotId);

  useEffect(() => {
    if (!running || !canvasRef.current) return;

    // Get session params
    const session = useGameSession.getState();
    let actualRoleId: RoleId = session.roleId || 'boy';
    const actualAreaId: AreaId = session.areaId || 'backyard';

    // Fallback: use save data if session is empty
    if (!session.roleId) {
      const save = saveFacade.loadMain();
      actualRoleId = save.lastSelectedRole || 'boy';
      console.log('[GameHost] Using fallback role from save:', actualRoleId);
    }

    console.log('[GameHost] Starting game with:', { roleId: actualRoleId, areaId: actualAreaId });

    // Initialize game with start params
    const game = new GameApp(canvasRef.current, eventBus, { roleId: actualRoleId, areaId: actualAreaId });
    gameRef.current = game;
    
    // Listen for ready event
    const unsub = eventBus.on((event) => {
      if (event.type === 'game/ready') {
        onReady?.();
      }
    });

    game.start();

    // Cleanup on unmount or when session changes
    return () => {
      unsub();
      game.stop();
      gameRef.current = null;
    };
  }, [running, onReady, roleId, areaId, slotId]);

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
