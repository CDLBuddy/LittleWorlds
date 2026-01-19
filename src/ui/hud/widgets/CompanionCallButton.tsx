import { eventBus } from '@game/shared/events';

export default function CompanionCallButton() {
  const handleCall = () => {
    console.log('[CompanionCallButton] Button clicked, emitting ui/callCompanion');
    eventBus.emit({ type: 'ui/callCompanion' });
  };

  // This places it above-left of the MOVE stick (which sits at ~18px + safe-area).
  // Stick is 140px tall; we push this above that, with a little gap.
  const bottom = 'calc(env(safe-area-inset-bottom, 0px) + 18px + 140px + 14px)';

  return (
    <button
      className="companion-call-button"
      onClick={handleCall}
      aria-label="Call companion"
      style={{
        position: 'fixed',
        left: '20px',
        bottom,
        width: '74px',
        height: '74px',
        borderRadius: '999px',
        border: '2px solid rgba(255,255,255,0.9)',
        background: 'linear-gradient(180deg, rgba(255,105,180,0.95), rgba(255,120,160,0.88))',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 10px 26px rgba(0,0,0,0.25)',
        fontWeight: 800,
        fontSize: '16px',
        display: 'grid',
        placeItems: 'center',
        zIndex: 40, // IMPORTANT: keep it below sticks (sticks should be 50)
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
    >
      🐾
    </button>
  );
}