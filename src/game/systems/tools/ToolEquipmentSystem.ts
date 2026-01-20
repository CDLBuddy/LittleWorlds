/**
 * Tool Equipment System
 * Phase v0.8.0 - Phase 4
 * 
 * Manages tool state, loading, and attachment to player characters
 */

import type { Scene, AbstractMesh, TransformNode, Skeleton } from '@babylonjs/core';
import { Vector3, Quaternion } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import { INTERACTIVE_TOOLS, type ToolId } from '@game/content/tools';
import type { Player } from '@game/entities/player/Player';
import { loadGlb } from '@game/assets/loaders/gltf';

type RoleId = 'boy' | 'girl';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

interface ToolState {
  roleId: RoleId;
  toolId: ToolId | null;
  toolMesh: TransformNode | null;
  isLoading: boolean;
}

/**
 * Tool Equipment System
 * Handles tool equip/unequip, model loading, and attachment to player
 */
export class ToolEquipmentSystem {
  private boyState: ToolState = {
    roleId: 'boy',
    toolId: null,
    toolMesh: null,
    isLoading: false,
  };

  private girlState: ToolState = {
    roleId: 'girl',
    toolId: null,
    toolMesh: null,
    isLoading: false,
  };

  private eventBusSub: (() => void) | null = null;
  private boyPlayer: Player | null = null;
  private girlPlayer: Player | null = null;
  private currentRole: RoleId = 'boy';

  constructor(
    private scene: Scene,
    private eventBus: EventBus
  ) {
    this.eventBusSub = this.eventBus.on((event) => {
      if (event.type === 'ui/tool/equip') {
        void this.handleEquip(event.toolId, event.roleId);
      } else if (event.type === 'ui/tool/unequip') {
        this.handleUnequip(event.roleId);
      } else if (event.type === 'game/characterSwitch') {
        this.handleCharacterSwitch(event.roleId);
      }
    });
  }

  /**
   * Set player references (called during game initialization)
   */
  setPlayers(boyPlayer: Player, girlPlayer: Player): void {
    this.boyPlayer = boyPlayer;
    this.girlPlayer = girlPlayer;
  }

  /**
   * Set current active role
   */
  setCurrentRole(roleId: RoleId): void {
    this.currentRole = roleId;
  }

  /**
   * Get current equipped tool for a role
   */
  getEquippedTool(roleId: RoleId): ToolId | null {
    const state = this.getState(roleId);
    return state.toolId;
  }

  /**
   * Check if a role has an equipped tool
   */
  hasEquippedTool(roleId: RoleId): boolean {
    return this.getEquippedTool(roleId) !== null;
  }

  /**
   * Handle tool equip request from UI
   */
  private async handleEquip(toolId: ToolId, roleId: RoleId): Promise<void> {
    const state = this.getState(roleId);

    // Prevent duplicate equips
    if (state.isLoading) {
      console.warn('[ToolEquipmentSystem] Tool load already in progress');
      return;
    }

    if (state.toolId === toolId) {
      console.log('[ToolEquipmentSystem] Tool already equipped:', toolId);
      return;
    }

    // Validate tool exists
    const toolDef = INTERACTIVE_TOOLS[toolId];
    if (!toolDef) {
      this.emitError(roleId, `Unknown tool: ${toolId}`);
      return;
    }

    // Check if tool is interactive
    if (!toolDef.isInteractive) {
      this.emitError(roleId, `${toolDef.name} is not interactive yet`);
      return;
    }

    // Check ammo requirements (will need inventory once that's wired up)
    // TODO: Wire up inventory check once inventory events are available
    // For now, skip ammo check

    // Unequip current tool if any
    if (state.toolId) {
      this.handleUnequip(roleId);
    }

    // Start loading new tool
    state.isLoading = true;

    try {
      const toolMesh = await this.loadToolModel(toolId);
      
      // Check if state changed during async load (user might have switched tools)
      if (state.toolId !== null && !state.isLoading) {
        console.log('[ToolEquipmentSystem] Tool state changed during load, aborting');
        toolMesh.dispose();
        return;
      }

      // Attach tool to player
      this.attachToolToPlayer(toolMesh, toolDef, roleId);

      // Update state
      state.toolId = toolId;
      state.toolMesh = toolMesh;
      state.isLoading = false;

      // Notify UI
      this.eventBus.emit({
        type: 'game/toolEquipped',
        toolId,
        roleId,
      });

      if (import.meta.env.DEV) {
        console.log(`[ToolEquipmentSystem] Equipped ${toolDef.name} for ${roleId}`);
      }
    } catch (error) {
      state.isLoading = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError(roleId, `Failed to load ${toolDef.name}: ${errorMessage}`);
      console.error('[ToolEquipmentSystem] Load error:', error);
    }
  }

  /**
   * Handle tool unequip request from UI
   */
  private handleUnequip(roleId: RoleId): void {
    const state = this.getState(roleId);

    if (!state.toolId && !state.toolMesh) {
      return; // Nothing to unequip
    }

    // Dispose tool mesh
    if (state.toolMesh) {
      state.toolMesh.dispose();
    }

    // Clear state
    const wasEquipped = state.toolId;
    state.toolId = null;
    state.toolMesh = null;
    state.isLoading = false;

    // Notify UI
    this.eventBus.emit({
      type: 'game/toolEquipped',
      toolId: null,
      roleId,
    });

    if (import.meta.env.DEV && wasEquipped) {
      console.log(`[ToolEquipmentSystem] Unequipped tool for ${roleId}`);
    }
  }

  /**
   * Handle character switch - unequip current character's tool
   */
  private handleCharacterSwitch(newRoleId: RoleId): void {
    // Hide previous character's tool (but keep state)
    const prevRole = this.currentRole;
    const prevState = this.getState(prevRole);
    
    if (prevState.toolMesh) {
      prevState.toolMesh.setEnabled(false);
    }

    // Show new character's tool if they have one
    const newState = this.getState(newRoleId);
    if (newState.toolMesh) {
      newState.toolMesh.setEnabled(true);
    }

    this.currentRole = newRoleId;

    if (import.meta.env.DEV) {
      console.log(`[ToolEquipmentSystem] Character switch: ${prevRole} -> ${newRoleId}`);
    }
  }

  /**
   * Load tool 3D model from GLTF file
   */
  private async loadToolModel(toolId: ToolId): Promise<TransformNode> {
    const toolDef = INTERACTIVE_TOOLS[toolId];
    
    if (!toolDef.modelPath) {
      throw new Error(`Tool ${toolId} has no modelPath`);
    }

    // Load GLTF model
    const result = await loadGlb(this.scene, toolDef.modelPath, {
      name: `tool_${toolId}_${Date.now()}`,
      isPickable: false,
      receiveShadows: false,
    });

    // Return the root mesh
    return result.root;
  }

  /**
   * Attach tool mesh to player's hand bone or parent
   */
  private attachToolToPlayer(
    toolMesh: TransformNode,
    toolDef: typeof INTERACTIVE_TOOLS[ToolId],
    roleId: RoleId
  ): void {
    const player = roleId === 'boy' ? this.boyPlayer : this.girlPlayer;
    
    if (!player) {
      console.warn('[ToolEquipmentSystem] Player not found for role:', roleId);
      return;
    }

    // Try to find hand bone if specified
    let attachmentPoint: TransformNode | AbstractMesh = player.mesh;

    if (toolDef.attachBone) {
      // Search for bone in player skeleton
      const skeleton = this.findPlayerSkeleton(player);
      if (skeleton) {
        if (import.meta.env.DEV) {
          console.log('[ToolEquipmentSystem] Available bones:', skeleton.bones.map((b) => b.name));
        }
        const bone = skeleton.bones.find((b) => b.name === toolDef.attachBone);
        if (bone) {
          // Attach to bone
          const boneNode = bone.getTransformNode();
          if (boneNode) {
            attachmentPoint = boneNode;
            if (import.meta.env.DEV) {
              console.log(`[ToolEquipmentSystem] Attaching to bone: ${toolDef.attachBone}`);
            }
          }
        } else if (import.meta.env.DEV) {
          console.warn(`[ToolEquipmentSystem] Bone not found: ${toolDef.attachBone}, using player root`);
          console.warn('[ToolEquipmentSystem] Available bones:', skeleton.bones.map((b) => b.name));
        }
      } else if (import.meta.env.DEV) {
        console.warn('[ToolEquipmentSystem] No skeleton found for player');
      }
    }

    // Parent tool to attachment point
    toolMesh.parent = attachmentPoint;

    // Apply position offset
    if (toolDef.offset) {
      toolMesh.position = new Vector3(
        toolDef.offset.x,
        toolDef.offset.y,
        toolDef.offset.z
      );
    }

    // Apply rotation offset
    if (toolDef.rotation) {
      const quat = Quaternion.FromEulerAngles(
        toolDef.rotation.x,
        toolDef.rotation.y,
        toolDef.rotation.z
      );
      toolMesh.rotationQuaternion = quat;
    }

    // Only show tool for active character
    toolMesh.setEnabled(roleId === this.currentRole);
  }

  /**
   * Find player's skeleton (helper method)
   */
  private findPlayerSkeleton(player: Player): Skeleton | null {
    // Player mesh should have children with skeletons
    // This is a simplified approach - may need refinement based on actual model structure
    const children = player.mesh.getChildren();
    
    for (const child of children) {
      if ('skeleton' in child && child.skeleton && child.skeleton instanceof Object) {
        return child.skeleton as Skeleton;
      }
    }

    return null;
  }

  /**
   * Emit error event to UI
   */
  private emitError(roleId: RoleId, message: string): void {
    this.eventBus.emit({
      type: 'game/toolError',
      roleId,
      message,
    });
  }

  /**
   * Get state for a specific role
   */
  private getState(roleId: RoleId): ToolState {
    return roleId === 'boy' ? this.boyState : this.girlState;
  }

  /**
   * Cleanup on dispose
   */
  dispose(): void {
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }

    // Dispose all tool meshes
    if (this.boyState.toolMesh) {
      this.boyState.toolMesh.dispose();
    }
    if (this.girlState.toolMesh) {
      this.girlState.toolMesh.dispose();
    }
  }
}
