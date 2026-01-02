// src/ui/inventory/InventoryHUD.tsx
import { useState, useEffect } from 'react';
import { eventBus } from '@game/shared/events';
import { InventoryPanel } from './InventoryPanel.tsx';
import { useInventoryFeed } from './state/useInventoryFeed';
import styles from './inventory.module.css';

/**
 * Inventory HUD - Bag button + panel overlay
 * SINGLE SOURCE OF TRUTH for inventory state via useInventoryFeed
 */
export function InventoryHUD() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeRole, activeItems } = useInventoryFeed();

  useEffect(() => {
    // Keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setIsOpen(prev => !prev);
        // Request fresh inventory when opening
        if (!isOpen) {
          eventBus.emit({ type: 'ui/getInventory' });
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      {/* Bag Button */}
      <div
        className={styles.bagButton}
        onClick={() => {
          setIsOpen(true);
          eventBus.emit({ type: 'ui/getInventory' });
        }}
      >
        {/* Bag Icon SVG */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
          <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
          <path d="M4 8h16l-1 12H5L4 8z" fill="#8b6f47" />
          <path d="M4 8h16" />
        </svg>

        {/* Item Count Badge */}
        {activeItems.length > 0 && (
          <div className={styles.badge}>
            {activeItems.length}
          </div>
        )}
      </div>

      {/* Inventory Panel Overlay */}
      {isOpen && (
        <InventoryPanel 
          currentRole={activeRole} 
          items={activeItems}
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
