import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { eventBus } from '@game/shared/events';

export default function SettingsScreen() {
  const navigate = useNavigate();
  
  // Volume state (0-100 for UI, converted to 0-1 for audio system)
  const [masterVolume, setMasterVolume] = useState(70);
  const [musicVolume, setMusicVolume] = useState(40);
  const [sfxVolume, setSfxVolume] = useState(60);

  const handleMasterChange = (value: number) => {
    setMasterVolume(value);
    eventBus.emit({ type: 'ui/audio/volume', bus: 'master', value: value / 100 });
  };

  const handleMusicChange = (value: number) => {
    setMusicVolume(value);
    eventBus.emit({ type: 'ui/audio/volume', bus: 'music', value: value / 100 });
  };

  const handleSfxChange = (value: number) => {
    setSfxVolume(value);
    eventBus.emit({ type: 'ui/audio/volume', bus: 'sfx', value: value / 100 });
  };

  return (
    <div
      className="settings-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#7db3e8',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}
    >
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Settings</h2>

      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Master Volume */}
        <div>
          <label
            htmlFor="master-volume"
            style={{
              display: 'block',
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            Master Volume: {masterVolume}%
          </label>
          <input
            id="master-volume"
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => handleMasterChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Music Volume */}
        <div>
          <label
            htmlFor="music-volume"
            style={{
              display: 'block',
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            Music Volume: {musicVolume}%
          </label>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="100"
            value={musicVolume}
            onChange={(e) => handleMusicChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* SFX Volume */}
        <div>
          <label
            htmlFor="sfx-volume"
            style={{
              display: 'block',
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}
          >
            SFX Volume: {sfxVolume}%
          </label>
          <input
            id="sfx-volume"
            type="range"
            min="0"
            max="100"
            value={sfxVolume}
            onChange={(e) => handleSfxChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '3rem',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          borderRadius: '0.5rem',
          border: '2px solid white',
          backgroundColor: 'transparent',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Back to Menu
      </button>
    </div>
  );
}
