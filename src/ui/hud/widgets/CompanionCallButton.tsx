// src/ui/hud/widgets/CompanionCallButton.tsx
import { eventBus } from '@game/shared/events';

export default function CompanionCallButton() {
  const handleCall = () => {
    console.log('[CompanionCallButton] Button clicked, emitting ui/callCompanion');
    eventBus.emit({ type: 'ui/callCompanion' });
  };

  return (
    <button
      className="companion-call-button"
      onClick={handleCall}
      style={{
        // Layout
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',

        // Sizing (mobile friendly)
        fontSize: '1.25rem',
        padding: '14px 18px',
        borderRadius: '999px',
        minHeight: '52px',

        // Visual polish
        border: '2px solid rgba(255,255,255,0.9)',
        background: 'linear-gradient(180deg, rgba(255,126,190,0.95), rgba(255,88,160,0.95))',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)',
        fontWeight: 800,
        letterSpacing: '0.2px',

        // Touch ergonomics
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',

        // Avoid iOS double-tap zoom weirdness
        userSelect: 'none',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.35em', lineHeight: 1 }}>🐾</span>
      <span>Call</span>
    </button>
  );
}