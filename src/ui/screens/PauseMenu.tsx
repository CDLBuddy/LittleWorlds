interface PauseMenuProps {
  onResume: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onSettings, onQuit }: PauseMenuProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <h2
        style={{
          fontSize: '3rem',
          marginBottom: '40px',
          color: 'white',
          fontFamily: 'Comic Sans MS, cursive',
        }}
      >
        Paused
      </h2>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={onResume}
          style={{
            fontSize: '1.5rem',
            padding: '16px 48px',
            minHeight: '56px',
            minWidth: '250px',
            backgroundColor: '#4a9eff',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontFamily: 'Comic Sans MS, cursive',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          ▶️ Resume
        </button>
        
        <button
          onClick={onSettings}
          style={{
            fontSize: '1.5rem',
            padding: '16px 48px',
            minHeight: '56px',
            minWidth: '250px',
            backgroundColor: '#6b6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontFamily: 'Comic Sans MS, cursive',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          ⚙️ Settings
        </button>
        
        <button
          onClick={onQuit}
          style={{
            fontSize: '1.5rem',
            padding: '16px 48px',
            minHeight: '56px',
            minWidth: '250px',
            backgroundColor: '#8b4545',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontFamily: 'Comic Sans MS, cursive',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          🏠 Quit to Menu
        </button>
      </div>
    </div>
  );
}

