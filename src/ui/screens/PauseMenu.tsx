interface PauseMenuProps {
  onResume: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onSettings, onQuit }: PauseMenuProps) {
  return (
    <div className="pause-menu">
      <h2>Paused</h2>
      <div className="pause-buttons">
        <button onClick={onResume}>Resume</button>
        <button onClick={onSettings}>Settings</button>
        <button onClick={onQuit}>Quit to Menu</button>
      </div>
    </div>
  );
}
