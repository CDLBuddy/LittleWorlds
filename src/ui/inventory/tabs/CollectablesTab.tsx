// src/ui/inventory/tabs/CollectablesTab.tsx
import { useState, useEffect } from 'react';
import { eventBus, type AppEvent } from '@game/shared/events';
import { COLLECTIONS } from '@game/content/collections';
import type { SharedState } from '@game/systems/saves/SaveSystem';
import styles from '../inventory.module.css';

/**
 * Collectables Tab - Displays shared collection progress across all areas
 */
export function CollectablesTab() {
  const [shared, setShared] = useState<SharedState>({
    findsByArea: {},
    trophiesByArea: {},
    postcardsByArea: {},
    audioByArea: {},
    campUpgrades: [],
  });

  useEffect(() => {
    // Request initial collections state
    eventBus.emit({ type: 'ui/getCollections' });

    // Subscribe to collections updates
    const unsub = eventBus.on((evt: AppEvent) => {
      if (evt.type === 'game/collectionsUpdate') {
        setShared(evt.shared);
      }
    });

    return unsub;
  }, []);

  const areas = Object.values(COLLECTIONS);
  const totalFinds = areas.reduce((sum, area) => {
    const found = shared.findsByArea[area.areaId]?.length || 0;
    return sum + found;
  }, 0);

  if (totalFinds === 0) {
    return (
      <div>
        <div className={styles.sharedLabel}>
          ✨ Shared between twins
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🌟</div>
          <div className={styles.emptyText}>No collectables yet</div>
          <div className={styles.emptySubtext}>Explore worlds to find hidden treasures</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.sharedLabel}>
        ✨ Shared between twins
      </div>
      <div style={{ padding: '16px' }}>
        {areas.map((area) => {
          const foundIds = shared.findsByArea[area.areaId] || [];
          const hasTrophy = shared.trophiesByArea[area.areaId] || false;
          const progress = foundIds.length;
          const total = area.finds.length;

          return (
            <div key={area.areaId} style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              background: 'rgba(139, 111, 71, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 111, 71, 0.3)',
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#5a4527' }}>
                    {area.areaId.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b6f47' }}>
                    {progress}/{total} finds
                  </div>
                </div>
                {hasTrophy && (
                  <div style={{ fontSize: '24px' }} title={area.trophy.name}>
                    {area.trophy.icon}
                  </div>
                )}
              </div>
              
              {/* Progress pips */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {area.finds.map((find, idx) => {
                  const found = foundIds.includes(find.id);
                  return (
                    <div 
                      key={find.id} 
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: found ? '#d4af37' : 'rgba(139, 111, 71, 0.2)',
                        border: found ? '2px solid #8b6f47' : '2px solid rgba(139, 111, 71, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                      }}
                      title={found ? find.name : '???'}
                    >
                      {found ? find.icon : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
