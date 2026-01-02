// src/ui/inventory/InventoryPanel.tsx
import { useState } from 'react';
import { eventBus } from '@game/shared/events';
import { ToolsTab } from './tabs/ToolsTab.tsx';
import { CollectablesTab } from './tabs/CollectablesTab.tsx';
import { MemoriesTab } from './tabs/MemoriesTab.tsx';
import styles from './inventory.module.css';

type TabId = 'tools' | 'collectables' | 'memories';

interface InventoryPanelProps {
  currentRole: 'boy' | 'girl';
  items: string[];
  onClose: () => void;
}

/**
 * Inventory Panel - Notebook-style interface with tabs
 */
export function InventoryPanel({ currentRole, items, onClose }: InventoryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('tools');

  const handleSwitchCharacter = () => {
    const nextRole = currentRole === 'boy' ? 'girl' : 'boy';
    eventBus.emit({ type: 'ui/switchCharacter', roleId: nextRole });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {/* Bag Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
              <path d="M4 8h16l-1 12H5L4 8z" fill="#8b6f47" />
              <path d="M4 8h16" />
            </svg>
            <span className={styles.title}>BACKPACK</span>
            <span className={styles.roleIndicator}>
              {currentRole === 'boy' ? '👦' : '👧'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Switch Character Button */}
            <button className={styles.switchButton} onClick={handleSwitchCharacter}>
              <span>{currentRole === 'boy' ? '👧' : '👦'}</span>
              <span>Switch</span>
            </button>

            {/* Close Button */}
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'tools' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            🔧 Tools
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'collectables' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('collectables')}
          >
            🌟 Collectables
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'memories' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('memories')}
          >
            📸 Memories
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.content}>
          {activeTab === 'tools' && <ToolsTab items={items} />}
          {activeTab === 'collectables' && <CollectablesTab />}
          {activeTab === 'memories' && <MemoriesTab />}
        </div>

        {/* Hint */}
        <div style={{ 
          padding: '10px', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: '#8b6f47',
          borderTop: '1px solid #5a4527'
        }}>
          Press <strong>ESC</strong> to close
        </div>
      </div>
    </div>
  );
}
