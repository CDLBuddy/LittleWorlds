/**
 * Tool HUD Widget
 * Displays currently equipped tool and allows opening radial selector
 * Phase v0.8.0 - Interactive Tool System
 */

import { useState, useEffect } from 'react';
import { eventBus, type AppEvent } from '@game/shared/events';
import { INTERACTIVE_TOOLS, getInteractiveToolsFromInventory, type ToolId } from '@game/content/tools';
import { RadialToolSelector } from './RadialToolSelector';
import styles from './ToolHUD.module.css';

export function ToolHUD() {
  const [equippedTool, setEquippedTool] = useState<ToolId | null>(null);
  const [currentRole, setCurrentRole] = useState<'boy' | 'girl'>('boy');
  const [showRadialSelector, setShowRadialSelector] = useState(false);
  const [availableTools, setAvailableTools] = useState<ToolId[]>([]);

  useEffect(() => {
    // Listen for tool equipped events and inventory updates
    const unsubscribe = eventBus.on((event: AppEvent) => {
      if (event.type === 'game/toolEquipped') {
        setEquippedTool(event.toolId);
        setCurrentRole(event.roleId);
      } else if (event.type === 'game/characterSwitch') {
        // Clear tool on character switch
        setEquippedTool(null);
        setCurrentRole(event.roleId);
      } else if (event.type === 'game/inventoryUpdate') {
        // Update available tools from inventory
        const tools = getInteractiveToolsFromInventory(event.items);
        setAvailableTools(tools);
      } else if (event.type === 'game/toolError') {
        // Show error toast
        eventBus.emit({
          type: 'ui/toast',
          level: 'error',
          message: event.message,
        });
      }
    });

    // Request initial inventory
    eventBus.emit({ type: 'ui/getInventory' });

    return unsubscribe;
  }, []);

  // Don't render for girl character (boy only has tools currently)
  if (currentRole === 'girl') {
    return null;
  }

  const handleClick = () => {
    setShowRadialSelector(true);
  };

  const handleCloseRadial = () => {
    setShowRadialSelector(false);
  };

  const handleToolSelect = (toolId: ToolId | null) => {
    if (toolId === null) {
      // Unequip
      eventBus.emit({ type: 'ui/tool/unequip', roleId: currentRole });
    } else {
      // Equip tool
      eventBus.emit({ type: 'ui/tool/equip', toolId, roleId: currentRole });
    }
  };

  const tool = equippedTool ? INTERACTIVE_TOOLS[equippedTool] : null;

  return (
    <>
      {/* Tool HUD Bubble */}
      <div className={styles.toolHUD}>
        <button
          className={`${styles.toolButton} ${equippedTool ? styles.equipped : styles.empty}`}
          onClick={handleClick}
          aria-label={equippedTool ? `Equipped: ${tool?.name}` : 'No tool equipped'}
        >
          {/* Tool Icon */}
          <div className={styles.toolIcon}>
            {equippedTool && tool ? tool.icon : '🔧'}
          </div>

          {/* Equipped indicator glow */}
          {equippedTool && <div className={styles.equippedGlow} />}
        </button>

        {/* Tool name tooltip on hover */}
        {equippedTool && tool && (
          <div className={styles.toolTooltip}>
            {tool.name}
          </div>
        )}
      </div>

      {/* Radial Selector */}
      {showRadialSelector && (
        <RadialToolSelector
          tools={availableTools}
          equippedTool={equippedTool}
          onSelect={handleToolSelect}
          onClose={handleCloseRadial}
        />
      )}
    </>
  );
}
