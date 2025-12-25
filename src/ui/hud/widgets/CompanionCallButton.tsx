interface CompanionCallButtonProps {
  onCall?: () => void;
}

export default function CompanionCallButton({ onCall }: CompanionCallButtonProps) {
  return (
    <button className="companion-call-button" onClick={onCall}>
      🐕 Call Companion
    </button>
  );
}
