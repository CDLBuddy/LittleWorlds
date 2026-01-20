/**
 * Slingshot Aim System
 * Phase v0.8.0 - Phase 5
 * 
 * Manages 3D aiming cursor for slingshot targeting
 */

import type { Scene, Camera, AbstractMesh } from '@babylonjs/core';
import { MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import type { AppEvent } from '@game/shared/events';
import { INTERACTIVE_TOOLS } from '@game/content/tools';

type RoleId = 'boy' | 'girl';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

/**
 * Slingshot Aim System
 * Creates and manages the 3D aiming cursor for ranged tools
 */
export class SlingshotAimSystem {
  private cursor: AbstractMesh;
  private cursorOutline: AbstractMesh;
  private cursorMaterial: StandardMaterial;
  private outlineMaterial: StandardMaterial;
  private isAiming = false;
  private equippedTool: string | null = null;
  private currentRole: RoleId = 'boy';
  private maxRange = 50; // Maximum aim distance
  private eventBusSub: (() => void) | null = null;

  constructor(
    private scene: Scene,
    private camera: Camera,
    private eventBus: EventBus
  ) {
    // Create aim cursor mesh (sphere)
    this.cursor = MeshBuilder.CreateSphere('aimCursor', {
      diameter: 0.3,
      segments: 16,
    }, scene);

    // Create cursor outline (slightly larger, dark)
    this.cursorOutline = MeshBuilder.CreateSphere('aimCursorOutline', {
      diameter: 0.35,
      segments: 16,
    }, scene);

    // Create material for cursor
    this.cursorMaterial = new StandardMaterial('aimCursorMat', scene);
    this.cursorMaterial.emissiveColor = Color3.White();
    this.cursorMaterial.disableLighting = true;
    this.cursorMaterial.alpha = 0.9;
    this.cursor.material = this.cursorMaterial;

    // Create outline material
    this.outlineMaterial = new StandardMaterial('outlineMat', scene);
    this.outlineMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1); // Dark outline
    this.outlineMaterial.disableLighting = true;
    this.outlineMaterial.alpha = 0.6;
    this.cursorOutline.material = this.outlineMaterial;

    // Start hidden
    this.cursor.isVisible = false;
    this.cursor.isPickable = false;
    this.cursorOutline.isVisible = false;
    this.cursorOutline.isPickable = false;

    // Subscribe to events
    this.eventBusSub = this.eventBus.on((event) => {
      if (event.type === 'game/toolEquipped') {
        this.equippedTool = event.toolId;
        this.currentRole = event.roleId;
        this.updateVisibility();
      } else if (event.type === 'game/characterSwitch') {
        this.currentRole = event.roleId;
        this.equippedTool = null;
        this.isAiming = false;
        this.updateVisibility();
      } else if (event.type === 'ui/tool/aimStart') {
        if (event.roleId === this.currentRole) {
          this.isAiming = true;
          this.updateVisibility();
        }
      } else if (event.type === 'ui/tool/aimEnd') {
        if (event.roleId === this.currentRole) {
          this.isAiming = false;
          this.updateVisibility();
        }
      } else if (event.type === 'ui/tool/unequip') {
        if (event.roleId === this.currentRole) {
          this.equippedTool = null;
          this.isAiming = false;
          this.updateVisibility();
        }
      }
    });
  }

  /**
   * Update cursor position and visibility each frame
   */
  update(): void {
    if (!this.cursor.isVisible) {
      return;
    }

    // Get forward ray from camera
    const ray = this.camera.getForwardRay(this.maxRange);
    if (!ray) {
      return;
    }

    // Raycast to find hit point
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      // Ignore the cursor itself and UI elements
      return mesh.isPickable && mesh !== this.cursor;
    });

    if (hit && hit.hit && hit.pickedPoint) {
      // Position cursor at hit point
      this.cursor.position.copyFrom(hit.pickedPoint);
      this.cursorOutline.position.copyFrom(hit.pickedPoint);

      // Scale based on distance (smaller when far away)
      const distance = Vector3.Distance(this.camera.position, hit.pickedPoint);
      const scale = Math.max(0.5, Math.min(1.5, 1.0 - (distance / this.maxRange) * 0.7));
      this.cursor.scaling.setAll(scale);
      this.cursorOutline.scaling.setAll(scale);

      // Check if hit mesh is a valid target
      const isTarget = this.isValidTarget(hit.pickedMesh);
      
      // Change cursor color based on target validity
      if (isTarget) {
        this.cursorMaterial.emissiveColor = Color3.Green();
      } else {
        this.cursorMaterial.emissiveColor = Color3.White();
      }
    } else {
      // No hit - position at max range
      const origin = ray.origin;
      const direction = ray.direction;
      const endPoint = origin.add(direction.scale(this.maxRange));
      this.cursor.position.copyFrom(endPoint);
      this.cursorOutline.position.copyFrom(endPoint);
      
      // Smaller at max distance
      this.cursor.scaling.setAll(0.5);
      this.cursorOutline.scaling.setAll(0.5);
      
      // No target at max range
      this.cursorMaterial.emissiveColor = Color3.Gray();
    }
  }

  /**
   * Get current aim direction from camera
   */
  getAimDirection(): Vector3 {
    const ray = this.camera.getForwardRay(1);
    return ray ? ray.direction.normalize() : Vector3.Forward();
  }

  /**
   * Get current aim position (cursor location)
   */
  getAimPosition(): Vector3 {
    return this.cursor.position.clone();
  }

  /**
   * Check if we're currently in aim mode
   */
  isInAimMode(): boolean {
    return this.isAiming && this.cursor.isVisible;
  }

  /**
   * Update cursor visibility based on state
   */
  private updateVisibility(): void {
    // Show cursor only if:
    // 1. A ranged tool is equipped
    // 2. We're in aim mode
    // 3. The tool is interactive

    let shouldShow = false;

    if (this.equippedTool && this.isAiming) {
      const toolDef = INTERACTIVE_TOOLS[this.equippedTool];
      if (toolDef && toolDef.type === 'ranged' && toolDef.isInteractive) {
        shouldShow = true;
      }
    }

    this.cursor.isVisible = shouldShow;
    this.cursorOutline.isVisible = shouldShow;

    if (import.meta.env.DEV) {
      if (shouldShow) {
        console.log('[SlingshotAimSystem] Cursor visible - aiming with', this.equippedTool);
      }
    }
  }

  /**
   * Check if a mesh is a valid target
   */
  private isValidTarget(mesh: AbstractMesh | null): boolean {
    if (!mesh) return false;

    // Check if mesh has target metadata
    if (mesh.metadata?.isTarget === true) {
      return true;
    }

    // Check parent metadata (for complex models)
    if (mesh.parent && 'metadata' in mesh.parent) {
      const parentMeta = (mesh.parent as any).metadata;
      if (parentMeta?.isTarget === true) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the current target mesh if cursor is over one
   */
  getCurrentTarget(): { mesh: AbstractMesh; targetId: string } | null {
    if (!this.cursor.isVisible) {
      return null;
    }

    const ray = this.camera.getForwardRay(this.maxRange);
    if (!ray) {
      return null;
    }

    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.isPickable && mesh !== this.cursor;
    });

    if (hit && hit.hit && hit.pickedMesh && this.isValidTarget(hit.pickedMesh)) {
      const targetId = hit.pickedMesh.metadata?.targetId || 
                       (hit.pickedMesh.parent as any)?.metadata?.targetId;
      
      if (targetId) {
        return {
          mesh: hit.pickedMesh,
          targetId,
        };
      }
    }

    return null;
  }

  /**
   * Set maximum aim range
   */
  setMaxRange(range: number): void {
    this.maxRange = Math.max(1, range);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.eventBusSub) {
      this.eventBusSub();
      this.eventBusSub = null;
    }

    this.cursor.dispose();
    this.cursorMaterial.dispose();
    this.cursorOutline.dispose();
    this.outlineMaterial.dispose();
  }
}
