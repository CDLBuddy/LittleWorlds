# Phase v0.5.1 — Dual-Role Save + Area Unlocks + Session Start

**Date:** 2025-12-27  
**Status:** ✅ Complete

---

## Goal

Implement a robust save and progression system supporting:
- Two playable roles (boy/girl) with independent progression
- Area-gated unlocks (Backyard unlocks first; Woodline after Backyard completion)
- Session start flow with role + area selection
- DEV-friendly BootWorld fallback for testing before real worlds are built

---

## Files Created

- [src/game/session/useGameSession.ts](../src/game/session/useGameSession.ts) — Zustand store for current session params (roleId, areaId, slotId)
- [src/game/systems/saves/saveFacade.ts](../src/game/systems/saves/saveFacade.ts) — High-level save API wrapper
- [src/game/systems/progression/ProgressionSystem.ts](../src/game/systems/progression/ProgressionSystem.ts) — Area → tasks → unlock next system

---

## Files Modified

### Save System (v2 Upgrade)
- [src/game/systems/saves/SaveSystem.ts](../src/game/systems/saves/SaveSystem.ts)
  - Added SaveDataV2 types: `RoleProgress`, dual-role `SaveData`
  - Removed old single-player-position schema
  - Added `createDefaultRoleProgress()` and `createDefaultSave()`
  - Implemented `loadOrCreate()` and `write()` methods
  - Auto-migration on load with re-save

- [src/game/systems/saves/migrations.ts](../src/game/systems/saves/migrations.ts)
  - Added migration v1 → v2
  - Converts old single-inventory save to dual-role structure
  - Both roles get default backyard unlock on first migration

### Game Systems
- [src/game/GameApp.ts](../src/game/GameApp.ts)
  - Added `startParams: { roleId, areaId }` to constructor
  - Created `ProgressionSystem` instead of directly calling `taskSystem.startTask(campfire_v1)`
  - Task complete event now notifies `ProgressionSystem.handleTaskEvent()`
  - Removed hardcoded `campfire_v1` import (unused)

- [src/game/GameHost.tsx](../src/game/GameHost.tsx)
  - Reads session params from `useGameSession`
  - Fallback: uses `saveFacade.loadMain().lastSelectedRole` if session empty
  - Passes `{ roleId, areaId }` to GameApp constructor

### UI Screens
- [src/ui/screens/TitleScreen.tsx](../src/ui/screens/TitleScreen.tsx)
  - Changed Play button to navigate to `/profiles` instead of `/game`

- [src/ui/screens/ProfileSelect.tsx](../src/ui/screens/ProfileSelect.tsx)
  - Complete rewrite for role + area selection
  - Character selection: Boy / Girl buttons
  - New Game: resets selected role, starts at Backyard
  - Continue: shows unlocked areas for selected role (from saveFacade)
  - Integrates with `useGameSession` and `saveFacade`

### Player System
- [src/game/entities/player/Player.ts](../src/game/entities/player/Player.ts)
  - Added `roleId` parameter to constructor
  - Role-based placeholder colors (Boy = blue, Girl = pink)
  - Dynamic model loading based on role ('boy' → Boy.glb, 'girl' → Girl.glb)
  - Graceful fallback: keeps colored placeholder if model file missing

- [src/game/worlds/BootWorld.ts](../src/game/worlds/BootWorld.ts)
  - Added `roleId` parameter to `createBootWorld()`
  - Passes roleId to Player constructor

- [src/game/assets/manifest.ts](../src/game/assets/manifest.ts)
  - Added `'girl': 'assets/models/Girl.glb'` entry (TODO: create model file)

---

## SaveData v2 Schema

```typescript
interface RoleProgress {
  unlockedAreas: string[];      // AreaId[]
  completedAreas: string[];     // AreaId[]
  completedTasks: string[];     // task ids
  inventory: string[];          // persistent per role
  lastAreaId: string;           // AreaId
}

interface SaveData {
  version: 2;
  timestamp: number;
  slotId: string;
  roles: {
    boy: RoleProgress;
    girl: RoleProgress;
  };
  lastSelectedRole: 'boy' | 'girl' | null;
}
```

### Default RoleProgress
- `unlockedAreas: ['backyard']`
- `completedAreas: []`
- `completedTasks: []`
- `inventory: []`
- `lastAreaId: 'backyard'`

---

## ProgressionSystem Behavior

### Normal Mode
1. Reads area definition from `AREAS[areaId]`
2. Gets task list for role: `area.tasksByRole[roleId]`
3. Starts first task via `TaskSystem.startTask()`
4. On task complete:
   - Marks task complete in save
   - Advances to next task
5. When all tasks done:
   - Marks area complete
   - Unlocks next area (if defined in `AREAS[areaId].next`)
   - Saves inventory state

### BootWorld DEV Fallback
**Enabled via:** `{ devBootFallback: true }` + `areaId === 'backyard'`

**Why:** Backyard/Woodline 3D worlds don't exist yet, but we need to test progression.

**Behavior:**
1. Uses `campfire_v1` task instead of Backyard tasks
2. On campfire completion:
   - Treats as "Backyard complete"
   - Unlocks Woodline for the selected role
   - Saves progress normally
3. Works with existing BootWorld (forest scene remains)

**Documented as temporary:** Will be removed when real Backyard world is built.

---

## UI Flow

### Title Screen
- Play button → `/profiles`

### /profiles (Profile Select)
1. **Choose Character:** Boy / Girl buttons
   - Sets `useGameSession.roleId`
   - Calls `saveFacade.setLastSelectedRole()`
2. **New Game:** (requires character selected)
   - Resets that role's progress to defaults
   - Sets area to `'backyard'`
   - Navigates to `/game`
3. **Continue:** (requires character selected)
   - Shows unlocked areas from `saveFacade.getUnlockedAreas(roleId)`
   - Click area → sets session area → navigates to `/game`
4. **Back:** Returns to `/`

### /game (GameHost)
- Reads `roleId` and `areaId` from session
- Passes to GameApp → ProgressionSystem
- Game runs normally; task completion updates save

---

## Testing Steps

### Manual Test (BootWorld Fallback)
1. `npm run dev`
2. Title → Play → /profiles
3. Choose **Boy**
4. Click **Start New (boy)**
5. Game loads → **blue capsule player** appears → complete campfire_v1 (pick axe, chop log, light fire)
6. **Expected:** Console logs "Backyard complete", save updates
7. Exit to Title → Play → /profiles → Choose **Boy**
8. **Expected:** Continue section now shows **Woodline** button
9. Click **Woodline** → game loads (still BootWorld for now, that's OK)
10. Choose **Girl** → **Expected:** Only Backyard unlocked (independent progress)

### Visual Role Differentiation Test
1. Start game as **Boy** → player appears as **blue capsule** (or Boy.glb if loaded)
2. Exit and start as **Girl** → player appears as **pink capsule** (or Girl.glb if model exists)
3. Console logs: `[Player] No model found for role 'girl', keeping placeholder` (until Girl.glb is created)

### Save Migration Test
1. If you have an old v1 save:
   - Load game → console logs "Migrated save from v1 to v2"
   - Save re-written with dual-role structure
2. Fresh install:
   - Default save created with both roles at Backyard

---

## Key Decisions

### 1. Dual-Role, Single-Slot Model
**Why:** Simplified saves for a kid-friendly game. Both boy/girl share a "family save" but track separate progression. Alternative (multi-slot) was overkill for this use case.

### 2. BootWorld DEV Fallback
**Why:** Building a complete progression system before worlds exist enables parallel work. Art/world-building can proceed while save/task logic is validated. Fallback is clearly marked and will be removed.

### 3. Session Store Separate from Save
**Why:** Session (current run params) is ephemeral; save (long-term progress) is persistent. Zustand for session avoids prop-drilling; saveFacade for persistence keeps localStorage logic centralized.

### 4. ProgressionSystem Owns Task Sequencing
**Why:** Previously, GameApp directly started tasks. ProgressionSystem centralizes:
- Task sequencing
- Area completion logic
- Save updates
- Next-area unlocking

This makes adding new areas data-driven (edit `areas.ts` and `tasks.ts` only).

### 5. Role-Based Visual Differentiation
**Why:** Players need immediate visual feedback that their character selection matters. Color-coded placeholders (blue/pink) provide instant confirmation while proper 3D models load. This is especially important for toddlers who rely on visual cues.

**Implementation:** Player constructor accepts roleId, applies role-specific colors to placeholder capsule, and attempts to load role-specific .glb model. If model missing, placeholder remains visible (fail-safe design).

---

## What's Next (Phase v0.6.0+)

### Immediate TODO
- **Create Girl.glb model:** Add 3D model file to `public/assets/models/Girl.glb` to replace pink placeholder

### Phase v0.6.0: Build Real Worlds
1. **Backyard World**
   - 3D scene for Backyard area
   - Place interactables matching task `targetId`s:
     - boy: slingshot_pickup, backyard_target
     - girl: multitool_pickup, carve_station
   - Remove BootWorld fallback flag

2. **Woodline World**
   - 3D scene for Woodline
   - Place interactables:
     - boy: flint_pickup, campfire
     - girl: fieldguide_pickup, bowdrill_station

### Phase v0.7.0: Polish + QoL
- Inventory UI display
- Area names in HUD
- Task progress indicators
- Celebration animations on area unlock
- Sound effects for role selection

---

## Acceptance Criteria

- ✅ `npm run verify` passes (0 errors, 155 pre-existing warnings)
- ✅ /profiles allows role + area selection
- ✅ Completing campfire_v1 (BootWorld fallback) unlocks Woodline for that role
- ✅ Save persists after reload
- ✅ Boy/girl have independent progression
- ✅ Selecting Woodline loads game (world still BootWorld; expected)
- ✅ Summary doc created

---

## Technical Notes

### File Organization
```
src/game/
  session/
    useGameSession.ts     (NEW)
  systems/
    saves/
      SaveSystem.ts       (UPGRADED to v2)
      migrations.ts       (ADDED v2 migration)
      saveFacade.ts       (NEW)
    progression/
      ProgressionSystem.ts (NEW)
    tasks/
      TaskSystem.ts       (unchanged, used by ProgressionSystem)
```

### Migration Safety
- v1 → v2 migration tested with old saves
- Both roles get default progress on migration
- Version check + auto-re-save ensures normalized storage
- No data loss; old inventory copied to both roles (safe default)

### BootWorld Fallback (Temporary)
**Location:** [src/game/systems/progression/ProgressionSystem.ts#L28-L33](../src/game/systems/progression/ProgressionSystem.ts)

**Condition:** `devBootFallback === true && areaId === 'backyard'`

**Remove when:** Backyard world is built and tasks are wired to real interactables.

---

## Known Limitations
5. **Girl.glb model missing:** Girl role uses pink placeholder capsule until 3D model is created/added to `public/assets/models/Girl.glb`. System handles this gracefully with fallback.

1. **Woodline loads BootWorld:** Expected. No real Woodline world yet.
2. **No inventory UI:** Inventory persists but isn't displayed. Phase v0.7.0.
3. **No area unlock celebration:** Task complete has confetti; area unlock is silent. Future polish.
4. **Single-slot only:** Multi-slot/multi-child support deferred (not in scope for toddler audience).

---

## Migration from v0.5.0 → v0.5.1

If you completed Phase v0.5.0, all previous work is preserved:
- ✅ Areas registry (areas.ts) — used by ProgressionSystem
- ✅ Tasks with requiresItems/grantsItems — used by TaskSystem
- ✅ Items registry (items.ts) — ready for inventory UI
- ✅ PromptIcons expanded — ready for new tasks

This phase adds **the runtime** that makes all that data come alive.
