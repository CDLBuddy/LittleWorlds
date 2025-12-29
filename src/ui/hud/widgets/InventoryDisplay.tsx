import { useEffect, useState } from 'react';
import { eventBus, type AppEvent } from '../../../game/shared/events';

/**
 * Visual inventory widget that shows all items the player is carrying.
 * Updates whenever items are added/removed.
 */
export function InventoryDisplay() {
  const [items, setItems] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Request current inventory on mount
    eventBus.emit({ type: 'ui/getInventory' });

    // Listen for inventory updates
    const unsub = eventBus.on((evt: AppEvent) => {
      if (evt.type === 'game/inventoryUpdate') {
        setItems(evt.items);
      }
    });

    return unsub;
  }, []);

  if (items.length === 0) {
    return null; // Don't show empty inventory
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      {/* Collapsed: Bag Icon with Badge */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(145deg, #3a2a1a, #2a1a0a)',
            border: '3px solid #8b6f47',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
        >
          {/* Bag Icon */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
            <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
            <path d="M4 8h16l-1 12H5L4 8z" fill="#8b6f47" />
            <path d="M4 8h16" />
          </svg>
          
          {/* Item Count Badge */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '28px',
              height: '28px',
              background: 'linear-gradient(145deg, #d4af37, #b8941f)',
              border: '2px solid #fff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#2a1a0a',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            {items.length}
          </div>
        </div>
      )}

      {/* Expanded: Item List */}
      {isExpanded && (
        <div
          style={{
            background: 'linear-gradient(145deg, #2a1a0a, #1a0a00)',
            border: '3px solid #8b6f47',
            borderRadius: '12px',
            minWidth: '220px',
            maxWidth: '280px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(90deg, #8b6f47, #6b5537)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #5a4527',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
                <path d="M4 8h16l-1 12H5L4 8z" fill="#8b6f47" />
                <path d="M4 8h16" />
              </svg>
              <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '16px', fontFamily: 'sans-serif' }}>
                INVENTORY
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #8b6f47',
                borderRadius: '4px',
                color: '#d4af37',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                lineHeight: '1',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'}
            >
              ×
            </button>
          </div>

          {/* Item List */}
          <div style={{ padding: '12px', maxHeight: '320px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  style={{
                    padding: '10px 12px',
                    background: 'linear-gradient(145deg, rgba(139, 111, 71, 0.2), rgba(139, 111, 71, 0.1))',
                    border: '1px solid rgba(139, 111, 71, 0.4)',
                    borderRadius: '6px',
                    color: '#f5deb3',
                    fontSize: '14px',
                    fontFamily: 'sans-serif',
                    transition: 'transform 0.15s, border-color 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = 'rgba(139, 111, 71, 0.4)';
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{formatItemName(item)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderTop: '1px solid #5a4527',
              fontSize: '12px',
              color: '#8b6f47',
              textAlign: 'center',
              fontFamily: 'sans-serif',
            }}
          >
            {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

function formatItemName(itemId: string): string {
  // Convert snake_case to Title Case
  return itemId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
