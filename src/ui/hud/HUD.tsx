import HintPulse from './widgets/HintPulse';
import InventoryBubbles from './widgets/InventoryBubbles';
import CompanionCallButton from './widgets/CompanionCallButton';

export default function HUD() {
  return (
    <div className="hud">
      <HintPulse />
      <InventoryBubbles />
      <CompanionCallButton />
    </div>
  );
}
