import { useEffect } from 'react';
import { eventBus } from '@game/shared/events';
import { useUiStore } from '@ui/state/useUiStore';
import { useToastStore } from '@ui/state/useToastStore';
import HintPulse from './widgets/HintPulse';
import InventoryBubbles from './widgets/InventoryBubbles';
import { InventoryDisplay } from './widgets/InventoryDisplay';
import CompanionCallButton from './widgets/CompanionCallButton';
import ToastOverlay from './widgets/ToastOverlay';

export default function HUD() {
  const { 
    addPrompt, 
    removePrompt, 
    setCompanionState, 
    setDwellProgress, 
    clearDwell, 
    activePrompts,
  } = useUiStore();
  
  const { pushToast } = useToastStore();

  useEffect(() => {
    // Subscribe to game events
    const unsub = eventBus.on((event) => {
      if (event.type === 'game/prompt') {
        addPrompt({
          id: event.id,
          icon: event.icon,
          worldPos: event.worldPos,
        });
      } else if (event.type === 'game/promptClear') {
        if (event.id) {
          removePrompt(event.id);
        }
      } else if (event.type === 'game/companion/state') {
        setCompanionState(event.state);
      } else if (event.type === 'game/dwell') {
        setDwellProgress(event.id, event.progress);
      } else if (event.type === 'game/dwellClear') {
        clearDwell(event.id);
      } else if (event.type === 'game/taskComplete') {
        // Show completion toast
        pushToast('info', '🎉 Task Complete!');
      } else if (event.type === 'ui/toast') {
        // Handle toast events
        pushToast(event.level, event.message);
      }
    });

    return unsub;
  }, [addPrompt, removePrompt, setCompanionState, setDwellProgress, clearDwell, pushToast]);

  return (
    <div className="hud" style={{ position: 'fixed', width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* Icon prompts - top center */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        pointerEvents: 'none',
      }}>
        {Array.from(activePrompts.values()).map((prompt) => (
          <HintPulse key={prompt.id} icon={prompt.icon} dwellProgress={prompt.dwellProgress} />
        ))}
      </div>

      {/* Inventory display - top right */}
      <InventoryDisplay />

      {/* Bottom UI */}
      <div style={{ position: 'absolute', bottom: '20px', width: '100%', pointerEvents: 'auto' }}>
        <InventoryBubbles />
        <CompanionCallButton />
      </div>
      
      {/* Toast Overlay */}
      <ToastOverlay />
    </div>
  );
}
