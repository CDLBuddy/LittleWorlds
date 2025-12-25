import { useNavigate } from 'react-router-dom';

export default function ProfileSelect() {
  const navigate = useNavigate();

  const handleSelectProfile = (profileId: string) => {
    // TODO: Load profile
    console.log('Selected profile:', profileId);
    navigate('/game');
  };

  return (
    <div className="profile-select">
      <h2>Choose Your Adventure</h2>
      <div className="profile-slots">
        <button onClick={() => handleSelectProfile('slot-1')}>Slot 1</button>
        <button onClick={() => handleSelectProfile('slot-2')}>Slot 2</button>
        <button onClick={() => handleSelectProfile('slot-3')}>Slot 3</button>
      </div>
      <button onClick={() => navigate('/')}>Back</button>
    </div>
  );
}
