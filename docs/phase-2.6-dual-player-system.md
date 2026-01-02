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

### 3. CharacterSwitchSystem.ts - Active State Swapping

**New Fields:**
```typescript
private boyPlayer: Player | null = null;
private girlPlayer: Player | null = null;
```

**New Method:**
```typescript
setPlayers(boyPlayer: Player, girlPlayer: Player): void {
  this.boyPlayer = boyPlayer;
  this.girlPlayer = girlPlayer;
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

### 5. PlayerController.ts - Active Player Check

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

## Switch Flow

1. User clicks **Switch** button in CharacterMenu
2. UI emits `ui/switchCharacter` event with target roleId
3. CharacterSwitchSystem receives event:
   - Saves current role's inventory to SaveSystem
   - Loads target role's inventory from SaveSystem
   - Updates TaskSystem with new role and inventory
   - **Swaps active states**: `boyPlayer.setActive()` / `girlPlayer.setActive()`
   - Emits `game/characterSwitch` event
   - Shows toast: "Now playing as Boy/Girl"
4. GameApp receives `game/characterSwitch`:
   - Updates PlayerController to control new active player
5. Update loop automatically:
   - Uses active player for camera follow
   - Uses active player for companion tracking
   - Uses active player for interactions

## Benefits

✅ **Natural Visual Switch**: Both models exist, camera smoothly transitions between them  
✅ **Stable Inventory**: No world reload = no GameApp recreation = inventory state preserved  
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

## Files Modified

### Core Systems
- `src/game/entities/player/Player.ts` - Added isActive flag and setActive() method
- `src/game/entities/player/controller.ts` - Only control active player
- `src/game/systems/characters/CharacterSwitchSystem.ts` - Swap active states
- `src/game/GameApp.ts` - Store both players, wire to CharacterSwitchSystem, use active player in update loop

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
- CharacterSwitchSystem: Swap active states instead of reloading world
- GameApp: Store both players, wire to CharacterSwitchSystem
- PlayerController: Only control active player (check isActive)
- GameApp update loop: Use active player for camera/companion/interactions

Fixes visual character switching while maintaining inventory stability.
Both models exist in world, switching just transfers active state.
```
