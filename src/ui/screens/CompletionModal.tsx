import { eventBus } from '@game/shared/events';
import Modal from '../components/Modal';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletionModal({ isOpen, onClose }: CompletionModalProps) {
  const handlePlayAgain = () => {
    eventBus.emit({ type: 'ui/restart' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.5rem',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          🎉
        </div>
        <h2 style={{ marginBottom: '2rem', color: '#2a9d8f' }}>
          Great Job!
        </h2>
        <button
          onClick={handlePlayAgain}
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            backgroundColor: '#2a9d8f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Play Again
        </button>
      </div>
    </Modal>
  );
}
