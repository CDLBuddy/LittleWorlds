import type { PromptIcon } from '@game/shared/events';

interface HintPulseProps {
  icon: PromptIcon;
}

// Icon-only prompts (no text for toddlers)
const iconEmoji: Record<PromptIcon, string> = {
  hand: '✋',
  axe: '🪓',
  log: '🪵',
  fire: '🔥',
  tent: '⛺',
  fish: '🐟',
  paw: '🐾',
};

export default function HintPulse({ icon }: HintPulseProps) {
  return (
    <div
      className="hint-pulse"
      style={{
        fontSize: '4rem',
        animation: 'pulse 1.5s ease-in-out infinite',
        textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
      }}
    >
      <span role="img" aria-label={icon}>
        {iconEmoji[icon]}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
