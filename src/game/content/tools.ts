/**
 * Tool Registry - Interactive tools that can be equipped and used
 * Phase v0.8.0 - Interactive Tool System
 */

export type ToolType = 'melee' | 'ranged' | 'utility';

export interface ProjectileConfig {
  /** Ammo item ID required for this tool */
  ammoType: string;
  /** Projectile speed in units/second */
  speed: number;
  /** Damage value (for future use) */
  damage: number;
  /** Maximum range in units */
  range: number;
  /** Cooldown between shots in seconds */
  cooldown: number;
  /** Apply gravity to projectile */
  useGravity: boolean;
  /** Projectile lifetime in seconds */
  lifetime: number;
}

export interface ToolDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: ToolType;
  /** Can this tool be equipped and actively used? */
  isInteractive: boolean;
  /** Path to 3D model for hand attachment */
  modelPath?: string;
  /** Hand bone attachment name (or null for simple parenting) */
  attachBone?: string | null;
  /** Position offset from bone/parent */
  offset?: { x: number; y: number; z: number };
  /** Rotation offset (Euler angles in radians) */
  rotation?: { x: number; y: number; z: number };
  /** Projectile configuration for ranged tools */
  projectile?: ProjectileConfig;
  /** Tool-specific usage configuration */
  usageConfig?: {
    /** Does this tool require ammo? */
    requiresAmmo?: boolean;
    /** Maximum uses before tool breaks (0 = infinite) */
    durability?: number;
    /** Animation names for this tool */
    animations?: {
      equip?: string;
      fire?: string;
      reload?: string;
      unequip?: string;
    };
  };
}

/**
 * Interactive Tool Registry
 * Only tools marked as interactive can be equipped and used
 */
export const INTERACTIVE_TOOLS: Record<string, ToolDef> = {
  slingshot: {
    id: 'slingshot',
    name: 'Slingshot',
    icon: '🎯',
    description: 'A simple slingshot for target practice',
    type: 'ranged',
    isInteractive: true,
    modelPath: 'assets/models/Slingshot.glb',
    attachBone: 'RightHand', // Will fallback to simple parenting if bone not found
    offset: { x: 0.05, y: 0.0, z: 0.1 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    projectile: {
      ammoType: 'steel_balls',
      speed: 35,
      damage: 10,
      range: 50,
      cooldown: 0.6,
      useGravity: true,
      lifetime: 5.0,
    },
    usageConfig: {
      requiresAmmo: true,
      durability: 0, // Infinite uses
      animations: {
        equip: 'slingshot_equip',
        fire: 'slingshot_fire',
      },
    },
  },
  
  // Future tools (marked interactive but not fully implemented yet)
  axe: {
    id: 'axe',
    name: 'Axe',
    icon: '🪓',
    description: 'A sharp axe for chopping',
    type: 'melee',
    isInteractive: false, // Will be enabled in future phase
    modelPath: 'assets/models/tools/axe.glb',
    attachBone: 'RightHand',
    offset: { x: 0.0, y: -0.1, z: 0.15 },
    rotation: { x: Math.PI / 4, y: 0, z: 0 },
    usageConfig: {
      requiresAmmo: false,
      durability: 100, // 100 swings before breaking
      animations: {
        equip: 'axe_equip',
        fire: 'axe_swing',
      },
    },
  },
  
  multitool: {
    id: 'multitool',
    name: 'Multitool',
    icon: '🔧',
    description: 'A versatile multitool',
    type: 'utility',
    isInteractive: false, // Will be enabled in future phase
    modelPath: 'assets/models/tools/multitool.glb',
    attachBone: 'RightHand',
    offset: { x: 0.0, y: 0.0, z: 0.08 },
    rotation: { x: 0, y: 0, z: 0 },
    usageConfig: {
      requiresAmmo: false,
      durability: 0, // Infinite uses
      animations: {
        equip: 'multitool_equip',
        fire: 'multitool_use',
      },
    },
  },
};

/**
 * Get all tool IDs
 */
export const ALL_TOOL_IDS = Object.keys(INTERACTIVE_TOOLS);

/**
 * Type helper for tool IDs
 */
export type ToolId = keyof typeof INTERACTIVE_TOOLS;

/**
 * Check if an item ID is an interactive tool
 */
export function isInteractiveTool(itemId: string): itemId is ToolId {
  return itemId in INTERACTIVE_TOOLS && INTERACTIVE_TOOLS[itemId].isInteractive;
}

/**
 * Get interactive tools from an inventory list
 * Filters out non-interactive items and returns only usable tools
 * 
 * @param inventoryItems - Array of item IDs from player inventory
 * @returns Array of tool IDs that are interactive
 * 
 * @example
 * const inventory = ['slingshot', 'steel_balls', 'axe', 'stick'];
 * const tools = getInteractiveToolsFromInventory(inventory);
 * // Returns: ['slingshot'] (axe not yet interactive, stick not a tool)
 */
export function getInteractiveToolsFromInventory(inventoryItems: string[]): ToolId[] {
  return inventoryItems.filter((itemId): itemId is ToolId => {
    return isInteractiveTool(itemId);
  });
}

/**
 * Check if a tool requires ammo and if ammo is available in inventory
 * 
 * @param toolId - Tool to check
 * @param inventoryItems - Current inventory items
 * @returns true if tool has ammo or doesn't need ammo
 */
export function hasRequiredAmmo(toolId: ToolId, inventoryItems: string[]): boolean {
  const tool = INTERACTIVE_TOOLS[toolId];
  
  // Tool doesn't require ammo
  if (!tool.usageConfig?.requiresAmmo || !tool.projectile) {
    return true;
  }
  
  // Check if ammo is in inventory
  return inventoryItems.includes(tool.projectile.ammoType);
}

/**
 * Get ammo count for a tool from inventory
 * Returns 0 if tool doesn't use ammo or ammo not found
 */
export function getAmmoCount(toolId: ToolId, inventory: Record<string, number>): number {
  const tool = INTERACTIVE_TOOLS[toolId];
  
  if (!tool.projectile?.ammoType) {
    return 0;
  }
  
  return inventory[tool.projectile.ammoType] || 0;
}

/**
 * Validation: Check if tool definition is valid
 * Useful for debugging and data validation
 */
export function validateToolDef(tool: ToolDef): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!tool.id) errors.push('Tool missing id');
  if (!tool.name) errors.push('Tool missing name');
  if (!tool.type) errors.push('Tool missing type');
  
  if (tool.isInteractive && !tool.modelPath) {
    errors.push(`Interactive tool '${tool.id}' missing modelPath`);
  }
  
  if (tool.type === 'ranged' && tool.isInteractive && !tool.projectile) {
    errors.push(`Ranged tool '${tool.id}' missing projectile config`);
  }
  
  if (tool.projectile && !tool.projectile.ammoType) {
    errors.push(`Tool '${tool.id}' projectile missing ammoType`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all tools in registry
 * Run this in DEV mode to catch data issues early
 */
export function validateAllTools(): void {
  if (!import.meta.env.DEV) return;
  
  let hasErrors = false;
  
  for (const [id, tool] of Object.entries(INTERACTIVE_TOOLS)) {
    const validation = validateToolDef(tool);
    if (!validation.valid) {
      console.error(`[ToolRegistry] Invalid tool '${id}':`, validation.errors);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.warn('[ToolRegistry] Tool validation found errors. Fix before release!');
  } else {
    console.log('[ToolRegistry] All tools validated successfully ✓');
  }
}
