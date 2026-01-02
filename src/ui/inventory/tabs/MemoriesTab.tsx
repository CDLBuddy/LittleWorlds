// src/ui/inventory/tabs/MemoriesTab.tsx
import { useState, useEffect } from 'react';
import { eventBus, type AppEvent } from '@game/shared/events';
import { COLLECTIONS } from '@game/content/collections';
import type { SharedState } from '@game/systems/saves/SaveSystem';
import styles from '../inventory.module.css';

/**
 * Memories Tab - Displays postcards and audio unlocks
 */
export function MemoriesTab() {
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
  const unlockedPostcards = areas.filter(area => shared.postcardsByArea[area.areaId]);

  if (unlockedPostcards.length === 0) {
    return (
      <div>
        <div className={styles.sharedLabel}>
          ✨ Shared between twins
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📸</div>
          <div className={styles.emptyText}>No memories yet</div>
          <div className={styles.emptySubtext}>Find serene spots to unlock postcards</div>
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
          gap: '12px' 
        }}>
          {areas.map((area) => {
            const hasPostcard = shared.postcardsByArea[area.areaId] || false;
            const hasAudio = shared.audioByArea[area.areaId] || false;
            const hasTrophy = shared.trophiesByArea[area.areaId] || false;

            if (!hasPostcard && !hasTrophy) return null;

            return (
              <div key={area.areaId} style={{
                padding: '12px',
                background: hasPostcard ? 'rgba(212, 175, 55, 0.1)' : 'rgba(139, 111, 71, 0.1)',
                border: hasPostcard ? '2px solid #d4af37' : '2px solid rgba(139, 111, 71, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {hasPostcard ? '📮' : '🔒'}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#5a4527', marginBottom: '4px' }}>
                  {hasPostcard ? area.postcard.name : area.areaId.toUpperCase()}
                </div>
                {hasPostcard && (
                  <>
                    <div style={{ fontSize: '10px', color: '#8b6f47', marginBottom: '6px' }}>
                      {area.postcard.sereneAction}
                    </div>
                    <div style={{ fontSize: '16px' }}>
                      {hasAudio ? '🔊' : '🔇'}
                      <span style={{ fontSize: '10px', marginLeft: '4px', color: '#8b6f47' }}>
                        {hasAudio ? 'Audio unlocked' : 'Audio locked'}
                      </span>
                    </div>
                  </>
                )}
                {hasTrophy && (
                  <div style={{ fontSize: '20px', marginTop: '6px' }}>
                    {area.trophy.icon}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
