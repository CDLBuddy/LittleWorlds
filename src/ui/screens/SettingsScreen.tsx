import { useNavigate } from 'react-router-dom';

export default function SettingsScreen() {
  const navigate = useNavigate();

  return (
    <div className="settings-screen">
      <h2>Settings</h2>
      {/* TODO: Add settings controls */}
      <button onClick={() => navigate('/')}>Back</button>
    </div>
  );
}
