import { Routes, Route } from 'react-router-dom';
import TitleScreen from '@ui/screens/TitleScreen';
import SettingsScreen from '@ui/screens/SettingsScreen';
import ProfileSelect from '@ui/screens/ProfileSelect';
import GameHost from '@game/GameHost';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route path="/profiles" element={<ProfileSelect />} />
      <Route path="/game" element={<GameHost running={true} />} />
      <Route path="/settings" element={<SettingsScreen />} />
    </Routes>
  );
}
