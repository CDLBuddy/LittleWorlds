import type { PromptIcon } from '@game/shared/events';

interface HintPulseProps {
  icon: PromptIcon;
  dwellProgress?: number; // 0..1
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
  book: '📖',
  knife: '🛠️',
  spark: '✨',
  knot: '🪢',
  target: '🎯',
};

export default function HintPulse({ icon, dwellProgress = 0 }: HintPulseProps) {
  const size = 80; // Icon container size
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate dash offset for progress
  const dashOffset = circumference * (1 - dwellProgress);
  
  return (
    <div
      className="hint-pulse"
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Dwell progress ring */}
      {dwellProgress > 0 && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)', // Start from top
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 215, 0, 0.8)" // Gold color
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.05s linear',
            }}
          />
        </svg>
      )}
      
      {/* Icon emoji */}
      <span
        role="img"
        aria-label={icon}
        style={{
          fontSize: '4rem',
          animation: 'pulse 1.5s ease-in-out infinite',
          textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
          position: 'relative',
          zIndex: 1,
        }}
      >
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
