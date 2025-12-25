interface HintPulseProps {
  hint?: string;
  visible?: boolean;
}

export default function HintPulse({ hint, visible = false }: HintPulseProps) {
  if (!visible || !hint) return null;

  return (
    <div className="hint-pulse">
      <span>{hint}</span>
    </div>
  );
}
