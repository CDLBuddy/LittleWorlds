// src/ui/hud/HUD.tsx
import { useEffect } from 'react';
import { eventBus } from '@game/shared/events';
import { useUiStore } from '@ui/state/useUiStore';
import { useToastStore } from '@ui/state/useToastStore';
import HintPulse from './widgets/HintPulse';
import { InventoryHUD } from '@ui/inventory/InventoryHUD';
import CompanionCallButton from './widgets/CompanionCallButton';
import ToastOverlay from './widgets/ToastOverlay';
import DualStickControls from './widgets/DualStickControls';
import { ToolHUD } from './widgets/ToolHUD';

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
    const unsub = eventBus.on((event) => {
      if (event.type === 'game/prompt') {
        addPrompt({ id: event.id, icon: event.icon, worldPos: event.worldPos });
      } else if (event.type === 'game/promptClear') {
        if (event.id) removePrompt(event.id);
      } else if (event.type === 'game/companion/state') {
        setCompanionState(event.state);
      } else if (event.type === 'game/dwell') {
        setDwellProgress(event.id, event.progress);
      } else if (event.type === 'game/dwellClear') {
        clearDwell(event.id);
      } else if (event.type === 'game/taskComplete') {
        pushToast('info', '🎉 Task Complete!');
      } else if (event.type === 'ui/toast') {
        pushToast(event.level, event.message);
      }
    });

    return unsub;
  }, [addPrompt, removePrompt, setCompanionState, setDwellProgress, clearDwell, pushToast]);

  return (
    <div
      className="hud"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      {/* Icon prompts - top center */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '16px',
          pointerEvents: 'none',
        }}
      >
        {Array.from(activePrompts.values()).map((prompt) => (
          <HintPulse key={prompt.id} icon={prompt.icon} dwellProgress={prompt.dwellProgress} />
        ))}
      </div>

      {/* Tool HUD Widget - top left */}
      <ToolHUD />

      {/* Inventory display - top right */}
      <InventoryHUD />

      {/* Dual sticks (mobile/tablet) */}
      <DualStickControls />

      {/* Bottom center call button (won't overlap sticks) */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 60,
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <CompanionCallButton />
        </div>
      </div>

      {/* Toast Overlay */}
      <ToastOverlay />
    </div>
  );
}