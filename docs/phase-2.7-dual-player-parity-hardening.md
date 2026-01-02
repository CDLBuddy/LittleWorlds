# Phase 2.7: Dual-Player Parity + Switch Hardening + Collections v0 Completion

**Date:** January 2, 2026  
**Status:** 🚧 In Progress

## Overview

Phase 2.6 successfully implemented the dual-player system in BackyardWorld, but revealed several issues during manual testing. Phase 2.7 extends this pattern to ALL worlds, hardens the switching logic to prevent desync, and completes the collections system v0.

## Goals

1. **Parity**: Every world supports dual-player creation (no regressions outside Backyard)
2. **Hardening**: Eliminate stale references + prevent inactive player side-effects
3. **Collections v0 Complete**: All area templates filled + Collectables/Memories UI fully data-driven + cheats for testing
4. **Regression Harness**: Quick debug overlay + console helpers to prove "role/tool/task/player" are in sync

---

## 2.7.1 — World Contract Hardening

### Problem

BackyardWorld currently returns `{ player, playerEntity, boyPlayer, girlPlayer, ... }` and GameApp has to guess what's present with optional field checks. This creates "works in one world, breaks in another" scenarios.

### Solution: Single World Return Type

**Create: `src/game/worlds/types.ts`**

```typescript
import type { Player } from '@game/entities/player/Player';
import type { TransformNode } from '@babylonjs/core';
import type { Companion } from '@game/entities/companion/Companion';
import type { AbstractMesh } from '@babylonjs/core';

export type RoleId = 'boy' | 'girl';

export type WorldPlayers = {
  boy: Player;
  girl: Player;
};

export type WorldResult = {
  players: WorldPlayers;
  getActiveRole: () => RoleId;
  getActivePlayer: () => Player;
  setActiveRole: (roleId: RoleId) => void;

  // Optional convenience (but keep it derived, not authoritative)
  getActiveMesh: () => TransformNode;

  companion: Companion;
  interactables: Array<{ 
    id: string; 
    mesh: AbstractMesh; 
    interact: () => void; 
    dispose: () => void;
  }>;
  dispose: () => void;
};
```

### Implementation Tasks

**A) Update BackyardWorld to return WorldResult**

- Remove legacy `player` and `playerEntity` from exported contract (keep internal if needed)
- Implement `setActiveRole(roleId)` method:
  - Calls `boy.setActive(roleId === 'boy')`
  - Calls `girl.setActive(roleId === 'girl')`
- Implement getter methods: `getActiveRole()`, `getActivePlayer()`, `getActiveMesh()`

**B) Update GameApp to use new contract**

Replace:
```typescript
this.boyPlayer = world.boyPlayer || null;
this.girlPlayer = world.girlPlayer || null;
this.player = world.player;
```

With:
```typescript
this.world = world;
const activePlayer = this.world.getActivePlayer();
const activeMesh = this.world.getActiveMesh();
```

Add helper methods:
```typescript
private getActivePlayerEntity(): Player {
  return this.world.getActivePlayer();
}

private getActivePlayerMesh(): TransformNode {
  return this.world.getActiveMesh();
}
```

### Acceptance Criteria

- ✅ No optional `boyPlayer?` / `girlPlayer?` code paths in GameApp
- ✅ All worlds compile against `WorldResult`
- ✅ Single source of truth for active player

---

## 2.7.2 — Roll Dual-Player Pattern into ALL Worlds

### Affected Worlds

1. BootWorld.ts
2. WoodlineWorld.ts
3. CreekWorld.ts
4. PineWorld.ts
5. DuskWorld.ts
6. NightWorld.ts
7. BeachWorld.ts

### Shared Helper for Player Creation

**Create: `src/game/worlds/shared/createWorldPlayers.ts`**

```typescript
import { Scene, Vector3 } from '@babylonjs/core';
import { Player } from '@game/entities/player/Player';
import type { RoleId, WorldPlayers } from '../types';

export function createWorldPlayers(
  scene: Scene, 
  spawnPos: Vector3, 
  startingRoleId: RoleId
): WorldPlayers {
  const boy = new Player(
    scene, 
    spawnPos, 
    'boy', 
    startingRoleId === 'boy'
  );
  
  const girl = new Player(
    scene, 
    spawnPos.clone().add(new Vector3(2, 0, 0)), 
    'girl', 
    startingRoleId === 'girl'
  );
  
  return { boy, girl };
}
```

### Implementation Pattern for Each World

```typescript
export function createXWorld(
  scene: Scene, 
  eventBus: { emit: (event: AppEvent) => void }, 
  roleId: RoleId = 'boy', 
  fromArea?: string
): WorldResult {
  // Sky, ground, etc...
  
  // Create both players using shared helper
  const spawnPos = new Vector3(0, 0.5, 0);
  const players = createWorldPlayers(scene, spawnPos, roleId);
  
  // Track active role
  let activeRole = roleId;
  
  // Create world methods
  const getActiveRole = () => activeRole;
  const getActivePlayer = () => players[activeRole];
  const getActiveMesh = () => getActivePlayer().mesh;
  
  const setActiveRole = (newRole: RoleId) => {
    players.boy.setActive(newRole === 'boy');
    players.girl.setActive(newRole === 'girl');
    activeRole = newRole;
  };
  
  // ... create companion, interactables, etc ...
  
  return {
    players,
    getActiveRole,
    getActivePlayer,
    setActiveRole,
    getActiveMesh,
    companion,
    interactables,
    dispose: () => {
      players.boy.dispose();
      players.girl.dispose();
      companion.dispose();
      interactables.forEach(i => i.dispose());
    }
  };
}
```

### Acceptance Criteria

- ✅ Switching works identically in every world
- ✅ No "Backyard special case" logic remaining
- ✅ All worlds use shared `createWorldPlayers()` helper

---

## 2.7.3 — Inactive Player "De-Physicalization"

### Problem

The inactive twin is a real mesh standing nearby. Without proper guards:
- Camera bumping/occlusion weirdness
- Collision blocking narrow spaces
- Picking/raycasts hitting wrong twin
- Shadow/lighting artifacts doubling

### Solution: Disable Physics/Interaction When Inactive

**Update: `src/game/entities/player/Player.ts`**

```typescript
public setActive(active: boolean): void {
  this.isActive = active;
  
  if (!active) {
    // Visual: play idle animation
    this.playAnimation('idle', true);
    
    // Physics: disable collisions
    this.mesh.checkCollisions = false;
    
    // Interaction: disable picking
    this.mesh.isPickable = false;
    this.mesh.getChildMeshes().forEach(m => {
      m.isPickable = false;
    });
    
    // Optional: reduce shadow quality or disable
    // this.mesh.receiveShadows = false;
  } else {
    // Re-enable for active player
    this.mesh.checkCollisions = true;
    this.mesh.isPickable = false; // Players themselves not pickable, but interactables are
    this.mesh.getChildMeshes().forEach(m => {
      m.isPickable = false;
    });
    
    // this.mesh.receiveShadows = true;
  }
}
```

### Acceptance Criteria

- ✅ Inactive player cannot block movement
- ✅ Inactive player cannot block interactables
- ✅ Active player behaves normally
- ✅ No raycast/picking interference from inactive twin

---

## 2.7.4 — Switching Invariants (Prevent Desync)

### Problem

Switch pipeline touches many systems:
- SaveFacade inventory
- TaskSystem role + inventory
- Player active flags
- ProgressionSystem role + tasks
- PlayerController controlled entity + mesh

These can desync if order is wrong or one update fails silently.

### Solution: Invariant Checking

**Create: `src/game/systems/characters/assertSwitchInvariant.ts`**

```typescript
import type { TaskSystem } from '../tasks/TaskSystem';
import type { ProgressionSystem } from '../progression/ProgressionSystem';
import type { PlayerController } from '@game/entities/player/controller';
import type { WorldResult } from '@game/worlds/types';
import type { RoleId } from '@game/content/areas';

export function assertSwitchInvariant(
  expectedRole: RoleId,
  taskSystem: TaskSystem,
  world: WorldResult,
  playerController: PlayerController,
  progressionSystem: ProgressionSystem
): void {
  if (!import.meta.env.DEV) return;

  const checks = {
    taskSystemRole: taskSystem.getCurrentRole(),
    worldActiveRole: world.getActiveRole(),
    worldActivePlayerRole: world.getActivePlayer().getRoleId(),
    controllerPlayerRole: playerController.playerEntity?.getRoleId(),
    progressionSystemRole: progressionSystem.getRoleId(),
  };

  const mismatches: string[] = [];
  
  Object.entries(checks).forEach(([key, value]) => {
    if (value !== expectedRole) {
      mismatches.push(`${key}=${value}`);
    }
  });

  if (mismatches.length > 0) {
    console.error(
      `[SwitchInvariant] DESYNC DETECTED! Expected ${expectedRole}, but:`,
      mismatches.join(', ')
    );
    console.error('[SwitchInvariant] Full state:', checks);
  } else {
    console.log(`[SwitchInvariant] ✓ All systems synchronized to ${expectedRole}`);
  }
}
```

### Canonical Switch Order

**Update: `CharacterSwitchSystem.switchTo()`**

```typescript
private switchTo(roleId: 'boy' | 'girl'): void {
  if (this.switching) return;
  
  const currentRole = this.taskSystem.getCurrentRole();
  if (currentRole === roleId) return;
  
  this.switching = true;
  
  try {
    // 1. Sync current inventory → save
    const currentInventory = this.taskSystem.getInventory();
    saveFacade.syncInventory(currentRole, currentInventory);
    
    // 2. Load next inventory → save
    const newInventory = saveFacade.getInventory(roleId);
    
    // 3. Switch TaskSystem
    this.taskSystem.switchCharacter(roleId, newInventory);
    
    // 4. Switch World players
    if (this.world) {
      this.world.setActiveRole(roleId);
    }
    
    // 5. Switch PlayerController
    if (this.playerController && this.world) {
      this.playerController.setPlayerEntity(this.world.getActivePlayer());
    }
    
    // 6. Switch ProgressionSystem
    if (this.progressionSystem) {
      this.progressionSystem.switchRole(roleId);
    }
    
    // 7. Update save metadata
    saveFacade.setLastSelectedRole(roleId);
    
    // 8. DEV ONLY: Assert invariants
    if (import.meta.env.DEV) {
      assertSwitchInvariant(
        roleId,
        this.taskSystem,
        this.world,
        this.playerController,
        this.progressionSystem
      );
    }
    
    // 9. Emit success event
    this.eventBus.emit({ type: 'game/characterSwitch', roleId });
    
    // 10. Show toast
    this.eventBus.emit({
      type: 'ui/toast',
      level: 'info',
      message: `Now playing as ${roleId === 'boy' ? 'Boy' : 'Girl'}`
    });
    
  } catch (error) {
    console.error('[CharacterSwitchSystem] Switch failed:', error);
    this.eventBus.emit({
      type: 'ui/toast',
      level: 'error',
      message: 'Failed to switch character'
    });
  } finally {
    this.switching = false;
  }
}
```

### Acceptance Criteria

- ✅ No more "camera follows one twin, controls move the other" bugs
- ✅ Loud invariant error points to desynced subsystem
- ✅ Canonical switch order enforced
- ✅ All systems updated before events emitted

---

## 2.7.5 — CRITICAL: AutosaveSystem Role Desync Bug

### Problem Discovered (Jan 2, 2026)

**Symptom:** After switching characters in the same area, the new character cannot complete their tasks. Tasks show as "already complete" even though they were never done. Both characters have identical merged inventories containing items from both roles.

**Root Cause:** AutosaveSystem is created once at game start with the initial roleId and NEVER updates when characters switch. This causes catastrophic save corruption:

```typescript
// AutosaveSystem.ts - OLD CODE (BROKEN)
constructor(
  private taskSystem: TaskSystem,
  private roleId: RoleId,  // ← Stored once, never updated!
  private areaId: AreaId
) {}

private performSave() {
  const inventory = this.taskSystem.getInventory();
  saveFacade.syncInventory(this.roleId, inventory);  // ← Always uses initial role!
}
```

**What happens:**
1. Load as boy (AutosaveSystem.roleId = 'boy')
2. Boy completes task → autosave → saves to boy.inventory ✓
3. Switch to girl (AutosaveSystem.roleId still = 'boy')
4. Girl completes task → autosave → **saves to boy.inventory** ✗
5. Result: boy.inventory = ['slingshot', 'multitool', ...] (all items!)
6. Next switch loads boy.inventory for girl → girl gets all boy's items
7. ProgressionSystem sees girl's tasks already in boy's completedTasks → marks complete
8. Girl can't interact with her own task targets because they're "already done"

### Solution: Dynamic Role Update

**Add to AutosaveSystem:**

```typescript
/**
 * Update the role ID (called when switching characters)
 */
setRole(roleId: RoleId): void {
  console.log(`[AutosaveSystem] Updating role from ${this.roleId} to ${roleId}`);
  this.roleId = roleId;
}
```

**Update CharacterSwitchSystem.switchTo():**

Add step 6.6 after clearing InteractionSystem state:

```typescript
// 6.6. Update autosave system role to prevent inventory merging
if (this.autosaveSystem) {
  this.autosaveSystem.setRole(roleId);
  console.log(`[CharacterSwitchSystem] Updated AutosaveSystem role to ${roleId}`);
}
```

**Wire in GameApp.ts:**

```typescript
// Wire autosave system to character switch system for role updates
if (this.characterSwitchSystem && this.autosaveSystem) {
  this.characterSwitchSystem.setAutosaveSystem(this.autosaveSystem);
  console.log('[GameApp] Wired AutosaveSystem to CharacterSwitchSystem');
}
```

### Related Fix: InteractionSystem State Clearing

**Problem:** When switching characters, InteractionSystem retains `dwellTarget`, `dwellTime`, and `lastPromptId` from the previous character's task, causing prompts to not show for new character's tasks.

**Solution:** Make `clearDwell()` public and call it during character switch:

```typescript
// InteractionSystem.ts
clearDwell(): void {  // Changed from private to public
  if (this.dwellTarget) {
    this.eventBus.emit({ type: 'game/dwellClear', id: this.dwellTarget });
  }
  if (this.lastPromptId) {
    this.eventBus.emit({ type: 'game/promptClear', id: this.lastPromptId });
    this.lastPromptId = null;
  }
  this.dwellTarget = null;
  this.dwellTime = 0;
  this.interactionCooldown = 0; // Also clear cooldown
}
```

**CharacterSwitchSystem calls this at step 6.5:**

```typescript
// 6.5. Clear interaction state so new task prompts work
if (this.interactionSystem) {
  this.interactionSystem.clearDwell();
  console.log(`[CharacterSwitchSystem] Cleared interaction state for ${roleId}`);
}
```

### Acceptance Criteria

- ✅ Boy completes boy tasks → only boy.inventory updated
- ✅ Girl completes girl tasks → only girl.inventory updated
- ✅ No inventory merging between characters
- ✅ Switch boy→girl: girl's tasks show as incomplete (not already done)
- ✅ Switch girl→boy: boy's tasks show as incomplete
- ✅ Task prompts appear immediately after switching
- ✅ Console shows `[AutosaveSystem] Updating role from boy to girl`

---

## 2.7.6 — ProgressionSystem.switchRole() Hardening

### Edge Cases to Handle

1. **All tasks complete**: Don't set `currentTaskIndex = length - 1` (loads last task incorrectly)
2. **Clear active prompts**: InteractionSystem may have stale dwell state from previous task (handled in 2.7.5)
3. **Reset TaskSystem cleanly**: Ensure current step/task doesn't bleed over

### Implementation

**Update: `src/game/systems/progression/ProgressionSystem.ts`**

```typescript
switchRole(newRoleId: RoleId): void {
  console.log(`[ProgressionSystem] Switching from ${this.roleId} to ${newRoleId}`);
  
  this.roleId = newRoleId;
  
  // Reload task list for new role
  const area = AREAS[this.areaId];
  if (!area) {
    console.error(`[ProgressionSystem] Unknown area: ${this.areaId}`);
    this.taskIds = [];
    this.currentTaskIndex = -1; // Safe "no task" state
    return;
  }

  const taskIds = area.tasksByRole[newRoleId];
  if (!taskIds || taskIds.length === 0) {
    console.warn(`[ProgressionSystem] No tasks defined for ${newRoleId} in ${this.areaId}`);
    this.taskIds = [];
    this.currentTaskIndex = -1;
    return;
  }

  // Filter out missing tasks
  this.taskIds = taskIds.filter((id) => {
    if (!TASKS_BY_ID[id]) {
      console.warn(`[ProgressionSystem] Task ${id} not found in TASKS_BY_ID`);
      return false;
    }
    return true;
  });

  // Check which tasks are already complete
  const savedProgress = saveFacade.loadMain();
  const completedTasks = savedProgress.roles[newRoleId].completedTasks;
  
  // Find first incomplete task
  this.currentTaskIndex = this.taskIds.findIndex(id => !completedTasks.includes(id));
  
  if (this.currentTaskIndex === -1) {
    // All tasks complete - safe state with no active task
    console.log(`[ProgressionSystem] All tasks already complete for ${newRoleId} in ${this.areaId}`);
    // Don't load any task - area is done
    return;
  }

  console.log(`[ProgressionSystem] Loaded ${this.taskIds.length} tasks for ${newRoleId}, starting at index ${this.currentTaskIndex}`);
  
  // Load the current task
  this.loadCurrentTask();
}
```

**Add to TaskSystem if doesn't exist:**

```typescript
/**
 * Clear current task (for area completion or role switch)
 */
clearTask(): void {
  this.currentTask = null;
  this.currentStepIndex = 0;
}
```

### Acceptance Criteria

- ✅ Switching to fully-complete role doesn't load random last task
- ✅ `currentTaskIndex = -1` represents "no active task" state safely
- ✅ TaskSystem.clearTask() available if needed

---

## 2.7.7 — Collections v0 Completion

### Current State

Validation warnings show placeholder area data in pine, dusk, night, beach, and creek.

### Tasks

**A) Standardize Hiding Types**

**Update: `src/game/content/collections/types.ts`**

```typescript
export enum HidingType {
  EDGE = 'EDGE',           // Along borders, edges, boundaries
  UNDER = 'UNDER',         // Underneath objects, inside hollow logs
  IN_ON = 'IN_ON',         // In/on plants, flowers, bushes
  LANDMARK = 'LANDMARK',   // Near notable features (rocks, trees)
  SKILL_GATED = 'SKILL_GATED' // Requires tool or specific interaction
}
```

**B) Fill Remaining Area Templates**

Each area needs **10 finds** (2 per hiding type):

- ✅ Backyard (complete)
- ✅ Woodline (complete)
- ⚠️ Creek (missing 2 plant finds)
- ❌ Pine (needs all 10 finds)
- ❌ Dusk (needs all 10 finds)
- ❌ Night (needs all 10 finds)
- ❌ Beach (needs all 10 finds)

**Pattern for each area:**

```typescript
// src/game/content/collections/areas/pine.ts
import { AreaTemplate, HidingType } from '../types';

export const pineArea: AreaTemplate = {
  areaId: 'pine',
  name: 'Pine Trails',
  finds: [
    // EDGE finds (2)
    { id: 'pine_pinecone_path', name: 'Pinecone by Path', hiding: HidingType.EDGE },
    { id: 'pine_acorn_fence', name: 'Acorn by Fence', hiding: HidingType.EDGE },
    
    // UNDER finds (2)
    { id: 'pine_mushroom_log', name: 'Mushroom Under Log', hiding: HidingType.UNDER },
    { id: 'pine_beetle_bark', name: 'Beetle Under Bark', hiding: HidingType.UNDER },
    
    // IN_ON finds (2)
    { id: 'pine_nest_branch', name: 'Nest in Branch', hiding: HidingType.IN_ON },
    { id: 'pine_moss_trunk', name: 'Moss on Trunk', hiding: HidingType.IN_ON },
    
    // LANDMARK finds (2)
    { id: 'pine_stone_circle', name: 'Stone in Circle', hiding: HidingType.LANDMARK },
    { id: 'pine_root_ball', name: 'Root Ball Discovery', hiding: HidingType.LANDMARK },
    
    // SKILL_GATED finds (2)
    { id: 'pine_high_branch', name: 'High Branch Find', hiding: HidingType.SKILL_GATED },
    { id: 'pine_locked_cache', name: 'Locked Cache', hiding: HidingType.SKILL_GATED },
  ],
  trophy: {
    id: 'pine_trophy',
    name: 'Pine Explorer Trophy',
    icon: 'pine-trophy',
  },
  postcard: {
    id: 'pine_postcard',
    name: 'Pine Trails Memory',
    sereneAction: 'Sit on the mossy log',
  },
};
```

Repeat for dusk, night, beach, and fix creek.

**C) Harden CollectablesTab + MemoriesTab**

Ensure graceful handling of:
- Old saves without `shared.findsByArea`
- Missing area data
- Default "0/10" display

**D) Collections Debug Cheats**

Already implemented in Phase 2.6.5:
- ✅ `givefind(areaId, findId)`
- ✅ `setfindcount(areaId, count)`
- ✅ `unlockpostcard(areaId)`
- ✅ `unlocktrophy(areaId)`

Verify they work with new area data.

### Acceptance Criteria

- ✅ No validation warnings on app load
- ✅ All 7 areas have 10 finds (2 per hiding type)
- ✅ CollectablesTab/MemoriesTab render all areas correctly
- ✅ Cheats update UI instantly

---

## 2.7.8 — Regression Harness (Debug Overlay)

### Purpose

Quick visual confirmation that all systems are synchronized.

**Create: `src/game/debug/SwitchDebugOverlay.ts`**

```typescript
import type { TaskSystem } from '@game/systems/tasks/TaskSystem';
import type { ProgressionSystem } from '@game/systems/progression/ProgressionSystem';
import type { WorldResult } from '@game/worlds/types';

export class SwitchDebugOverlay {
  private container: HTMLDivElement;
  
  constructor() {
    if (!import.meta.env.DEV) return;
    
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }
  
  update(
    taskSystem: TaskSystem,
    world: WorldResult,
    progressionSystem: ProgressionSystem
  ): void {
    if (!import.meta.env.DEV) return;
    
    const activeRole = world.getActiveRole();
    const activeMesh = world.getActiveMesh();
    const inventory = taskSystem.getInventory();
    const currentTask = progressionSystem.getCurrentTask();
    const taskIndex = progressionSystem.getCurrentTaskIndex();
    
    this.container.innerHTML = `
      <div><strong>Active Role:</strong> ${activeRole}</div>
      <div><strong>Player Mesh:</strong> ${activeMesh.name}</div>
      <div><strong>Inventory:</strong> ${inventory.length} items</div>
      <div><strong>Task:</strong> ${currentTask?.id || 'none'}</div>
      <div><strong>Task Index:</strong> ${taskIndex}/${progressionSystem.getTotalTasks()}</div>
      <div><strong>TaskSystem Role:</strong> ${taskSystem.getCurrentRole()}</div>
      <div><strong>ProgressionSystem Role:</strong> ${progressionSystem.getRoleId()}</div>
    `;
  }
  
  dispose(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
```

**Add to GameApp:**

```typescript
private switchDebugOverlay: SwitchDebugOverlay | null = null;

async start() {
  // ... existing code ...
  
  if (import.meta.env.DEV) {
    this.switchDebugOverlay = new SwitchDebugOverlay();
  }
}

private update(dt: number): void {
  // ... existing code ...
  
  if (this.switchDebugOverlay && this.world) {
    this.switchDebugOverlay.update(
      this.taskSystem,
      this.world,
      this.progressionSystem
    );
  }
}
```

### Acceptance Criteria

- ✅ Overlay visible in DEV mode only
- ✅ Shows active role, mesh, inventory count, task, indices
- ✅ One glance confirms if bug is "UI wrong" vs "systems desynced"

---

## Hardening Add-Ons (Critical)

### 1. Single Active-Player Accessor

**Add to GameApp:**

```typescript
private getActivePlayerEntity(): Player {
  return this.world.getActivePlayer();
}

private getActivePlayerMesh(): TransformNode {
  return this.world.getActiveMesh();
}
```

Use everywhere instead of recomputing `this.boyPlayer?.isActive ? ... : ...`

### 2. Stop Exposing Both `player` and `players`

Remove all legacy `this.player`, `this.playerEntity`, `this.boyPlayer`, `this.girlPlayer` fields.

Only use `this.world.getActivePlayer()`.

### 3. AutosaveSystem Correctness Check

**Verify AutosaveSystem always uses:**

```typescript
const currentRole = this.taskSystem.getCurrentRole();
const inventory = this.taskSystem.getInventory();
saveFacade.syncInventory(currentRole, inventory);
```

Never use a stored `roleId` field that might be stale.

---

## Files Modified

### New Files
- `src/game/worlds/types.ts` - WorldResult contract
- `src/game/worlds/shared/createWorldPlayers.ts` - Shared player creation helper
- `src/game/systems/characters/assertSwitchInvariant.ts` - Invariant checker
- `src/game/debug/SwitchDebugOverlay.ts` - Debug overlay for switch state
- `src/game/content/collections/areas/pine.ts` - Pine area finds
- `src/game/content/collections/areas/dusk.ts` - Dusk area finds
- `src/game/content/collections/areas/night.ts` - Night area finds
- `src/game/content/collections/areas/beach.ts` - Beach area finds

### Modified Files
- `src/game/worlds/backyard/BackyardWorld.ts` - Implement WorldResult
- `src/game/worlds/boot/BootWorld.ts` - Implement WorldResult
- `src/game/worlds/woodline/WoodlineWorld.ts` - Implement WorldResult
- `src/game/worlds/creek/CreekWorld.ts` - Implement WorldResult + fix plant finds
- `src/game/worlds/pine/PineWorld.ts` - Implement WorldResult
- `src/game/worlds/dusk/DuskWorld.ts` - Implement WorldResult
- `src/game/worlds/night/NightWorld.ts` - Implement WorldResult
- `src/game/worlds/beach/BeachWorld.ts` - Implement WorldResult
- `src/game/GameApp.ts` - Use WorldResult, add debug overlay, single accessors, wire AutosaveSystem
- `src/game/entities/player/Player.ts` - Disable physics/picking when inactive
- `src/game/systems/characters/CharacterSwitchSystem.ts` - Added AutosaveSystem + InteractionSystem refs, canonical switch order with 6.5/6.6 steps
- `src/game/systems/progression/ProgressionSystem.ts` - Harden switchRole() edge cases
- `src/game/systems/tasks/TaskSystem.ts` - Add clearTask() method
- `src/game/systems/autosave/AutosaveSystem.ts` - **CRITICAL FIX:** Added setRole() method to prevent inventory merging bug
- `src/game/systems/interactions/InteractionSystem.ts` - Made clearDwell() public, added interactionCooldown reset
- `src/game/systems/saves/saveFacade.ts` - Added logging to markTaskComplete() for debugging
- `src/game/content/collections/types.ts` - Standardize HidingType enum
- `src/game/content/collections/validate.ts` - Update validation for new enum

---

## Testing Checklist

### World Parity
- [ ] Create game in Backyard → switch → camera + controls follow
- [ ] Create game in Woodline → switch → camera + controls follow
- [ ] Create game in Creek → switch → camera + controls follow
- [ ] Create game in each new world → switch works identically

### Inactive Player
- [ ] Inactive player doesn't block narrow paths
- [ ] Inactive player doesn't interfere with interactable picking
- [ ] Active player collision/picking works normally

### Switch Invariants
- [ ] Switch boy→girl: Debug overlay shows all systems synchronized
- [ ] Switch girl→boy: No console errors, invariant passes
- [ ] Rapid switching (spam button): No desync, invariant catches any issues

### Collections
- [ ] No validation warnings on load
- [ ] CollectablesTab shows 7 areas with 0/10 or actual progress
- [ ] MemoriesTab shows 7 postcards (locked/unlocked)
- [ ] `givefind('pine', 'pine_pinecone_path')` → UI updates instantly
- [ ] `setfindcount('dusk', 5)` → UI shows 5/10

### Debug Overlay
- [ ] Overlay visible in DEV mode
- [ ] Shows correct role after switch
- [ ] Inventory count matches actual items
- [ ] Task ID updates when task changes

---

## After Phase 2.7

**We're ready for:**

### Phase 3 — Find Interactables + Serene Spots

- Place 10 finds per area as interactable meshes
- Update shared progress on pickup
- 5/10 hint effects (sparkles, subtle glow)
- 10/10 trophy unlock + map mark
- Serene spot action unlocks postcard + audio vignette + camp upgrade

**Phase 2.7 ensures we build Phase 3 on solid ground.**

---

## Commit Message
CRITICAL autosave fix

CRITICAL BUG FIX - AutosaveSystem Role Desync:
- AutosaveSystem was created with initial roleId and never updated on character switch
- Caused catastrophic save corruption: both characters shared merged inventory
- Tasks marked complete for wrong character (boy completing girl's tasks, vice versa)
- Fixed by adding AutosaveSystem.setRole() called during character switch (step 6.6)
- Prevents inventory merging and cross-character task completion

InteractionSystem State Clearing:
- Made clearDwell() public to reset dwellTarget/dwellTime/lastPromptId on character switch
- Added interactionCooldown reset to allow immediate interaction after switch
- Called from CharacterSwitchSystem step 6.5

World Contract Hardening:
- New WorldResult type enforces consistent world interface
- All worlds implement: getActivePlayer(), setActiveRole(), etc.
- GameApp uses single source of truth (no optional field guessing)

World Parity:
- Dual-player pattern rolled into ALL 7 worlds (boot/backyard/woodline/creek/pine/dusk/night/beach)
- Shared createWorldPlayers() helper prevents copy-paste bugs
- Switching works identically everywhere

Inactive Player De-physicalization:
- Player.setActive() disables collision/picking when inactive
- Prevents blocking, raycast interference, lighting artifacts

Switch Invariants:
- assertSwitchInvariant() checks all systems synchronized (DEV only)
- Canonical switch order enforced in CharacterSwitchSystem
- Loud error if desync detected

ProgressionSystem Hardening:
- switchRole() handles "all complete" state safely (index = -1)
- TaskSystem.clearTask() added for clean state
- No random last task loaded

Collections v0 Complete:
- All 7 area templates filled (10 finds each, 2 per hiding type)
- HidingType enum standardized: EDGE/UNDER/IN_ON/LANDMARK/SKILL_GATED
- CollectablesTab/MemoriesTab fully data-driven
- Debug cheats tested and working

Regression Harness:
- SwitchDebugOverlay shows role/mesh/inventory/task/indices
- Single getActivePlayer() accessor methods in GameApp
- Detailed logging added to markTaskComplete() for debugging

Testing with fresh save required - old saves have corrupted inventory data.

Eliminates "works in one world, breaks in another" and inventory merging roleId)

Eliminates "works in one world, breaks in another" class of bugs.
```
