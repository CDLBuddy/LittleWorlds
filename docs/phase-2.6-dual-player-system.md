# Phase 2.6: Dual-Player System Implementation

**Date:** January 2, 2026  
**Status:** ✅ Complete

## Overview

Implemented a dual-player system where both boy and girl character models exist simultaneously in the world. Character switching now swaps the active player rather than reloading the world, providing natural visual transitions and eliminating inventory bugs.

## Problem Statement

After Phase 2 implementation, character switching had critical issues:
- **Inventory Bug**: Tools tab showed "No tools yet" after switching characters (even though inventory data existed)
- **Visual Bug**: Character models didn't visually switch - stayed as original character
- **Root Cause**: World reload approach (using `sessionFacade.setArea()`) caused GameApp recreation, breaking inventory state

## Solution Architecture

### Dual-Player System Design

Instead of destroying/recreating players on switch:
1. **Both players exist at world creation**
   - Boy and girl Player entities created simultaneously
   - One marked `isActive = true` based on starting roleId
   - Inactive player positioned nearby (offset by 2 units)

2. **Switching swaps active state**
   - CharacterSwitchSystem calls `setActive()` on both players
   - PlayerController only controls active player
   - Camera automatically follows active player
   - No world reload needed

## Implementation Details

### 1. Player.ts - Active State Management

**Added Properties:**
- `public isActive: boolean` - Tracks if this player should receive input
- Constructor accepts `isActive` parameter (default `true`)

**New Methods:**
```typescript
setActive(active: boolean): void {
  this.isActive = active;
  if (!active) {
    this.playAnimation('idle', true);
  }
}

getRoleId(): RoleId {
  return this.roleId;
}
```

### 2. BackyardWorld.ts - Dual Player Creation

**Return Type Updated:**
```typescript
{
  player: TransformNode;
  playerEntity: Player;
  boyPlayer: Player;      // NEW
  girlPlayer: Player;     // NEW
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
}
```

**Player Creation:**
```typescript
const boyPlayer = new Player(scene, spawnPos, 'boy', roleId === 'boy');
const girlPlayer = new Player(scene, spawnPos.clone().add(new Vector3(2, 0, 0)), 'girl', roleId === 'girl');
const player = roleId === 'boy' ? boyPlayer.mesh : girlPlayer.mesh;
const playerEntity = roleId === 'boy' ? boyPlayer : girlPlayer;
```

Both players created, one active. Legacy `player` and `playerEntity` maintained for backward compatibility.

**Dispose Updated:**
```typescript
boyPlayer.dispose();
girlPlayer.dispose();
```

### 3. CharacterSwitchSystem.ts - Active State Swapping + Task Switching

**New Fields:**
```typescript
private boyPlayer: Player | null = null;
private girlPlayer: Player | null = null;
private progressionSystem: ProgressionSystem | null = null;
```

**New Methods:**
```typescript
setPlayers(boyPlayer: Player, girlPlayer: Player): void {
  this.boyPlayer = boyPlayer;
  this.girlPlayer = girlPlayer;
}

setProgressionSystem(progressionSystem: ProgressionSystem): void {
  this.progressionSystem = progressionSystem;
}
```

**Switch Logic Updated:**
```typescript
// 5. Swap active/inactive player entities (visual model switch)
if (this.boyPlayer && this.girlPlayer) {
  this.boyPlayer.setActive(roleId === 'boy');
  this.girlPlayer.setActive(roleId === 'girl');
  console.log(`[CharacterSwitchSystem] Visual switch: ${roleId} is now active`);
}

// 6. Reload tasks for new role (ProgressionSystem)
if (this.progressionSystem) {
  this.progressionSystem.switchRole(roleId);
  console.log(`[CharacterSwitchSystem] ProgressionSystem updated to ${roleId} tasks`);
}
```

### 4. GameApp.ts - Dual Player Management

**New Fields:**
```typescript
private boyPlayer: Player | null = null;
private girlPlayer: Player | null = null;
```

**World Type Updated:**
```typescript
let world: {
  player: TransformNode;
  playerEntity: Player;
  boyPlayer?: Player;     // NEW
  girlPlayer?: Player;    // NEW
  companion: Companion;
  // ...
};
```

**After World Load:**
```typescript
this.boyPlayer = world.boyPlayer || null;
this.girlPlayer = world.girlPlayer || null;

// Wire up player references for visual switching
if (this.boyPlayer && this.girlPlayer && this.characterSwitchSystem) {
  this.characterSwitchSystem.setPlayers(this.boyPlayer, this.girlPlayer);
  console.log('[GameApp] Wired boy/girl player references to CharacterSwitchSystem');
}
```

**After ProgressionSystem Creation:**
```typescript
this.progressionSystem.start();

// Wire progression system to character switch system for task reloading
if (this.characterSwitchSystem && this.progressionSystem) {
  this.characterSwitchSystem.setProgressionSystem(this.progressionSystem);
  console.log('[GameApp] Wired ProgressionSystem to CharacterSwitchSystem');
}
```

**Event Handler Added:**
```typescript
} else if (event.type === 'game/characterSwitch') {
  // Handle visual character switch
  this.onCharacterSwitch(event.roleId);
}
```

**New Handler Method:**
```typescript
private onCharacterSwitch(roleId: RoleId): void {
  console.log('[GameApp] Handling character switch to:', roleId);
  
  // Update PlayerController to control the new active player
  const newActivePlayer = roleId === 'boy' ? this.boyPlayer : this.girlPlayer;
  if (newActivePlayer && this.playerController) {
    this.playerController.setPlayerEntity(newActivePlayer);
    console.log(`[GameApp] PlayerController now controlling: ${roleId}`);
  }
  
  // Camera will automatically follow the active player in update loop
}
```

**Update Loop Modified:**
```typescript
// Determine active player for camera/systems
const activePlayer = this.boyPlayer?.isActive ? this.boyPlayer.mesh : this.girlPlayer?.isActive ? this.girlPlayer.mesh : this.player;

// Update companion AI
if (this.companion && activePlayer) {
  const pos = activePlayer.position;
  if (!isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z)) {
    this.companion.update(dt, pos);
  }
}

// Update camera rig
if (this.cameraRig && activePlayer) {
  const yawDelta = this.playerController?.getYawDelta() ?? 0;
  this.cameraRig.update(activePlayer.position, interestPos, dt, yawDelta);
}

// Update interaction system
if (this.interactionSystem && activePlayer) {
  this.interactionSystem.update(activePlayer.position, dt);
}
```

### 5. PlayerController.ts - Active Player Check + Mesh Update

**Early Return Added:**
```typescript
public update(dt: number): void {
  if (!this.enabled) return;
  if (!Number.isFinite(dt) || dt <= 0) return;
  
  // Only control the active player
  if (this.playerEntity && !this.playerEntity.isActive) {
    return;
  }
  
  // ... rest of input processing
}
```

**setPlayerEntity Method Updated:**
```typescript
public setPlayerEntity(player: Player): void {
  this.playerEntity = player;
  // Update the controlled mesh reference
  this.player = player.mesh;
}
```

### 6. ProgressionSystem.ts - Role Switching

**New Method:**
```typescript
switchRole(newRoleId: RoleId): void {
  console.log(`[ProgressionSystem] Switching from ${this.roleId} to ${newRoleId}`);
  
  this.roleId = newRoleId;
  
  // Reload task list for new role
  const area = AREAS[this.areaId];
  const taskIds = area.tasksByRole[newRoleId];
  
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
    // All tasks complete
    console.log(`[ProgressionSystem] All tasks already complete for ${newRoleId} in ${this.areaId}`);
    this.currentTaskIndex = this.taskIds.length - 1;
    return;
  }

  console.log(`[ProgressionSystem] Loaded ${this.taskIds.length} tasks for ${newRoleId}, starting at index ${this.currentTaskIndex}`);
  
  // Load the current task
  this.loadCurrentTask();
}
```

## Switch Flow

1. User clicks **Switch** button in CharacterMenu
2. UI emits `ui/switchCharacter` event with target roleId
3. CharacterSwitchSystem receives event:
   - Saves current role's inventory to SaveSystem
   - Loads target role's inventory from SaveSystem
   - Updates TaskSystem with new role and inventory
   - **Swaps active states**: `boyPlayer.setActive()` / `girlPlayer.setActive()`
   - **Reloads tasks**: `progressionSystem.switchRole(roleId)` - loads task list for new role, finds first incomplete task
   - Emits `game/characterSwitch` event
   - Shows toast: "Now playing as Boy/Girl"
4. GameApp receives `game/characterSwitch`:
   - Updates PlayerController to control new active player (both entity and mesh references)
5. Update loop automatically:
   - Uses active player for camera follow
   - Uses active player for companion tracking
   - Uses active player for interactions

## Benefits

✅ **Natural Visual Switch**: Both models exist, camera smoothly transitions between them  
✅ **Stable Inventory**: No world reload = no GameApp recreation = inventory state preserved  
✅ **Correct Task Switching**: ProgressionSystem automatically loads appropriate tasks for each role  
✅ **Proper Movement Control**: PlayerController updates both entity and mesh references on switch  
✅ **Simpler Architecture**: No complex timing/handshake needed for world reload  
✅ **Future Features**: Opens door for both characters visible simultaneously, co-op style interactions  
✅ **Performance**: No teardown/rebuild overhead on character switch

## Testing Checklist

- [x] Start as boy, collect items, switch to girl → boy model visible nearby, camera follows girl
- [x] Girl starts with empty inventory (separate from boy)
- [x] Collect girl items, switch back to boy → girl model visible nearby, camera follows boy
- [x] Boy inventory preserved (axe still there)
- [x] No "No tools yet" bug appears
- [x] Switch happens instantly without world reload
- [x] Both characters animate correctly (idle when inactive, walk when active)

## Issues Found During Manual Testing

### Issue 1: Movement Controls Stayed with Original Character

**Problem:** After switching characters, camera followed the new character but movement controls (WASD/click-to-move) still controlled the original character.

**Root Cause:** `PlayerController.setPlayerEntity()` only updated the `playerEntity` reference (used for isActive check) but didn't update the `player` mesh reference (used for actual movement).

**Fix:** Updated `setPlayerEntity()` method in `controller.ts`:
```typescript
public setPlayerEntity(player: Player): void {
  this.playerEntity = player;
  // Update the controlled mesh reference
  this.player = player.mesh;
}
```

**Testing:** Verified that after switching from boy to girl, both camera AND movement controls follow the girl character.

---

### Issue 2: Tasks Didn't Switch Between Roles

**Problem:** After switching from boy to girl, the game still showed boy's tasks. Girl character couldn't complete her own tasks.

**Root Cause:** `ProgressionSystem` was initialized with a specific `roleId` and never updated when character switched. It continued tracking the original role's task progression.

**Fix Applied:**

1. **Added `switchRole()` method to ProgressionSystem** (`ProgressionSystem.ts`):
   ```typescript
   switchRole(newRoleId: RoleId): void {
     console.log(`[ProgressionSystem] Switching from ${this.roleId} to ${newRoleId}`);
     
     this.roleId = newRoleId;
     
     // Reload task list for new role from AREAS registry
     const area = AREAS[this.areaId];
     const taskIds = area.tasksByRole[newRoleId];
     
     // Filter out missing tasks
     this.taskIds = taskIds.filter(id => TASKS_BY_ID[id]);
     
     // Check which tasks are already complete from save data
     const savedProgress = saveFacade.loadMain();
     const completedTasks = savedProgress.roles[newRoleId].completedTasks;
     
     // Find first incomplete task
     this.currentTaskIndex = this.taskIds.findIndex(id => !completedTasks.includes(id));
     
     if (this.currentTaskIndex === -1) {
       // All tasks complete
       this.currentTaskIndex = this.taskIds.length - 1;
       return;
     }
     
     // Load the current task
     this.loadCurrentTask();
   }
   ```

2. **Updated CharacterSwitchSystem** to call ProgressionSystem:
   - Added `private progressionSystem: ProgressionSystem | null` field
   - Added `setProgressionSystem()` method
   - Called `progressionSystem.switchRole(roleId)` during character switch

3. **Wired in GameApp.ts** after ProgressionSystem creation:
   ```typescript
   // Wire progression system to character switch system for task reloading
   if (this.characterSwitchSystem && this.progressionSystem) {
     this.characterSwitchSystem.setProgressionSystem(this.progressionSystem);
     console.log('[GameApp] Wired ProgressionSystem to CharacterSwitchSystem');
   }
   ```

**Testing:** Verified that switching from boy to girl correctly loads girl's tasks, and switching back to boy loads boy's tasks at their current progress.

---

## Console Warnings During Testing

The following validation warnings appeared during development (incomplete area templates):

```
[AreaTemplate] creek must have exactly 2 plant finds, got 0
[AreaTemplate] pine must have exactly 2 ground finds, got 0
[AreaTemplate] pine must have exactly 2 tree finds, got 0
[AreaTemplate] pine must have exactly 2 water finds, got 0
[AreaTemplate] pine must have exactly 2 rock finds, got 0
[AreaTemplate] pine must have exactly 2 plant finds, got 0
[AreaTemplate] dusk must have exactly 2 ground finds, got 0
[AreaTemplate] dusk must have exactly 2 tree finds, got 0
[AreaTemplate] dusk must have exactly 2 water finds, got 0
[AreaTemplate] dusk must have exactly 2 rock finds, got 0
[AreaTemplate] dusk must have exactly 2 plant finds, got 0
[AreaTemplate] night must have exactly 2 ground finds, got 0
[AreaTemplate] night must have exactly 2 tree finds, got 0
[AreaTemplate] night must have exactly 2 water finds, got 0
[AreaTemplate] night must have exactly 2 rock finds, got 0
[AreaTemplate] night must have exactly 2 plant finds, got 0
[AreaTemplate] beach must have exactly 2 ground finds, got 0
[AreaTemplate] beach must have exactly 2 tree finds, got 0
[AreaTemplate] beach must have exactly 2 water finds, got 0
[AreaTemplate] beach must have exactly 2 rock finds, got 0
[AreaTemplate] beach must have exactly 2 plant finds, got 0
```

**Note:** These are expected validation warnings for placeholder area templates (pine, dusk, night, beach, creek). These areas were created with template data in Phase 2.6.4 but don't have actual finds implemented yet. They will be populated in future phases as those worlds are built out.

## Testing Checklist

- [x] Start as boy, collect items, switch to girl → boy model visible nearby, camera follows girl
- [x] Girl starts with empty inventory (separate from boy)
- [x] Collect girl items, switch back to boy → girl model visible nearby, camera follows boy
- [x] Boy inventory preserved (axe still there)
- [x] No "No tools yet" bug appears
- [x] Switch happens instantly without world reload
- [x] Both characters animate correctly (idle when inactive, walk when active)

## Files Modified

### Core Systems
- `src/game/entities/player/Player.ts` - Added isActive flag and setActive() method
- `src/game/entities/player/controller.ts` - Only control active player, update mesh reference in setPlayerEntity()
- `src/game/systems/characters/CharacterSwitchSystem.ts` - Swap active states, wire ProgressionSystem for task switching
- `src/game/systems/progression/ProgressionSystem.ts` - Added switchRole() method to reload tasks for new role
- `src/game/GameApp.ts` - Store both players, wire to CharacterSwitchSystem and ProgressionSystem, use active player in update loop
- `src/ui/inventory/tabs/CollectablesTab.tsx` - Fixed unused 'idx' parameter TypeScript error

### Worlds
- `src/game/worlds/backyard/BackyardWorld.ts` - Create both players, return both references

### Remaining Work
- Other 6 world creation functions (woodline/creek/pine/dusk/night/beach/boot) still need dual-player pattern
- Currently only BackyardWorld creates both players
- Other worlds will need updates to match BackyardWorld pattern

## Technical Debt

1. **World Parity**: Need to update remaining 6 world functions with dual-player creation:
   - `WoodlineWorld.ts`
   - `CreekWorld.ts`
   - `PineWorld.ts`
   - `DuskWorld.ts`
   - `NightWorld.ts`
   - `BeachWorld.ts`
   - `BootWorld.ts` (tutorial area)

2. **Inactive Player Behavior**: Currently inactive player stays at spawn offset position
   - Future: Could add follow behavior (inactive player follows active at distance)
   - Future: Could hide inactive player entirely
   - Current approach is simple and functional

## Related Phases

- **Phase 2.0-2.5**: Inventory system stabilization (useInventoryFeed, per-role caching)
- **Phase 2.6.0**: EventBus singleton audit
- **Phase 2.6.1**: useInventoryFeed hook with per-role caching
- **Phase 2.6.2**: game/appReady handshake
- **Phase 2.6.3**: Removed world reload from CharacterSwitchSystem
- **Phase 2.6.4**: Collections system implementation (this phase)

## Commit

```
Phase 2.6: Dual-player system for natural character switching

- Player.ts: Add isActive flag and setActive() method
- BackyardWorld: Create both boy and girl players simultaneously
- CharacterSwitchSystem: Swap active states + wire ProgressionSystem
- ProgressionSystem: Add switchRole() to reload tasks for new role
- GameApp: Store both players, wire systems, use active player in update loop
- PlayerController: Only control active player, update mesh reference in setPlayerEntity()
- CollectablesTab: Fix unused 'idx' parameter TypeScript error

Fixes found during manual testing:
1. Movement controls now follow switched character (mesh reference update)
2. Tasks now correctly switch between boy/girl roles (ProgressionSystem.switchRole)

Both models exist in world, switching transfers active state + reloads appropriate tasks.
```
