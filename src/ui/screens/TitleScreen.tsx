import { useNavigate } from 'react-router-dom';

export default function TitleScreen() {
  const navigate = useNavigate();

  return (
    <div className="title-screen" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#7db3e8',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Little Worlds</h1>
      <div className="menu-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/game')} 
          style={{
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#4a90e2',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Play
        </button>
        <button 
          onClick={() => navigate('/settings')}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1.2rem',
            borderRadius: '0.5rem',
            border: '2px solid white',
            backgroundColor: 'transparent',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
