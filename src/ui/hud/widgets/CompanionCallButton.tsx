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
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        fontSize: '2rem',
        padding: '15px 25px',
        borderRadius: '50px',
        border: '3px solid #fff',
        backgroundColor: '#4a90e2',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontWeight: 'bold',
        pointerEvents: 'auto',
      }}
    >
      🐾 Call
    </button>
  );
}
