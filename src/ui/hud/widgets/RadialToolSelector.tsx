/**
 * Radial Tool Selector - Phase 3
 * Half-circle dial for selecting interactive tools
 */

import { useMemo } from 'react';
import { INTERACTIVE_TOOLS, type ToolId } from '@game/content/tools';
import styles from './RadialToolSelector.module.css';

interface RadialToolSelectorProps {
  /** List of available tool IDs to display */
  tools: ToolId[];
  /** Currently equipped tool (highlighted) */
  equippedTool: ToolId | null;
  /** Called when user selects a tool */
  onSelect: (toolId: ToolId | null) => void;
  /** Called when selector should close */
  onClose: () => void;
}

interface ToolPosition {
  toolId: ToolId;
  x: number;
  y: number;
  angle: number;
}

export function RadialToolSelector({
  tools,
  equippedTool,
  onSelect,
  onClose,
}: RadialToolSelectorProps) {
  // Calculate positions for tools along a 180° arc
  const toolPositions = useMemo((): ToolPosition[] => {
    const arcRadius = 120; // pixels from center
    const startAngle = 0; // degrees (right side)
    const toolCount = tools.length;

    if (toolCount === 0) return [];

    // Distribute tools evenly along the arc
    const angleStep = 180 / (toolCount + 1);

    return tools.map((toolId, index) => {
      const angle = startAngle + angleStep * (index + 1);
      // Convert to radians and calculate position
      const radians = (angle * Math.PI) / 180;
      const x = Math.cos(radians) * arcRadius;
      const y = -Math.sin(radians) * arcRadius; // Negative because CSS y increases downward

      return { toolId, x, y, angle };
    });
  }, [tools]);

  const handleToolClick = (toolId: ToolId) => {
    onSelect(toolId);
    onClose();
  };

  const handleUnequip = () => {
    onSelect(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.radialContainer}>
        {/* Center anchor point */}
        <div className={styles.centerAnchor} />

        {/* Tools positioned along arc */}
        {toolPositions.map(({ toolId, x, y }) => {
          const tool = INTERACTIVE_TOOLS[toolId];
          const isEquipped = toolId === equippedTool;

          return (
            <button
              key={toolId}
              className={`${styles.toolSlot} ${isEquipped ? styles.equipped : ''}`}
              style={{
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              }}
              onClick={() => handleToolClick(toolId)}
              title={tool.name}
            >
              <span className={styles.toolIcon}>{tool.icon}</span>
              <span className={styles.toolName}>{tool.name}</span>
            </button>
          );
        })}

        {/* Unequip button at bottom center */}
        <button
          className={`${styles.unequipButton} ${!equippedTool ? styles.disabled : ''}`}
          onClick={handleUnequip}
          disabled={!equippedTool}
          title="Unequip Tool"
        >
          <span className={styles.unequipIcon}>✖</span>
          <span className={styles.unequipText}>Unequip</span>
        </button>
      </div>
    </div>
  );
}
