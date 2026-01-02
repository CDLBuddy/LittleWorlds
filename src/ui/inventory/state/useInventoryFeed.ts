/**
 * useInventoryFeed - Single source of truth for inventory state
 * 
 * RULES:
 * - Only ONE component should use this hook (InventoryHUD)
 * - Maintains per-role cache (boy/girl separate)
 * - Never clears cache on open/close
 * - All other components receive inventory via props
 */

import { useState, useEffect } from 'react';
import { eventBus, type AppEvent } from '@game/shared/events';

type RoleId = 'boy' | 'girl';

interface InventoryCache {
  boy: string[];
  girl: string[];
}

interface InventoryFeed {
  activeRole: RoleId;
  activeItems: string[];
  countsByRole: { boy: number; girl: number };
  itemsByRole: InventoryCache;
}

/**
 * Hook for managing inventory state across role switches.
 * Should only be used by InventoryHUD.
 */
export function useInventoryFeed(): InventoryFeed {
  const [activeRole, setActiveRole] = useState<RoleId>('boy');
  const [cache, setCache] = useState<InventoryCache>({
    boy: [],
    girl: [],
  });

  useEffect(() => {
    // Request initial inventory
    console.log('[useInventoryFeed] Requesting initial inventory');
    eventBus.emit({ type: 'ui/getInventory' });

    // Single subscription for all inventory events
    const unsub = eventBus.on((evt: AppEvent) => {
      if (evt.type === 'game/inventoryUpdate') {
        console.log('[useInventoryFeed] Received inventoryUpdate:', evt.roleId, evt.items);
        setCache(prev => ({
          ...prev,
          [evt.roleId]: evt.items,
        }));
        setActiveRole(evt.roleId);
      } else if (evt.type === 'game/characterSwitch') {
        console.log('[useInventoryFeed] Character switched to:', evt.roleId);
        setActiveRole(evt.roleId);
      } else if (evt.type === 'game/appReady') {
        console.log('[useInventoryFeed] GameApp ready, requesting inventory for:', evt.roleId);
        setActiveRole(evt.roleId);
        // Request inventory now that TaskSystem is guaranteed ready
        eventBus.emit({ type: 'ui/getInventory' });
      }
    });

    return unsub;
  }, []);

  return {
    activeRole,
    activeItems: cache[activeRole],
    countsByRole: {
      boy: cache.boy.length,
      girl: cache.girl.length,
    },
    itemsByRole: cache,
  };
}
