import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { RoleId, AreaId } from '@game/content/areas';
import { AREAS } from '@game/content/areas';
import { useGameSession } from '@game/session/useGameSession';
import { saveFacade } from '@game/systems/saves/saveFacade';

export default function ProfileSelect() {
  const navigate = useNavigate();
  const { setRole, setArea } = useGameSession();
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);

  const handleRoleSelect = (roleId: RoleId) => {
    setSelectedRole(roleId);
    setRole(roleId);
    saveFacade.setLastSelectedRole(roleId);
  };

  const handleNewGame = () => {
    if (!selectedRole) return;
    
    // Reset role progress
    saveFacade.resetRole(selectedRole);
    
    // Start at backyard
    setArea('backyard');
    navigate('/game');
  };

  const handleContinue = (areaId: AreaId) => {
    if (!selectedRole) return;
    
    setArea(areaId);
    navigate('/game');
  };

  // Get unlocked areas for selected role
  const unlockedAreas = selectedRole
    ? saveFacade.getUnlockedAreas(selectedRole)
    : [];

  return (
    <div 
      className="profile-select" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#7db3e8',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}
    >
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Choose Your Adventure</h2>
      
      {/* Role Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Choose Character</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => handleRoleSelect('boy')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '0.5rem',
              border: selectedRole === 'boy' ? '3px solid white' : '2px solid transparent',
              backgroundColor: selectedRole === 'boy' ? '#2d5f9e' : '#4a90e2',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            👦 Boy
          </button>
          <button
            onClick={() => handleRoleSelect('girl')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '0.5rem',
              border: selectedRole === 'girl' ? '3px solid white' : '2px solid transparent',
              backgroundColor: selectedRole === 'girl' ? '#2d5f9e' : '#4a90e2',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            👧 Girl
          </button>
        </div>
      </div>

      {/* New Game / Continue sections */}
      {selectedRole ? (
        <>
          {/* New Game */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>New Game</h3>
            <button
              onClick={handleNewGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Start New ({selectedRole})
            </button>
          </div>

          {/* Continue */}
          {unlockedAreas.length > 0 && (
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Continue</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {unlockedAreas.map((areaId) => {
                  const area = AREAS[areaId as AreaId];
                  if (!area) return null;
                  
                  return (
                    <button
                      key={areaId}
                      onClick={() => handleContinue(areaId as AreaId)}
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      {area.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Please select a character above
        </p>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          borderRadius: '0.5rem',
          border: '2px solid white',
          backgroundColor: 'transparent',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Back
      </button>
    </div>
  );
}
