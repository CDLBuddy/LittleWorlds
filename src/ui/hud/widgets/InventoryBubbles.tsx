// src/ui/hud/widgets/InventoryBubbles.tsx

interface InventoryBubblesProps {
  items?: string[];
}

function normalizeLabel(raw: string): string {
  const s = String(raw ?? '').trim();
  // Keep it simple + safe for UI. (No fancy title-casing that can mangle IDs.)
  return s.length ? s : 'Unknown';
}

export default function InventoryBubbles({ items = [] }: InventoryBubblesProps) {
  // Avoid rendering empty chrome (also helps pointer-events layering on HUD)
  if (!items || items.length === 0) return null;

  return (
    <div
      className="inventory-bubbles"
      role="list"
      aria-label="Inventory"
      // Note: styling should live in CSS, but this tiny hint helps mobile HUD overlays.
      style={{ pointerEvents: 'none' }}
    >
      {items.map((rawItem, index) => {
        const label = normalizeLabel(rawItem);
        return (
          <div
            key={`${label}-${index}`}
            className="inventory-bubble"
            role="listitem"
            aria-label={label}
            title={label}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}