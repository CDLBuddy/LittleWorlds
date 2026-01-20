# Phase v0.8.0 - Interactive Tool System & Slingshot

**Goal:** Enable the boy character to equip and use interactive tools (starting with the slingshot) to complete tasks by hitting targets.

**Status:** PLANNING - Pre-Implementation Review

---

## 🎯 Design Principles

1. **Data-Driven**: All tool configs, targets, and behaviors defined in data files
2. **Performance-First**: Object pooling, instancing, and efficient collision detection
3. **Mobile-Friendly**: Touch-optimized controls, clear visual feedback, larger hit areas
4. **Extensible**: Easy to add new tool types without modifying core systems
5. **Testable**: Each system has clear interfaces and can be tested independently
6. **Integrated**: Works seamlessly with existing TaskSystem, InteractionSystem, and CharacterSwitch

---

## 🔍 Critical Improvements to Plan

### **IMPROVEMENT 1: State Management Architecture**
**Issue:** Direct state mutations across systems can cause bugs
**Solution:** Centralized tool state manager with immutable updates

```typescript
// src/game/systems/tools/ToolStateManager.ts
export class ToolStateManager {
  private state: ToolState = {
    equippedTool: null,
    aimMode: false,
    ammoCount: {},
    cooldowns: {},
  };
  
  // Subscribe pattern for reactive updates
  private subscribers = new Set<(state: ToolState) => void>();
  
  equipTool(toolId: string): void {
    if (!this.canEquipTool(toolId)) return;
    this.updateState({ equippedTool: toolId });
    this.notifySubscribers();
  }
  
  // Immutable updates
  private updateState(partial: Partial<ToolState>): void {
    this.state = { ...this.state, ...partial };
  }
}
```

### **IMPROVEMENT 2: Animation System Integration**
**Missing:** No animation hookup for equip/fire/reload
**Solution:** Animation controller with state machine

```typescript
// src/game/systems/tools/ToolAnimationController.ts
export class ToolAnimationController {
  private animationGroups: Map<string, AnimationGroup>;
  
  playEquip(toolId: string): Promise<void> {
    return this.playAnimation(`${toolId}_equip`);
  }
  
  playFire(toolId: string): Promise<void> {
    return this.playAnimation(`${toolId}_fire`);
  }
  
  playReload(toolId: string): Promise<void> {
    return this.playAnimation(`${toolId}_reload`);
  }
}
```

### **IMPROVEMENT 3: VFX & Audio System**
**Missing:** No audio/VFX pipeline
**Solution:** Integrate with existing AudioSystem and add VFX manager

```typescript
// Audio events to add to AudioSystem
const TOOL_SFX = {
  slingshot_equip: 'sfx/slingshot_equip.mp3',
  slingshot_fire: 'sfx/slingshot_fire.mp3',
  slingshot_hit_metal: 'sfx/metal_impact.mp3',
  slingshot_hit_wood: 'sfx/wood_impact.mp3',
  slingshot_miss: 'sfx/whoosh.mp3',
};

// VFX system for impacts
export class ToolVFXManager {
  createMuzzleFlash(position: Vector3): void;
  createImpactEffect(position: Vector3, surfaceType: string): void;
  createProjectileTrail(projectile: Projectile): void;
}
```

### **IMPROVEMENT 4: Mobile Control Specification**
**Vague:** "Virtual buttons for fire/aim"
**Solution:** Detailed mobile control scheme

```typescript
// Mobile controls layout:
// - Left side: Movement joystick (existing)
// - Right side: Look joystick (existing)
// - Tool HUD: Top-left (tap to open radial)
// - Fire button: Bottom-right (large, 80px diameter)
// - Aim toggle: Next to fire button (smaller, 60px)
// 
// Aim mode flow:
// 1. Tap aim button → enters aim mode
// 2. Crosshair appears at screen center
// 3. Right joystick controls camera for precise aim
// 4. Tap fire button → shoots
// 5. Tap aim button again → exits aim mode
//
// Alternative: Hold fire button to auto-aim at nearest target
```

### **IMPROVEMENT 5: Robust Event Schema**
**Issue:** Event types not fully defined
**Solution:** Complete event type definitions with validation

```typescript
// Add to src/game/shared/events.ts
export type ToolEvents =
  // UI → Game
  | { type: 'ui/tool/equip'; toolId: string; roleId: RoleId }
  | { type: 'ui/tool/unequip'; roleId: RoleId }
  | { type: 'ui/tool/fire'; roleId: RoleId }
  | { type: 'ui/tool/aimStart'; roleId: RoleId }
  | { type: 'ui/tool/aimEnd'; roleId: RoleId }
  | { type: 'ui/tool/reload'; roleId: RoleId }
  
  // Game → UI
  | { type: 'game/tool/equipped'; toolId: string | null; roleId: RoleId }
  | { type: 'game/tool/ammoUpdate'; toolId: string; ammo: number; maxAmmo: number; roleId: RoleId }
  | { type: 'game/tool/cooldownStart'; toolId: string; duration: number }
  | { type: 'game/tool/cooldownEnd'; toolId: string }
  | { type: 'game/tool/aimModeChange'; active: boolean; roleId: RoleId }
  | { type: 'game/tool/fired'; toolId: string; success: boolean; reason?: string }
  | { type: 'game/tool/hitTarget'; targetId: string; hitCount: number; totalRequired: number }
  | { type: 'game/tool/error'; message: string };

export type AppEvent = UiToGame | GameToUi | ToolEvents;
```

### **IMPROVEMENT 6: Character Switch Safety**
**Issue:** What happens when switching characters with tool equipped?
**Solution:** Explicit character switch protocol

```typescript
// In CharacterSwitchSystem
private onBeforeSwitch(fromRole: RoleId, toRole: RoleId): void {
  // Unequip tool from current character
  if (this.toolSystem.hasEquippedTool(fromRole)) {
    this.toolSystem.unequipTool(fromRole);
  }
  
  // Clear aim mode
  if (this.toolSystem.isAiming(fromRole)) {
    this.toolSystem.exitAimMode(fromRole);
  }
  
  // Clear active projectiles (they don't transfer between characters)
  this.projectileSystem.clearProjectiles(fromRole);
}

private onAfterSwitch(newRole: RoleId): void {
  // Check if new character has tools available
  const availableTools = this.toolSystem.getAvailableTools(newRole);
  if (availableTools.length > 0) {
    // Show tool HUD for new character
    eventBus.emit({ type: 'game/tool/available', tools: availableTools });
  }
}
```

### **IMPROVEMENT 7: Save/Load Integration**
**Missing:** Tool state persistence
**Solution:** Extend SaveData interface

```typescript
// Add to SaveData interface
interface SaveData {
  // ... existing fields
  
  // Tool state per role
  toolState: {
    boy: {
      equippedTool: string | null;
      ammo: Record<string, number>; // e.g., { steel_balls: 15 }
      unlockedTools: string[]; // Tools the boy has discovered
    };
    girl: {
      equippedTool: string | null;
      ammo: Record<string, number>;
      unlockedTools: string[];
    };
  };
  
  // Target hit tracking for progressive tasks
  targetHitProgress: Record<string, number>; // e.g., { backyard_target_can: 2 }
}
```

### **IMPROVEMENT 8: Target Schema & Validation**
**Issue:** Targets not fully defined
**Solution:** Formal target definition with validation

```typescript
// src/game/content/targets.ts
export interface TargetDef {
  id: string;
  name: string;
  type: 'static' | 'moving' | 'breakable';
  modelPath: string;
  hitbox: {
    type: 'sphere' | 'box';
    size: number | { x: number; y: number; z: number };
  };
  health: number; // Hits required to "destroy"
  scoreValue: number;
  feedback: {
    hitSound: string;
    hitVFX: string;
    breakSound?: string;
    breakVFX?: string;
  };
}

export const TARGETS: Record<string, TargetDef> = {
  backyard_target_can: {
    id: 'backyard_target_can',
    name: 'Tin Can',
    type: 'breakable',
    modelPath: 'assets/models/props/tin_can.glb',
    hitbox: { type: 'sphere', size: 0.3 },
    health: 1, // One hit to knock down
    scoreValue: 10,
    feedback: {
      hitSound: 'sfx/metal_hit.mp3',
      hitVFX: 'spark_burst',
      breakSound: 'sfx/can_fall.mp3',
      breakVFX: 'dust_puff',
    },
  },
};
```

### **IMPROVEMENT 9: Projectile Pooling Details**
**Vague:** "Pool projectiles"
**Solution:** Explicit object pool implementation

```typescript
// src/game/systems/tools/ProjectilePool.ts
export class ProjectilePool {
  private readonly MAX_PROJECTILES = 20;
  private available: Projectile[] = [];
  private active: Set<Projectile> = new Set();
  
  constructor(private scene: Scene) {
    // Pre-create projectiles
    for (let i = 0; i < this.MAX_PROJECTILES; i++) {
      const projectile = new Projectile(scene);
      projectile.mesh.isVisible = false;
      this.available.push(projectile);
    }
  }
  
  acquire(): Projectile | null {
    if (this.available.length === 0) {
      console.warn('[ProjectilePool] Pool exhausted, reusing oldest');
      const oldest = Array.from(this.active)[0];
      this.release(oldest);
    }
    
    const projectile = this.available.pop()!;
    this.active.add(projectile);
    return projectile;
  }
  
  release(projectile: Projectile): void {
    projectile.reset();
    projectile.mesh.isVisible = false;
    this.active.delete(projectile);
    this.available.push(projectile);
  }
  
  updateAll(dt: number): void {
    for (const projectile of this.active) {
      projectile.update(dt);
      if (projectile.shouldDestroy()) {
        this.release(projectile);
      }
    }
  }
}
```

### **IMPROVEMENT 10: Hit Detection Optimization**
**Issue:** Raycasting every projectile every frame is expensive
**Solution:** Spatial hashing + predictive raycasting

```typescript
// src/game/systems/tools/HitDetectionOptimizer.ts
export class HitDetectionOptimizer {
  private spatialGrid: Map<string, Set<AbstractMesh>> = new Map();
  private readonly CELL_SIZE = 10;
  
  // Only raycast when projectile enters new cell
  checkHit(projectile: Projectile): RaycastResult | null {
    const cellKey = this.getCellKey(projectile.position);
    const potentialTargets = this.spatialGrid.get(cellKey) || new Set();
    
    // Only check against nearby meshes
    for (const target of potentialTargets) {
      // AABB quick reject first
      if (!this.aabbIntersect(projectile, target)) continue;
      
      // Then precise raycast
      const hit = this.raycastToTarget(projectile, target);
      if (hit) return hit;
    }
    
    return null;
  }
  
  // Update grid when targets move
  updateGrid(targets: AbstractMesh[]): void {
    this.spatialGrid.clear();
    for (const target of targets) {
      const cellKey = this.getCellKey(target.position);
      if (!this.spatialGrid.has(cellKey)) {
        this.spatialGrid.set(cellKey, new Set());
      }
      this.spatialGrid.get(cellKey)!.add(target);
    }
  }
}
```

---

## Overview

The tool system allows players to:
1. See available interactive tools in a dedicated HUD widget
2. Select a tool from a radial dial interface
3. Visually see the equipped tool in the character's hands
4. Use the tool (slingshot shoots projectiles at targets)
5. Complete tasks by hitting interactable targets

---

## Architecture Components

### 1. **Tool Registry & Data Model**
```typescript
// src/game/content/tools.ts
export interface ToolDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'melee' | 'ranged' | 'utility';
  isInteractive: boolean; // Can be equipped and used
  modelPath?: string; // 3D model for hand attachment
  usageConfig?: {
    projectile?: string;
    damage?: number;
    range?: number;
    cooldown?: number;
  };
}

export const INTERACTIVE_TOOLS = {
  slingshot: {
    id: 'slingshot',
    name: 'Slingshot',
    icon: '🎯',
    type: 'ranged',
    isInteractive: true,
    modelPath: 'assets/models/slingshot.glb',
    usageConfig: {
      projectile: 'steel_ball',
      damage: 10,
      range: 50,
      cooldown: 0.5,
    },
  },
  // Future tools: axe, multitool, etc.
};
```

### 2. **Tool Equipment System**
```typescript
// src/game/systems/tools/ToolEquipmentSystem.ts
export class ToolEquipmentSystem {
  private equippedTool: string | null = null;
  private toolMesh: AbstractMesh | null = null;
  private player: AbstractMesh;
  
  equipTool(toolId: string): void {
    // Load tool model
    // Attach to player's hand bone
    // Update HUD state
  }
  
  unequipTool(): void {
    // Remove tool mesh
    // Clear equipped state
  }
  
  getCurrentTool(): string | null {
    return this.equippedTool;
  }
}
```

### 3. **UI Components**

#### A. Tool HUD Bubble (Top-Left)
```tsx
// src/ui/hud/widgets/ToolHUD.tsx
export function ToolHUD() {
  const [equippedTool, setEquippedTool] = useState<string | null>(null);
  const [showRadial, setShowRadial] = useState(false);
  
  // Position: top-left, to the left of inventory
  // Shows current equipped tool icon
  // Click opens RadialToolSelector
}
```

#### B. Radial Tool Selector
```tsx
// src/ui/hud/widgets/RadialToolSelector.tsx
export function RadialToolSelector({ 
  tools: string[], 
  onSelect: (toolId: string) => void,
  onClose: () => void 
}) {
  // Half-circle dial layout
  // Tools arranged in arc
  // Smooth rotation animation
  // Click/tap to select
}
```

### 4. **Projectile System**
```typescript
// src/game/systems/tools/ProjectileSystem.ts
export class ProjectileSystem {
  private activeProjectiles: Projectile[] = [];
  
  fireProjectile(origin: Vector3, direction: Vector3, config: ProjectileConfig): void {
    // Create projectile mesh (sphere for steel ball)
    // Apply physics/trajectory
    // Raycast for hit detection
    // Check for target collisions
  }
  
  update(deltaTime: number): void {
    // Update all active projectiles
    // Remove expired projectiles
  }
}
```

### 5. **Slingshot Aiming System**
```typescript
// src/game/systems/tools/SlingshotAimSystem.ts
export class SlingshotAimSystem {
  private aimCursor: AbstractMesh;
  private camera: ArcRotateCamera;
  
  setupAimMode(): void {
    // Show crosshair cursor
    // Lock camera slightly
    // Enable aim input
  }
  
  getAimDirection(): Vector3 {
    // Calculate from camera forward + cursor offset
  }
  
  fire(): void {
    // Emit projectile from slingshot position
    // Consume ammo (steel_balls)
    // Play animation + sound
  }
}
```

---

## Implementation Phases

### **Phase 1: Tool Registry & Data**
**Files to create/modify:**
- `src/game/content/tools.ts` (new)
- `src/game/content/items.ts` (add `isInteractive` flag)

**Tasks:**
1. Create tool definition interface
2. Mark slingshot, axe, multitool as interactive tools
3. Add model paths and usage configs
4. Export helper to get interactive tools from inventory

**Validation:**
```typescript
// Should be able to query:
const interactiveTools = getInteractiveToolsFromInventory(['slingshot', 'steel_balls', 'axe']);
// Returns: ['slingshot', 'axe']
```

---

### **Phase 2: Tool HUD Widget**
**Files to create/modify:**
- `src/ui/hud/widgets/ToolHUD.tsx` (new)
- `src/ui/hud/HUD.tsx` (add ToolHUD component)
- `src/ui/hud/hud.module.css` (add styles)

**Tasks:**
1. Create compact tool widget (similar to inventory bag)
2. Position top-left corner (e.g., `left: 20px, top: 20px`)
3. Show currently equipped tool icon or "none" state
4. Click handler to open radial selector
5. Subscribe to `game/toolEquipped` events

**UI Mockup:**
```
┌─────────────────────────────────┐
│ [🎯]                    [🎒 3]  │  ← Tool HUD (left) | Inventory (right)
│                                 │
```

**States:**
- **Empty**: Gray icon with "+" symbol (no tool equipped)
- **Equipped**: Tool icon with glow border
- **Active**: Pulsing animation when in use

---

### **Phase 3: Radial Tool Selector**
**Files to create/modify:**
- `src/ui/hud/widgets/RadialToolSelector.tsx` (new)
- `src/ui/hud/widgets/RadialToolSelector.module.css` (new)

**Tasks:**
1. Create half-circle dial component (180° arc)
2. Position tools along arc based on count (1-6 tools)
3. Calculate angle per tool: `180 / (toolCount + 1)`
4. Add hover/touch highlight effects
5. Smooth rotation animation on open/close
6. "Unequip" option at center bottom

**Layout Math:**
```typescript
const arcRadius = 120; // pixels from center
const startAngle = 0; // degrees
const endAngle = 180; // degrees
const toolCount = tools.length;
const angleStep = 180 / (toolCount + 1);

tools.forEach((tool, index) => {
  const angle = startAngle + (angleStep * (index + 1));
  const x = Math.cos(angle * Math.PI / 180) * arcRadius;
  const y = Math.sin(angle * Math.PI / 180) * arcRadius;
  // Position tool at (x, y)
});
```

**Interactions:**
- Click/tap tool → emit `ui/equipTool` event → close selector
- Click outside → close selector
- ESC key → close selector

---

### **Phase 4: Tool Equipment System (Backend)**
**Files to create/modify:**
- `src/game/systems/tools/ToolEquipmentSystem.ts` (new)
- `src/game/GameApp.ts` (integrate system)
- `src/game/shared/events.ts` (add tool events)

**New Events:**
```typescript
| { type: 'ui/equipTool'; toolId: string }
| { type: 'ui/unequipTool' }
| { type: 'game/toolEquipped'; toolId: string | null }
| { type: 'ui/useTool' } // Fire/use current tool
```

**Tasks:**
1. Create ToolEquipmentSystem class
2. Load tool model from GLTF
3. Attach mesh to player's hand bone (or position near hand)
4. Handle equip/unequip events
5. Broadcast state changes to UI
6. Check inventory for required ammo (e.g., steel_balls for slingshot)

**Attachment Strategy:**
```typescript
// Option 1: Bone attachment (if character has hand bone)
const handBone = player.skeleton.bones.find(b => b.name === 'RightHand');
toolMesh.attachToBone(handBone, player);

// Option 2: Simple parenting (fallback)
toolMesh.parent = player;
toolMesh.position = new Vector3(0.2, 0.8, 0.3); // Offset to hand
```

---

### **Phase 5: Slingshot Aiming Cursor**
**Files to create/modify:**
- `src/game/systems/tools/SlingshotAimSystem.ts` (new)
- `src/ui/hud/widgets/AimCursor.tsx` (new)

**Tasks:**
1. Create 3D aim cursor (sphere or crosshair mesh)
2. Position cursor based on camera raycast
3. Cast ray from camera center forward
4. Place cursor at raycast hit point (or max range)
5. Show cursor only when slingshot equipped + aim mode active
6. Add visual feedback (color change when over valid target)

**Cursor Logic:**
```typescript
update(camera: Camera): void {
  const ray = camera.getForwardRay(this.maxRange);
  const hit = this.scene.pickWithRay(ray);
  
  if (hit?.pickedPoint) {
    this.cursor.position.copyFrom(hit.pickedPoint);
    this.cursor.isVisible = true;
    
    // Check if hit target is valid interactable
    const target = hit.pickedMesh?.metadata?.interactableId;
    this.cursor.material.emissiveColor = target 
      ? Color3.Green() 
      : Color3.White();
  }
}
```

---

### **Phase 6: Projectile System**
**Files to create/modify:**
- `src/game/systems/tools/ProjectileSystem.ts` (new)
- `src/game/systems/tools/Projectile.ts` (new)

**Tasks:**
1. Create Projectile class
   - Mesh (sphere for steel ball)
   - Velocity vector
   - Lifetime/TTL
   - Hit detection
2. Create ProjectileSystem to manage pool of active projectiles
3. Fire projectile from player position in aim direction
4. Apply physics (arc trajectory, gravity)
5. Raycast each frame for collision
6. Destroy projectile on hit or timeout
7. Emit hit events for targets

**Projectile Physics:**
```typescript
class Projectile {
  update(dt: number): void {
    // Apply gravity
    this.velocity.y -= 9.8 * dt;
    
    // Update position
    const delta = this.velocity.multiplyByFloats(dt, dt, dt);
    this.mesh.position.addInPlace(delta);
    
    // Raycast for collision
    const ray = new Ray(this.lastPosition, this.mesh.position.subtract(this.lastPosition));
    const hit = this.scene.pickWithRay(ray);
    
    if (hit?.hit) {
      this.onHit(hit);
      this.destroy();
    }
    
    this.lastPosition.copyFrom(this.mesh.position);
  }
}
```

---

### **Phase 7: Input & Firing**
**Files to modify:**
- `src/game/input/PlayerInputController.ts`
- `src/game/systems/tools/SlingshotAimSystem.ts`

**Tasks:**
1. Add aim mode input (hold right-click or aim button)
2. Show crosshair cursor in aim mode
3. Fire on click/tap (left-click or fire button)
4. Check for ammo (steel_balls count)
5. Consume 1 steel_ball per shot
6. Play fire animation + sound effect
7. Cooldown between shots (0.5s for slingshot)

**Input Mapping:**
- **Desktop**: Right-click hold = aim mode, Left-click = fire
- **Mobile**: Aim button (virtual joystick area?) = aim mode, Fire button = fire
- **Gamepad**: LT = aim mode, RT = fire

**Firing Flow:**
```typescript
onFireInput(): void {
  if (!this.canFire()) return; // Cooldown check
  if (!this.hasAmmo()) return; // Ammo check
  
  const direction = this.aimSystem.getAimDirection();
  const spawnPos = this.getSlingshotMuzzlePosition();
  
  this.projectileSystem.fireProjectile(spawnPos, direction, {
    speed: 50,
    gravity: true,
    damage: 10,
  });
  
  this.consumeAmmo('steel_balls', 1);
  this.startCooldown();
  this.playFireAnimation();
}
```

---

### **Phase 8: Target Hit Detection**
**Files to modify:**
- `src/game/systems/interaction/InteractionSystem.ts`
- `src/game/systems/tasks/TaskSystem.ts`

**Tasks:**
1. Mark target interactables with metadata: `{ isTarget: true, targetId: string }`
2. On projectile hit, check if hit mesh is a target
3. Emit `game/targetHit` event with targetId
4. TaskSystem listens for target hits
5. Check if hit target matches task requirements
6. Complete task if target hit + other conditions met
7. Visual feedback on target (particle effect, animation, sound)

**Task Configuration:**
```typescript
// In task definition
{
  id: 'backyard_slingshot_practice',
  requiresItems: ['slingshot', 'steel_balls'],
  targetId: 'backyard_target_can', // New field
  requiresTargetHits: 3, // Hit target 3 times
  onTargetHit: (hitCount) => {
    // Show progress feedback
  },
  onComplete: () => {
    // Task complete!
  },
}
```

**Hit Event Flow:**
```
Projectile hits mesh
  ↓
Check mesh.metadata.isTarget
  ↓
Emit game/targetHit { targetId, position }
  ↓
TaskSystem receives event
  ↓
Increment task hit counter
  ↓
Check if task complete (hitCount >= required)
  ↓
Complete task + grant rewards
```

---

## Phase Breakdown Summary

| Phase | Description | Files | Complexity | Time Est. | Risk |
|-------|-------------|-------|------------|-----------|------|
| 1 | Tool Registry & Data | 2 files | Low | 2 hours | Low |
| 2 | Tool HUD Widget | 3 files | Low | 3 hours | Low |
| 3 | Radial Tool Selector | 2 files | Medium | 4 hours | Medium |
| 4 | Tool Equipment System | 4 files | Medium | 6 hours | Medium |
| 5 | Slingshot Aiming Cursor | 3 files | Medium | 4 hours | Medium |
| 6 | Projectile System + Pool | 3 files | High | 7 hours | High |
| 7 | Input & Firing | 3 files | Medium | 4 hours | Medium |
| 8 | Target Hit Detection | 3 files | Medium | 5 hours | Medium |
| 9 | VFX & Audio Integration | 2 files | Low | 3 hours | Low |
| 10 | Save/Load & Polish | 2 files | Low | 3 hours | Low |

**Total Estimated Time:** 41 hours (5-6 work days)  
**Critical Path:** Phases 4, 6, 8 (high complexity/risk)

---

## Risk Mitigation

### **HIGH RISK: Projectile Physics**
**Risk:** Inaccurate trajectory or performance issues with multiple projectiles  
**Mitigation:**
- Start with simple linear trajectory, add arc later
- Implement pooling from day 1
- Profile with 20 projectiles active
- Fallback: Instant raycast instead of physical projectile

### **MEDIUM RISK: Model Attachment**
**Risk:** Slingshot doesn't align properly with hand  
**Mitigation:**
- Test attachment without animations first
- Add adjustable offset config in tool definition
- Document hand bone names for character models
- Fallback: Simple parenting to player root with fixed offset

### **MEDIUM RISK: Mobile Controls**
**Risk:** Aiming is too difficult on touch devices  
**Mitigation:**
- Add auto-aim assist option
- Larger cursor hit area on mobile
- Test with real devices (not just emulator)
- Fallback: Tap-to-shoot at nearest visible target

### **LOW RISK: Save/Load Corruption**
**Risk:** Tool state corrupts save data  
**Mitigation:**
- Add schema version to SaveData
- Validate tool IDs on load
- Clear invalid state instead of crashing
- Test with saves from multiple versions

---

## Technical Debt Prevention

1. **Type Safety**
   - Use TypeScript strict mode
   - No `any` types in public APIs
   - Validate all event payloads with Zod or similar

2. **Documentation**
   - JSDoc for all public methods
   - README in each new folder
   - Inline comments for non-obvious logic

3. **Testing**
   - Unit tests for projectile physics
   - Integration tests for tool equip/unequip
   - Manual QA checklist for each milestone

4. **Code Review**
   - Review API surface before implementing
   - Test edge cases (empty inventory, invalid tool, etc.)
   - Verify performance targets are met

---

## Dependencies & Prerequisites

### **External Assets Needed**
- [ ] Slingshot 3D model (.glb)
- [ ] Steel ball projectile texture
- [ ] Target can 3D model (.glb)
- [ ] Slingshot fire sound effect
- [ ] Impact sound effects (metal, wood)
- [ ] Muzzle flash sprite/particle texture

### **Code Prerequisites**
- [ ] Character models have hand bones named consistently
- [ ] Camera rig exposes forward ray method
- [ ] Task system supports multi-step target tracking
- [ ] AudioSystem can play positional 3D sounds

### **System Requirements**
- [ ] Babylon.js physics plugin (Havok or Cannon)
- [ ] Particle system available
- [ ] Post-processing for cursor glow (optional)

---

## Testing Milestones

### Milestone 1: Static Tool UI
- [ ] Tool HUD widget renders at top-left
- [ ] Shows equipped tool icon
- [ ] Click opens radial selector
- [ ] **Performance**: <1ms render time for HUD
- [ ] **Mobile**: Touch targets ≥44px (WCAG)

### Milestone 2: Tool Selection
- [ ] Radial selector shows available tools
- [ ] Can select tool from dial
- [ ] Selection emits event and closes selector
- [ ] **Animation**: Smooth 250ms open/close transition
- [ ] **Accessibility**: Keyboard navigation (Tab + Enter)

### Milestone 3: Visual Equipment
- [ ] Slingshot model loads and attaches to hand
- [ ] Model visible in third-person view
- [ ] Model follows player movement
- [ ] **Edge case**: Model properly unequips on character switch
- [ ] **Performance**: LOD switches at 20m distance

### Milestone 4: Aiming
- [ ] Aim cursor appears when slingshot equipped
- [ ] Cursor follows camera raycast
- [ ] Cursor changes color over valid targets
- [ ] **Mobile**: Aim mode works with touch controls
- [ ] **Performance**: Raycast <0.5ms per frame

### Milestone 5: Shooting
- [ ] Can fire projectile with input
- [ ] Projectile travels in aim direction
- [ ] Projectile has arc trajectory
- [ ] Ammo consumed on fire
- [ ] **Audio**: Fire sound plays
- [ ] **VFX**: Muzzle flash appears
- [ ] **Edge case**: Cannot fire with 0 ammo
- [ ] **Edge case**: Cooldown prevents spam firing

### Milestone 6: Hit Detection
- [ ] Projectile detects target collisions
- [ ] Target hit emits event
- [ ] Task system receives hit events
- [ ] Task completes after required hits
- [ ] **VFX**: Impact effect on hit
- [ ] **Audio**: Impact sound varies by material
- [ ] **Performance**: Spatial hashing active
- [ ] **Edge case**: Projectile cleanup after max time

### Milestone 7: Save/Load
- [ ] Equipped tool persists across sessions
- [ ] Ammo counts save correctly
- [ ] Target hit progress persists
- [ ] **Edge case**: Loading with invalid tool ID fails gracefully

### Milestone 8: Integration Testing
- [ ] Character switch properly clears tool state
- [ ] Tool HUD disappears for girl character (if no tools)
- [ ] Multiple projectiles in flight don't cause lag
- [ ] Works correctly after app restart
- [ ] **Performance**: 60fps maintained with 10 projectiles active

---

## Performance Budgets

| System | Target | Max Acceptable |
|--------|--------|----------------|
| Tool HUD render | 0.5ms | 1ms |
| Radial selector render | 1ms | 2ms |
| Projectile update (each) | 0.1ms | 0.3ms |
| Hit detection raycast | 0.3ms | 0.8ms |
| Tool model draw call | 1 draw call | 2 draw calls |
| Memory (tool system) | 5MB | 10MB |

---

## Error Handling Strategy

```typescript
// Defensive programming patterns
class ToolEquipmentSystem {
  equipTool(toolId: string, roleId: RoleId): Result<void, ToolError> {
    // Validate tool exists
    if (!TOOLS[toolId]) {
      return Err({ type: 'INVALID_TOOL', toolId });
    }
    
    // Validate character has tool in inventory
    if (!this.hasToolInInventory(toolId, roleId)) {
      return Err({ type: 'NOT_IN_INVENTORY', toolId, roleId });
    }
    
    // Validate model file exists
    if (!this.modelExists(TOOLS[toolId].modelPath)) {
      console.error(`Tool model missing: ${TOOLS[toolId].modelPath}`);
      return Err({ type: 'MISSING_ASSET', toolId });
    }
    
    // Success path
    return Ok(undefined);
  }
}

// User-facing error messages
const ERROR_MESSAGES = {
  INVALID_TOOL: 'This tool is not available',
  NOT_IN_INVENTORY: 'You don\'t have this tool yet',
  MISSING_ASSET: 'Loading tool... (asset not found)',
  NO_AMMO: 'Out of ammo!',
  ON_COOLDOWN: 'Tool is recharging...',
};
```

---

## Debug Tools

```typescript
// Add to CheatSystem
export const TOOL_CHEATS = {
  'tool.give': (toolId: string) => {
    // Give tool to current character
  },
  'tool.ammo': (amount: number) => {
    // Set ammo to amount
  },
  'tool.noclip': () => {
    // Projectiles pass through geometry
  },
  'tool.debug': () => {
    // Show projectile trajectories, hitboxes
  },
  'tool.oneshot': () => {
    // Toggle instant-kill mode for targets
  },
};

// Visual debug overlays
class ToolDebugRenderer {
  showProjectileTrajectory(origin: Vector3, direction: Vector3): void;
  showTargetHitbox(target: TargetDef): void;
  showAimRaycast(ray: Ray, hit?: PickingInfo): void;
}
```

---

## Accessibility Features

1. **Colorblind Support**
   - Cursor: Green → Blue/Yellow gradient
   - Add shape differentiation (circle = neutral, diamond = target)

2. **Motor Impairment**
   - Auto-aim assist option (snaps to nearest target)
   - Larger touch targets on mobile (60px minimum)
   - Aim hold-to-fire mode (no click required)

3. **Audio Cues**
   - Distinct sounds for: equip, fire, hit, miss, out of ammo
   - Spatial audio for target direction (if off-screen)

4. **Haptic Feedback**
   - Light pulse on equip
   - Medium pulse on fire
   - Strong pulse on target hit

---

## Future Enhancements

1. **Tool Durability**: Tools degrade with use, require repairs
2. **Tool Upgrades**: Unlock better versions (e.g., Slingshot II)
3. **More Tools**:
   - Axe: Melee attack, chop trees
   - Multitool: Repair items, open locks
   - Fishing Rod: Catch fish at water bodies
   - Flashlight: Illuminate dark areas
4. **Ammo Types**: Different projectiles for slingshot (rocks, steel, special)
5. **Combo System**: Chain hits for bonus rewards
6. **Practice Mode**: Shooting range with moving targets
7. **Tool Quick-Swap**: Hotkey or gesture to switch tools without radial

---

## Technical Considerations

### Performance
- Pool projectiles (max 20 active at once)
- LOD on tool models
- Disable tool rendering when far from camera

### Mobile Optimization
- Larger touch targets for radial selector
- Simplified aim mode (auto-aim assist?)
- Virtual buttons for fire/aim

### Accessibility
- Colorblind-friendly cursor colors
- Audio cues for hits
- Haptic feedback on fire (mobile)

### Save Data
```typescript
interface SaveData {
  equippedTool: string | null;
  toolDurability: Record<string, number>; // Future
  // ... existing fields
}
```

---

## File Structure (New)

```
src/game/
  content/
    tools.ts              # NEW: Tool definitions
  systems/
    tools/                # NEW FOLDER
      ToolEquipmentSystem.ts
      SlingshotAimSystem.ts
      ProjectileSystem.ts
      Projectile.ts

src/ui/hud/widgets/
  ToolHUD.tsx             # NEW: Tool widget
  ToolHUD.module.css      # NEW
  RadialToolSelector.tsx  # NEW: Radial dial
  RadialToolSelector.module.css  # NEW
  AimCursor.tsx           # NEW: Crosshair UI
```

---

## Next Steps

1. Review this plan and confirm approach
2. Start with Phase 1 (Tool Registry)
3. Build incrementally, testing each phase
4. Iterate on UX based on feel/feedback

Would you like to start implementing Phase 1, or would you like to adjust any part of the plan?
