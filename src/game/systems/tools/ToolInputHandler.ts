/**
 * Tool Input Handler
 * Phase v0.8.0 - Phase 7
 * 
 * Handles input for tool aiming and firing
 */

import { Vector3 } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import { INTERACTIVE_TOOLS, type ToolId } from '@game/content/tools';
import type { SlingshotAimSystem } from './SlingshotAimSystem';
import type { ProjectileSystem } from './ProjectileSystem';
import type { Player } from '@game/entities/player/Player';

type RoleId = 'boy' | 'girl';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

/**
 * Tool Input Handler
 * Manages input for tool aiming and firing
 */
export class ToolInputHandler {
  private isAiming = false;
  private lastFireTime = 0;
  private currentRole: RoleId = 'boy';
  private equippedTool: ToolId | null = null;
  private inventory: string[] = [];
  private eventBusSub: (() => void) | null = null;
  private pointerDownHandler: ((e: PointerEvent) => void) | null = null;
  private pointerUpHandler: ((e: PointerEvent) => void) | null = null;
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(
    private eventBus: EventBus,
    private aimSystem: SlingshotAimSystem,
    private projectileSystem: ProjectileSystem,
    private getBoyPlayer: () => Player,
    private getGirlPlayer: () => Player
  ) {
    // Subscribe to events
    this.eventBusSub = this.eventBus.on((event) => {
      if (event.type === 'game/toolEquipped') {
        this.equippedTool = event.toolId;
        this.currentRole = event.roleId;
        
        // Request fresh inventory when tool is equipped (in case we missed the initial broadcast)
        if (import.meta.env.DEV) {
          console.log('[ToolInputHandler] Tool equipped, requesting inventory');
        }
        this.eventBus.emit({ type: 'ui/getInventory' });
      } else if (event.type === 'game/characterSwitch') {
        this.currentRole = event.roleId;
        this.equippedTool = null;
        this.exitAimMode();
      } else if (event.type === 'game/inventoryUpdate') {
        if (import.meta.env.DEV) {
          console.log('[ToolInputHandler] Received inventoryUpdate:', {
            eventRole: event.roleId,
            currentRole: this.currentRole,
            items: event.items,
            matches: event.roleId === this.currentRole
          });
        }
        if (event.roleId === this.currentRole) {
          this.inventory = event.items;
          if (import.meta.env.DEV) {
            console.log('[ToolInputHandler] Inventory updated:', this.inventory);
          }
        }
      } else if ((event as any).type === 'ui/tool/fireDown') {
        // Mobile: Fire button pressed
        if ((event as any).roleId === this.currentRole) {
          this.enterAimMode();
          // Auto-fire after short delay (hold to aim, release to fire)
          setTimeout(() => {
            if (this.isAiming) {
              this.fire();
            }
          }, 50);
        }
      } else if ((event as any).type === 'ui/tool/fireUp') {
        // Mobile: Fire button released
        if ((event as any).roleId === this.currentRole) {
          this.exitAimMode();
        }
      }
    });

    // Request current inventory (to populate initial state)
    if (import.meta.env.DEV) {
      console.log('[ToolInputHandler] Requesting inventory for role:', this.currentRole);
    }
    this.eventBus.emit({ type: 'ui/getInventory' });

    // Setup input handlers
    this.setupInputHandlers();
  }

  /**
   * Setup mouse and keyboard input handlers
   */
  private setupInputHandlers(): void {
    // Mouse input
    this.pointerDownHandler = (e: PointerEvent) => this.handlePointerDown(e);
    this.pointerUpHandler = (e: PointerEvent) => this.handlePointerUp(e);

    window.addEventListener('pointerdown', this.pointerDownHandler);
    window.addEventListener('pointerup', this.pointerUpHandler);

    // Keyboard input (optional: hold Shift to aim)
    this.keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.keyUpHandler = (e: KeyboardEvent) => this.handleKeyUp(e);

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  /**
   * Handle pointer down event
   */
  private handlePointerDown(e: PointerEvent): void {
    if (import.meta.env.DEV) {
      console.log('[ToolInputHandler] Pointer down:', {
        button: e.button,
        equippedTool: this.equippedTool,
        currentRole: this.currentRole,
        isAiming: this.isAiming
      });
    }

    // Ignore if no tool equipped or wrong role
    if (!this.equippedTool || this.currentRole === 'girl') {
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Ignoring pointer - no tool or wrong role');
      }
      return;
    }

    const toolDef = INTERACTIVE_TOOLS[this.equippedTool];
    if (!toolDef || toolDef.type !== 'ranged') {
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Ignoring pointer - not a ranged tool');
      }
      return;
    }

    // Right-click (button 2) = enter aim mode
    if (e.button === 2) {
      e.preventDefault();
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Right-click detected - entering aim mode');
      }
      this.enterAimMode();
    }
    // Left-click (button 0) = fire (if aiming)
    else if (e.button === 0 && this.isAiming) {
      e.preventDefault();
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Left-click while aiming - firing');
      }
      this.fire();
    } else if (e.button === 0) {
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Left-click but not aiming');
      }
    }
  }

  /**
   * Handle pointer up event
   */
  private handlePointerUp(e: PointerEvent): void {
    // Right-click release = exit aim mode
    if (e.button === 2 && this.isAiming) {
      e.preventDefault();
      this.exitAimMode();
    }
  }

  /**
   * Handle key down event
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Optional: Shift key to aim (alternative to right-click)
    if (e.key === 'Shift' && !this.isAiming && this.equippedTool) {
      const toolDef = INTERACTIVE_TOOLS[this.equippedTool];
      if (toolDef && toolDef.type === 'ranged') {
        this.enterAimMode();
      }
    }
  }

  /**
   * Handle key up event
   */
  private handleKeyUp(e: KeyboardEvent): void {
    // Release Shift = exit aim mode
    if (e.key === 'Shift' && this.isAiming) {
      this.exitAimMode();
    }
  }

  /**
   * Enter aim mode
   */
  private enterAimMode(): void {
    if (this.isAiming) return;

    this.isAiming = true;

    // Emit aim start event
    this.eventBus.emit({
      type: 'ui/tool/aimStart',
      roleId: this.currentRole,
    });

    if (import.meta.env.DEV) {
      console.log('[ToolInputHandler] Entered aim mode');
    }
  }

  /**
   * Exit aim mode
   */
  private exitAimMode(): void {
    if (!this.isAiming) return;

    this.isAiming = false;

    // Emit aim end event
    this.eventBus.emit({
      type: 'ui/tool/aimEnd',
      roleId: this.currentRole,
    });

    if (import.meta.env.DEV) {
      console.log('[ToolInputHandler] Exited aim mode');
    }
  }

  /**
   * Fire projectile
   */
  private fire(): void {
    if (!this.equippedTool || !this.isAiming) {
      return;
    }

    const toolDef = INTERACTIVE_TOOLS[this.equippedTool];
    if (!toolDef || !toolDef.projectile) {
      return;
    }

    // Check cooldown
    const now = performance.now();
    const cooldownMs = toolDef.projectile.cooldown * 1000;
    if (now - this.lastFireTime < cooldownMs) {
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Cooldown active');
      }
      return;
    }

    // Check ammo
    if (toolDef.usageConfig?.requiresAmmo) {
      const ammoType = toolDef.projectile.ammoType;
      if (import.meta.env.DEV) {
        console.log('[ToolInputHandler] Checking ammo:', {
          ammoType,
          inventory: this.inventory,
          hasAmmo: this.inventory.includes(ammoType)
        });
      }
      if (!this.inventory.includes(ammoType)) {
        // No ammo available
        if (import.meta.env.DEV) {
          console.log('[ToolInputHandler] No ammo - emitting toolError');
        }
        this.eventBus.emit({
          type: 'game/toolError',
          message: `No ${ammoType} available`,
          roleId: this.currentRole,
        });
        return;
      }
    }

    // Get spawn position (from player + offset)
    const spawnPos = this.getProjectileSpawnPosition();
    
    // Get aim direction from aim system
    const aimDir = this.aimSystem.getAimDirection();

    if (import.meta.env.DEV) {
      console.log('[ToolInputHandler] Firing projectile:', {
        spawnPos: spawnPos.toString(),
        aimDir: aimDir.toString(),
        speed: toolDef.projectile.speed
      });
      console.log('[ToolInputHandler] AUDIO: Play slingshot_fire sound');
    }

    // Placeholder: Fire sound (Phase 9)
    // TODO: Uncomment when audio system is available
    // this.audioSystem?.playSpatialSfx('slingshot_fire', spawnPos);

    // Fire projectile
    this.projectileSystem.fireProjectile(
      spawnPos,
      aimDir,
      toolDef.projectile,
      this.currentRole
    );

    // Consume ammo
    if (toolDef.usageConfig?.requiresAmmo && toolDef.projectile.ammoType) {
      this.eventBus.emit({
        type: 'ui/tool/fire',
        roleId: this.currentRole,
      });
      
      // Request ammo consumption (TaskSystem will handle this)
      // For now, we'll emit a custom event that TaskSystem can listen to
      // TODO: Add proper ammo consumption when inventory system is wired up
    }

    // Update last fire time
    this.lastFireTime = now;

    if (import.meta.env.DEV) {
      console.log('[ToolInputHandler] Fired projectile');
    }

    // TODO Phase 9: Play fire sound and animation
    // this.audioSystem?.playSpatialSfx('slingshot_fire', spawnPos);
    // this.animationSystem?.playAnimation('slingshot_fire');
  }

  /**
   * Get projectile spawn position (from player + forward offset)
   */
  private getProjectileSpawnPosition(): Vector3 {
    const player = this.currentRole === 'boy' ? this.getBoyPlayer() : this.getGirlPlayer();
    
    // Get player position
    const playerPos = player.mesh.position.clone();
    
    // Get aim direction
    const aimDir = this.aimSystem.getAimDirection();
    
    // Spawn at shoulder/eye height (1.5m above player) and slightly forward (0.5m)
    // Important: Use the aim direction to offset, so it aligns with where we're aiming
    const heightOffset = new Vector3(0, 1, 0); // Shoulder/eye height
    const forwardOffset = aimDir.scale(5); // 5m forward in aim direction
    
    return playerPos.add(heightOffset).add(forwardOffset);
  }

  /**
   * Check if currently in aim mode
   */
  isInAimMode(): boolean {
    return this.isAiming;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }

    if (this.pointerDownHandler) {
      window.removeEventListener('pointerdown', this.pointerDownHandler);
      this.pointerDownHandler = null;
    }

    if (this.pointerUpHandler) {
      window.removeEventListener('pointerup', this.pointerUpHandler);
      this.pointerUpHandler = null;
    }

    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = null;
    }

    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = null;
    }
  }
}
