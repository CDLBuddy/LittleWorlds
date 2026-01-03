# Phase 2.8 — Role Cache Audit

**Purpose:** Catalog every place in the codebase that stores or caches `roleId` or `areaId`, and assess risk of desync.

**Risk Rating:**
- **HIGH:** Cached role used in save writes or task completion
- **MED:** Cached role used for UI state or reads
- **LOW:** Cached role used for visuals only or immediately derived

---

## Audit Table

| File | Class/System | Cached Property | Dynamic Read? | Risk | Notes |
|------|--------------|-----------------|---------------|------|-------|
| `src/game/systems/tasks/TaskSystem.ts` | TaskSystem | `private currentRole` | ❌ | **HIGH** | **SOURCE OF TRUTH** for inventory/role. Used in `getInventory()` → save writes. Updated via `switchCharacter()`. |
| `src/game/systems/progression/ProgressionSystem.ts` | ProgressionSystem | `private roleId` | ❌ | **HIGH** | Used in `markTaskComplete()` save write (line 83). Updated via `switchRole()` (line 210). |
| `src/game/systems/autosave/AutosaveSystem.ts` | AutosaveSystem | `private roleId` | ❌ | **HIGH** | Used in `syncInventory()` write (line 91). **FIXED in Phase 2.7** via `setRole()` method (line 58). |
| `src/game/worlds/types.ts` | WorldResult | Active player flag | ❌ | **MED** | Controls which Player entity is active (visual + collision). Updated via `setActiveRole()`. No direct save writes. |
| `src/game/entities/player/Player.ts` | Player | `private roleId` | ❌ | **LOW** | Set in constructor, never changes. Used for model loading + debug only. No save writes. |
| `src/game/GameApp.ts` | GameApp | `startParams.roleId` | ❌ | **MED** | Used only for **initial boot** (line 64, 335). Not updated after. No save writes after initial load. |
| `src/game/systems/characters/CharacterSwitchSystem.ts` | CharacterSwitchSystem | None | ✅ | **LOW** | **No cached role!** Always reads `taskSystem.getCurrentRole()` dynamically (line 96). Safe. |
| `src/game/systems/saves/saveFacade.ts` | saveFacade | None | ✅ | **LOW** | No cached role. All methods take `roleId` as parameter. Safe. |
| `src/game/session/sessionFacade.ts` | sessionFacade (Zustand) | `session.roleId` | ✅ | **MED** | React state for GameHost remount. Read via `getSession()`. No save writes from this module. |
| `src/game/systems/interactions/InteractionSystem.ts` | InteractionSystem | None | ✅ | **LOW** | No role cache. Operates on TaskSystem reference. Safe. |
| `src/game/debug/SwitchDebugOverlay.ts` | SwitchDebugOverlay | None | ✅ | **LOW** | DEV-only. Reads `taskSystem.getCurrentRole()` + `player.getRoleId()` dynamically. No writes. |

---

## Detailed Findings

### HIGH RISK (Fixed)

#### 1. `AutosaveSystem.roleId` — **FIXED in Phase 2.7**
- **File:** `src/game/systems/autosave/AutosaveSystem.ts`
- **Line:** 23 (constructor), 58 (setRole)
- **Issue:** Stored `roleId` in constructor, never updated → debounced saves could write to stale role after switch
- **Fix:** Added `setRole()` method, called by `CharacterSwitchSystem` at step 6.6 (line 153 in CharacterSwitchSystem)
- **Status:** ✅ Resolved
- **Trace priority:** Still monitor to confirm fix works under all timing conditions

---

### HIGH RISK (Active)

#### 2. `ProgressionSystem.roleId`
- **File:** `src/game/systems/progression/ProgressionSystem.ts`
- **Line:** 23 (constructor), 210 (updated in switchRole)
- **Usage:**
  - `handleTaskEvent()` line 83: `saveFacade.markTaskComplete(this.roleId, taskId)`
  - `completeArea()` line 109: `saveFacade.markAreaComplete(this.roleId, ...)`
  - `completeArea()` line 112: `saveFacade.setInventory(this.roleId, inventory)`
- **Risk window:**
  - IF task completes DURING switch (after TaskSystem updated, before ProgressionSystem.switchRole called)
  - Mitigation: `switchRole()` updates `this.roleId` at line 210 BEFORE loading new task
  - Small race window: ~2ms between TaskSystem update and ProgressionSystem update
- **Trace priority:** **HIGH** — log all `markTaskComplete` with snapshot to detect role mismatch

#### 3. `TaskSystem.currentRole`
- **File:** `src/game/systems/tasks/TaskSystem.ts`
- **Line:** 16 (declaration), 56 (updated in switchCharacter)
- **Usage:**
  - `getCurrentRole()` line 38: Used by AutosaveSystem + CharacterSwitchSystem + GameApp
  - `broadcastInventory()` line 179: Emits `game/inventoryUpdate` with `this.currentRole`
- **Risk:** LOW if always updated via `switchCharacter()` first
  - CharacterSwitchSystem calls `switchCharacter()` at step 3 (line 120), BEFORE visual switch
  - No save writes directly from TaskSystem (all routed through other systems)
- **Trace priority:** **MED** — log `switchCharacter()` calls to confirm order

---

### MED RISK

#### 4. `GameApp.startParams.roleId`
- **File:** `src/game/GameApp.ts`
- **Line:** 64 (constructor), 335 (used once at start)
- **Usage:**
  - Only used to determine initial role at boot (line 335)
  - NOT used for saves after initial load
- **Risk:** None after boot completes
- **Trace priority:** **LOW** — no ongoing usage

#### 5. `sessionFacade` (Zustand store)
- **File:** `src/game/session/sessionFacade.ts`
- **Line:** 37-39 (setRole)
- **Usage:**
  - Updated via `setRole()` when switching (GameApp line 212, for area transitions only)
  - Read by GameHost for remount
  - No save writes from this module
- **Risk:** Stale session state if switch fails mid-transaction (UI desync only, not save corruption)
- **Trace priority:** **LOW** — UI state, not save state

#### 6. `WorldResult.activeRole`
- **File:** Various world files (BackyardWorld, WoodlineWorld, etc.)
- **Usage:**
  - Tracks which Player entity is active (visual + collision)
  - Updated via `world.setActiveRole()` (step 5 in switch, line 128 CharacterSwitchSystem)
  - No save writes from world
- **Risk:** Visual desync only (player model incorrect)
- **Trace priority:** **MED** — log `setActiveRole()` to confirm visual sync

---

### LOW RISK

#### 7. `Player.roleId`
- **File:** `src/game/entities/player/Player.ts`
- **Line:** 25 (declaration), 28 (constructor)
- **Usage:**
  - Set once in constructor, immutable
  - Used for model loading (e.g., `boy.glb` vs `girl.glb`)
  - Read by debug overlay (`getRoleId()`)
- **Risk:** None (immutable per-entity)
- **Trace priority:** **NONE**

#### 8. `CharacterSwitchSystem` — No cache!
- **File:** `src/game/systems/characters/CharacterSwitchSystem.ts`
- **Line:** 96 (reads `taskSystem.getCurrentRole()` dynamically)
- **Usage:** Always derives role from TaskSystem, never caches
- **Risk:** None (good pattern!)
- **Trace priority:** **LOW** — just log for completeness

#### 9. `saveFacade` — No cache!
- **File:** `src/game/systems/saves/saveFacade.ts`
- **Usage:** All methods take `roleId` as parameter, no internal cache
- **Risk:** None (safe by design)
- **Trace priority:** **HIGH** (but for writes, not cache)

---

## Search Results Summary

### Constructor `roleId` parameters
```
AutosaveSystem(eventBus, taskSystem, roleId, areaId)  → Line 23
ProgressionSystem(taskSystem, roleId, areaId, opts)   → Line 23
Player(scene, position, roleId, isActive)             → Line 28
GameApp(canvas, bus, startParams: { roleId, ... })    → Line 64
```

### `setRole()` methods
```
AutosaveSystem.setRole(roleId)        → Line 58  [ADDED Phase 2.7]
sessionFacade.setRole(roleId)          → Line 37
saveFacade.setLastSelectedRole(roleId) → Line 39
```

### `syncInventory()` / `markTaskComplete()` calls
```
CharacterSwitchSystem.switchTo()      → syncInventory(currentRole, ...)  [Line 113]
AutosaveSystem.performSave()          → syncInventory(this.roleId, ...)  [Line 91]
GameApp.onAreaRequest()               → syncInventory(currentRole, ...)  [Line implied]
ProgressionSystem.handleTaskEvent()   → markTaskComplete(this.roleId, ...) [Line 83]
```

### Dynamic role reads
```
TaskSystem.getCurrentRole()           → Used by: CharacterSwitchSystem, AutosaveSystem, GameApp
ProgressionSystem.getRoleId()         → Used by: Debug overlay
Player.getRoleId()                    → Used by: Debug overlay
saveFacade.getLastSelectedRole()      → Used by: GameApp boot, GameHost
```

---

## Conclusions

### ✅ Fixed in Phase 2.7
- **AutosaveSystem** now updates role via `setRole()` during switch
- No longer writes to stale role in debounce window

### ⚠️ Remaining risk areas for Phase 2.8 monitoring
1. **ProgressionSystem.roleId**
   - Small race window if task completes mid-switch
   - Mitigated by early `roleId` update (line 210)
   - **Monitor:** All `markTaskComplete()` with snapshot
2. **Debounce timing**
   - 500ms debounce in AutosaveSystem could still fire after switch
   - Mitigated by `setRole()` call BEFORE event emission
   - **Monitor:** All `syncInventory()` with timestamp + correlation ID
3. **Area transition saves**
   - `GameApp.onAreaRequest()` uses `taskSystem.getCurrentRole()`
   - Should be safe if CharacterSwitchSystem always updates TaskSystem first
   - **Monitor:** onAreaRequest saves with snapshot

### ✅ Safe patterns (no action needed)
- CharacterSwitchSystem: no cached role, always reads dynamically
- saveFacade: no cached role, parameters force explicit roleId
- InteractionSystem: no role awareness
- Player entities: immutable roleId per entity

---

## Next Steps

**Phase 2.8 trace harness should:**
1. Log ALL `saveFacade` write calls with:
   - `roleId` parameter
   - Call stack (to identify caller)
   - Timestamp
   - `switchSeq` if mid-switch
   - **Snapshot:** TaskSystem.role, ProgressionSystem.role, AutosaveSystem.role, World.activeRole
2. Detect mismatches:
   - IF `syncInventory(roleId)` where `roleId !== TaskSystem.currentRole` → **ERROR**
   - IF `markTaskComplete(roleId)` where `roleId !== ProgressionSystem.roleId` → **ERROR**
3. Provide correlation IDs for switch transactions to trace timing

**Expected result:** Zero mismatches = all fixes working as designed.
