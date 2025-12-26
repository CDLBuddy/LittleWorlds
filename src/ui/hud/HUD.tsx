import { useEffect } from 'react';
import { eventBus } from '@game/shared/events';
import { useUiStore } from '@ui/state/useUiStore';
import HintPulse from './widgets/HintPulse';
import InventoryBubbles from './widgets/InventoryBubbles';
import CompanionCallButton from './widgets/CompanionCallButton';
import CompletionModal from '@ui/screens/CompletionModal';

export default function HUD() {
  const { 
    addPrompt, 
    removePrompt, 
    setCompanionState, 
    setDwellProgress, 
    clearDwell, 
    activePrompts,
    showCompletionModal,
    setShowCompletionModal,
  } = useUiStore();

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
        // Show completion modal\n        setShowCompletionModal(true);
      }
    });

    return unsub;
  }, [addPrompt, removePrompt, setCompanionState, setDwellProgress, clearDwell, setShowCompletionModal]);

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

      {/* Bottom UI */}
      <div style={{ position: 'absolute', bottom: '20px', width: '100%', pointerEvents: 'auto' }}>
        <InventoryBubbles />
        <CompanionCallButton />
      </div>
      
      {/* Completion Modal */}
      <CompletionModal 
        isOpen={showCompletionModal} 
        onClose={() => setShowCompletionModal(false)} 
      />
    </div>
  );
}
