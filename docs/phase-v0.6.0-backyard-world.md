# Phase v0.6.0 — Backyard World (Greybox) + Task Wiring + Gate to Woodline

**Status**: ✅ COMPLETE  
**Date**: 2025-12-27

---

## Goal

Create the first real playable Area World: **BACKYARD**.

Wire the Backyard tasks (boy/girl) to real interactables in the world and add a fence + gate boundary that transitions to Woodline *only if unlocked for the selected role*.

In this phase:
- Backyard becomes the default real world for `areaId='backyard'`
- Woodline remains BootWorld (until Phase v0.6.1)
- Gate enforces progression gating with soft block for locked areas

---

## Files Added

### 1. `src/game/worlds/backyard/BackyardWorld.ts`
**Purpose**: First real playable area world factory  
**Responsibilities**:
- Morning sky + lighting (soft warm directional + hemi)
- Large ground plane (80x80)
- Simple house marker (beige box)
- White picket fence boundary with gap for gate
- Player spawn at (0, 0.9, 20) - center-front
- Companion spawn at (3, 0.4, 22) - front-left of player

**Interactables** (greybox primitives):
- `slingshot_pickup` (boy task) - Small hovering brown box at (-10, 0, 10)
- `backyard_target` (boy task) - Red cylinder at (-15, 0, -5)
- `multitool_pickup` (girl task) - Gray hovering box at (10, 0, 10)
- `carve_station` (girl task) - Wood-colored workbench at (15, 0, -5)
- `backyard_gate` (transition) - Wood gate at (0, 0, -30) in back fence

**Features**:
- Pickup interactables hide after interaction
- Target + workbench remain enabled for repeated use
- Gate emits `game/areaRequest` event with `areaId: 'woodline'`
- Helper factories: `createPickupInteractable`, `createTargetInteractable`, `createWorkbenchInteractable`, `createGateInteractable`

### 2. `src/game/session/sessionFacade.ts`
**Purpose**: Game-side session access without React hooks  
**Exports**:
- `getSession(): { roleId, areaId, slotId }` - Read current session
- `setArea(areaId)` - Update area (triggers GameHost remount)
- `setRole(roleId)` - Update role

**Implementation**: Wraps `useGameSession.getState()` Zustand store for use in game code (non-React context)

---

## Files Modified

### 3. `src/game/GameHost.tsx`
**Changes**:
- Subscribe to session changes via `useGameSession` hooks
- Added `roleId`, `areaId`, `slotId` dependencies to `useEffect`
- GameApp now remounts when role or area changes
- Ensures clean disposal → re-initialization on area transitions

**Effect**: Changing `sessionFacade.setArea()` triggers full world reload with new area

### 4. `src/game/GameApp.ts`
**Changes**:

#### Imports
- Added `createBackyardWorld` from `@game/worlds/backyard/BackyardWorld`
- Added `saveFacade` from `@game/systems/saves/saveFacade`
- Added `sessionFacade` from `@game/session/sessionFacade`

#### World Loading (start method)
- **Area-based world factory**:
  ```typescript
  if (this.startParams.areaId === 'backyard') {
    world = createBackyardWorld(scene, bus, roleId);
  } else {
    world = createBootWorld(scene, bus, roleId); // Fallback
  }
  ```
- BackyardWorld loads for `areaId='backyard'`
- BootWorld remains fallback for Woodline (until Phase v0.6.1)

#### ProgressionSystem devBootFallback
- **Changed**:
  ```typescript
  const useDevBootFallback = import.meta.env.DEV && this.startParams.areaId !== 'backyard';
  ```
- Disables campfire_v1 fallback for Backyard (real tasks start)
- Keeps fallback enabled for other areas in DEV mode

#### Gate Area Request Handler
- **New method**: `onAreaRequest(areaId)`
- Checks if requested area is unlocked via `saveFacade.getUnlockedAreas(roleId)`
- **If unlocked**: 
  - Calls `sessionFacade.setArea(areaId)`
  - GameHost remount handles transition
- **If locked**:
  - Emits `ui/toast` event: "Keep exploring to go deeper."
  - Soft block (no crash)

### 5. `src/game/shared/events.ts`
**Changes**:
- Added `ui/toast` event type:
  ```typescript
  { type: 'ui/toast'; level: 'info' | 'warning' | 'error'; message: string }
  ```
- Added `game/areaRequest` event type:
  ```typescript
  { type: 'game/areaRequest'; areaId: string }
  ```

**Purpose**: Gate transitions emit area requests, GameApp handles unlock gating

---

## How It Works

### Backyard World (Greybox)
1. Morning lighting creates warm, inviting atmosphere
2. White picket fence defines play area boundaries
3. Gate positioned at back-middle with 10-unit gap in fence
4. Role-specific interactables positioned symmetrically:
   - Boy tasks (left side): slingshot → target
   - Girl tasks (right side): multitool → carve station
5. All primitives color-coded:
   - Brown = wood/tools
   - Red = targets
   - Gray = metal
   - White = boundaries

### Task Wiring
1. ProgressionSystem starts correct task chain for Backyard (no fallback)
2. Boy starts with `slingshot_pickup` → `backyard_target` (first_shots)
3. Girl starts with `multitool_pickup` → `carve_station` (carve_token)
4. WakeRadiusSystem manages interactable enable/disable
5. TaskSystem advances through steps on interaction completion
6. Completing final task unlocks Woodline area

### Gate Transition Flow
```
Player → Gate → interact()
  └─> emit game/areaRequest { areaId: 'woodline' }
       └─> GameApp.onAreaRequest()
            ├─> Check saveFacade.getUnlockedAreas(roleId)
            ├─> IF unlocked:
            │    └─> sessionFacade.setArea('woodline')
            │         └─> GameHost remounts with new areaId
            │              └─> GameApp loads BootWorld (fallback)
            └─> IF locked:
                 └─> emit ui/toast { message: 'Keep exploring...' }
```

---

## Testing Steps

### Boy Role - Backyard Tasks
1. **Start New Game**:
   - Title → Profiles → Select Boy → New Game
   - Should load BackyardWorld (morning lighting, white fence, house)
   - Player spawns center-front, companion nearby

2. **Slingshot Pickup**:
   - Walk to brown hovering box (left side, front)
   - Should show interaction prompt
   - Interact → gains `slingshot` + `steel_balls`
   - Box disappears after pickup

3. **Backyard Target**:
   - Walk to red cylinder (left side, back)
   - Should show interaction prompt
   - Interact → completes `first_shots` task
   - Confetti + success sound
   - Woodline area unlocked

4. **Gate Transition**:
   - Walk to wooden gate (back-middle)
   - Interact → transitions to Woodline
   - Should load BootWorld (temporary fallback)

### Girl Role - Backyard Tasks
1. **Start New Game**:
   - Title → Profiles → Select Girl → New Game
   - Should load BackyardWorld with pink player capsule

2. **Multitool Pickup**:
   - Walk to gray hovering box (right side, front)
   - Interact → gains `multitool` + `string`
   - Box disappears

3. **Carve Station**:
   - Walk to wood workbench (right side, back)
   - Interact → completes `carve_token` task
   - Woodline unlocked

4. **Gate Transition**:
   - Interact with gate → transitions to Woodline

### Gate Blocking (Pre-Completion)
1. **Before Completing Tasks**:
   - Walk to gate immediately after spawn
   - Interact → should see console log: "Area locked, showing toast"
   - No crash or transition
   - Can continue playing in Backyard

---

## Known Limitations

1. **No UI Toast Display**: `ui/toast` event emitted but no visual UI component yet
   - Toast messages only logged to console
   - Add toast component in Phase v0.7.0

2. **Greybox Aesthetics**: All interactables are primitive shapes
   - Boy.glb + Dog.glb models exist
   - Girl.glb still missing (pink placeholder)
   - Replace primitives with 3D models in future phase

3. **Woodline Uses BootWorld**: Gate transitions to temporary fallback
   - Phase v0.6.1 will build real WoodlineWorld
   - Campfire checkpoint with role-specific fire methods

4. **No Audio Zones**: Backyard uses forest ambient (from BootWorld)
   - Add BackyardAmbient track in polish phase

---

## Key Decisions

### 1. **Greybox First, Models Later**
- Primitives with color coding provide instant visual feedback
- Allows testing task flow without waiting for 3D assets
- Easy to replace with real models via manifest updates

### 2. **sessionFacade Non-React Bridge**
- Game code (GameApp) can't use React hooks
- Facade wraps Zustand store's `getState()` method
- Clean separation of concerns

### 3. **GameHost Remount on Session Change**
- Simplest approach for area transitions
- Full disposal + re-initialization ensures clean state
- No partial world swapping complexity

### 4. **Soft Block for Locked Areas**
- No hard boundaries (frustrating for toddlers)
- Gate always interactable, just shows friendly message
- Encourages exploration rather than punishing curiosity

### 5. **devBootFallback Toggle by Area**
- Backyard disables fallback (real tasks)
- Other areas keep fallback until built
- Flexible for incremental development

---

## What's Next

### Phase v0.6.1 — Woodline World + Campfire Checkpoint

**Goal**: Build Woodline greybox world with campfire ritual

**Tasks**:
1. Create `WoodlineWorld.ts` in `src/game/worlds/woodline/`
2. Darker forest lighting (evening/dusk)
3. Place interactables:
   - `flint_pickup` (boy task)
   - `fieldguide_pickup` (girl task)
   - `bowdrill_station` (girl task)
   - `campfire` (boy task - final checkpoint)
4. Remove BootWorld fallback from GameApp
5. Campfire completion triggers celebration + end of demo

**Stretch Goals**:
- Add ambient audio zones (Backyard birds, Woodline crickets)
- Replace interactable primitives with simple models
- Gate animation (swings open on unlock)

---

## Acceptance Criteria

✅ `npm run verify` passes (0 errors, 169 pre-existing warnings)  
✅ BackyardWorld loads when `areaId='backyard'`  
✅ Backyard tasks complete for both roles using real interactables  
✅ Gate emits area request event  
✅ Gate only transitions to Woodline when unlocked  
✅ No crashes on blocked transition (soft block works)  
✅ GameHost remounts GameApp on area change  
✅ ProgressionSystem starts correct tasks (no campfire_v1 fallback)  
✅ Summary doc created  

---

## Summary

Phase v0.6.0 successfully transforms the game from single-world prototype to multi-area progression system. Backyard provides a safe, bounded play space with clear visual boundaries and role-specific learning paths. The gate mechanism elegantly enforces progression while maintaining toddler-friendly exploration. 

All core systems (world loading, task wiring, area transitions) now work end-to-end with real interactables. Next phase will complete the two-area demo by building Woodline and removing temporary BootWorld fallbacks.
