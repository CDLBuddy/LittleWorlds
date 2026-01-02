// src/ui/inventory/tabs/ToolsTab.tsx
import { ITEMS } from '@game/content/items';
import styles from '../inventory.module.css';

interface ToolsTabProps {
  items: string[];
}

/**
 * Tools Tab - Pure component that renders items from props
 * NO EVENT SUBSCRIPTIONS - receives data from parent
 */
export function ToolsTab({ items }: ToolsTabProps) {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎒</div>
        <div className={styles.emptyText}>No tools yet</div>
        <div className={styles.emptySubtext}>Complete tasks to collect tools</div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.itemGrid}>
        {items.map((itemId, idx) => {
          const itemData = ITEMS[itemId];
          
          return (
            <div key={`${itemId}-${idx}`} className={styles.itemCard}>
              <div className={styles.itemIcon}>
                {itemData?.icon || '📦'}
              </div>
              <div className={styles.itemName}>
                {formatItemName(itemId)}
              </div>
              {itemData?.description && (
                <div className={styles.itemDescription}>
                  {itemData.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format item ID into display name
 * slingshot -> Slingshot
 * steel_balls -> Steel Balls
 */
function formatItemName(itemId: string): string {
  return itemId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
