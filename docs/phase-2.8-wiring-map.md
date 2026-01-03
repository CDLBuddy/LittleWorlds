# Phase 2.8 — Wiring Map (Authoritative)

**Purpose:** Single source of truth for "who wires what" in the dual-role character system.

**Last updated:** Phase 2.8 implementation

---

## System Creation Order (Boot Sequence)

### 1. Entry Point
- **File:** `src/main.tsx`
- **Action:** Renders React app with router

### 2. React Router → GameHost
- **File:** `src/game/GameHost.tsx`
- **Action:** Reads session state (roleId, areaId), creates canvas, instantiates GameApp

### 3. GameApp Constructor
- **File:** `src/game/GameApp.ts` (line 64)
- **Order:**
  1. Store `startParams: { roleId, areaId, fromArea? }`
  2. Create Babylon `Engine` + `Scene`
  3. Subscribe to `eventBus` for UI events
- **State:** No systems exist yet; just engine + event listener

### 4. GameApp.start() — System Creation Sequence
**Location:** `GameApp.ts` lines ~240-440

#### Phase A: World Loading
1. **AudioSystem** (line ~245)
2. **World creation** (line ~250-310)
   - Lazy-loads area-specific world (BackyardWorld, WoodlineWorld, etc.)
   - Returns: `WorldResult` with boyPlayer, girlPlayer, companion, interactables
   - World internally calls `world.setActiveRole(startParams.roleId)` to set initial active player
3. **CameraRig** (line ~320)
4. **FxSystem** (line ~325)

#### Phase B: Core Game Systems
5. **PlayerController** (line ~330)
   - Controls active player mesh
   - `setPlayerEntity()` called immediately with active player
6. **TaskSystem** (line ~335)
   - Constructed with `eventBus`
   - Loads saved inventory for `startRole` (determined from startParams or lastSelectedRole)
   - Calls `taskSystem.switchCharacter(startRole, savedInventory)`
7. **Emit `game/appReady`** (line ~339)
   - Signals UI that TaskSystem is ready with correct role

#### Phase C: Coordination Systems
8. **CharacterSwitchSystem** (line ~343)
   - Constructed with `(eventBus, taskSystem)`
   - Wired with `setPlayers(boyPlayer, girlPlayer)` (line ~349)
   - Wired with `setWorld(world)` (line ~350)
9. **InteractionSystem** (line ~355)
   - Constructed with `(taskSystem, eventBus)`
   - Interactables registered via `registerInteractable()`
10. **ProgressionSystem** (line ~380)
    - Constructed with `(taskSystem, startRole, areaId, options)`
    - Called `start()` to load first task
    - Wired to CharacterSwitchSystem via `setProgressionSystem()` (line ~405)
11. **AutosaveSystem** (line ~413)
    - Constructed with `(eventBus, taskSystem, startRole, areaId)`
    - Called `start()` to begin interval + event subscriptions
    - Wired to CharacterSwitchSystem via `setAutosaveSystem()` (line ~424)
12. **WakeRadiusSystem** (line ~427)
    - Constructed with `(scene, eventBus)`
    - Wired with `setTaskSystem(taskSystem)`

#### Phase D: DEV Tools (DEV only)
13. DebugOverlay, CompanionDebugHelper, PlayerDebugHelper, WorldEditor, SwitchDebugOverlay, CheatSystem

---

## Dependency Injection Graph

```
GameApp (orchestrator)
├─ eventBus (singleton from shared/events.ts)
├─ scene/engine (Babylon)
├─ world: WorldResult
│  └─ boyPlayer, girlPlayer (Player entities)
├─ taskSystem: TaskSystem(eventBus)
├─ characterSwitchSystem: CharacterSwitchSystem(eventBus, taskSystem)
│  ├─ setPlayers(boyPlayer, girlPlayer)
│  ├─ setWorld(world)
│  ├─ setProgressionSystem(progressionSystem)
│  ├─ setInteractionSystem(interactionSystem)
│  └─ setAutosaveSystem(autosaveSystem)
├─ progressionSystem: ProgressionSystem(taskSystem, roleId, areaId)
├─ interactionSystem: InteractionSystem(taskSystem, eventBus)
└─ autosaveSystem: AutosaveSystem(eventBus, taskSystem, roleId, areaId)
```

### Reference Flow
- **TaskSystem** is the "source of truth" for current inventory + role
- **CharacterSwitchSystem** orchestrates switches by:
  1. Saving current inventory via `saveFacade.syncInventory(currentRole, ...)`
  2. Loading new inventory via `saveFacade.getInventory(newRole)`
  3. Calling `taskSystem.switchCharacter(newRole, newInventory)`
  4. Updating `world.setActiveRole(newRole)` (triggers visual swap)
  5. Calling `progressionSystem.switchRole(newRole)` (reloads tasks)
  6. Calling `interactionSystem.clearDwell()` (clears interaction state)
  7. Calling `autosaveSystem.setRole(newRole)` (prevents stale role save)

---

## Role Source-of-Truth List

| System | Role Storage | Purpose | Updated On Switch? |
|--------|--------------|---------|-------------------|
| **TaskSystem** | `private currentRole` | Current active character for inventory/tasks | ✅ via `switchCharacter()` |
| **World** | Active player flag | Visual model + collision | ✅ via `setActiveRole()` |
| **ProgressionSystem** | `private roleId` | Task list for current role | ✅ via `switchRole()` |
| **AutosaveSystem** | `private roleId` | Prevents saving to wrong role | ✅ via `setRole()` |
| **PlayerController** | Reference to active `Player` entity | Input control target | ✅ via `setPlayerEntity()` |
| **saveFacade** | `lastSelectedRole` (metadata) | Resume on next boot | ✅ via `setLastSelectedRole()` |

### Critical Invariant
**At all times after switch:**
- `TaskSystem.currentRole === ProgressionSystem.roleId === AutosaveSystem.roleId === World.activeRole === PlayerController.playerEntity.roleId === saveFacade.lastSelectedRole`

**Violation = desync bug**

---

## Save Writers and Call Sites

### 1. `saveFacade.syncInventory(roleId, items[])`
**Purpose:** Write inventory to save file for specific role

**Call sites:**
- `CharacterSwitchSystem.switchTo()` (line 113)
  - **When:** Before loading new role
  - **RoleId source:** `taskSystem.getCurrentRole()` (OLD role)
- `AutosaveSystem.performSave()` (line 91)
  - **When:** Interval / task complete / pause
  - **RoleId source:** `this.roleId` (constructor + `setRole()`)
- `GameApp.onAreaRequest()` (line 209)
  - **When:** Gate interaction for area transition
  - **RoleId source:** `taskSystem.getCurrentRole()`

### 2. `saveFacade.syncLastArea(roleId, areaId)`
**Purpose:** Update last visited area for role (for resume)

**Call sites:**
- `AutosaveSystem.performSave()` (line 92)
  - **When:** Interval / task complete / pause
  - **RoleId source:** `this.roleId`

### 3. `saveFacade.markTaskComplete(roleId, taskId)`
**Purpose:** Append taskId to `completedTasks[]` for role

**Call sites:**
- `ProgressionSystem.handleTaskEvent()` (line 83)
  - **When:** Task marked complete
  - **RoleId source:** `this.roleId` (constructor + `switchRole()`)

### 4. `saveFacade.setLastSelectedRole(roleId)`
**Purpose:** Update global "last selected role" (for session resume)

**Call sites:**
- `CharacterSwitchSystem.switchTo()` (line 123)
  - **When:** After successful switch
  - **RoleId source:** `roleId` parameter (NEW role)

### 5. `saveFacade.markAreaComplete(roleId, areaId, nextAreaId?)`
**Purpose:** Mark area complete + unlock next

**Call sites:**
- `ProgressionSystem.completeArea()` (line 109)
  - **When:** All tasks in area complete
  - **RoleId source:** `this.roleId`

### 6. `saveFacade.setInventory(roleId, items[])`
**Purpose:** Direct inventory write (used in ProgressionSystem for area completion)

**Call sites:**
- `ProgressionSystem.completeArea()` (line 112)
  - **When:** Area complete, before unlocking next
  - **RoleId source:** `this.roleId`
- `GameApp.onAreaRequest()` (line 209)
  - **When:** Gate transition
  - **RoleId source:** `taskSystem.getCurrentRole()`

---

## Event Flow Diagram

### Character Switch Sequence
```
1. UI: user clicks switch button
   ↓
2. InventoryPanel: eventBus.emit({ type: 'ui/switchCharacter', roleId: 'girl' })
   ↓
3. CharacterSwitchSystem: receives event via eventBus subscription
   ↓
4. CharacterSwitchSystem.switchTo('girl'):
   a. Get currentRole from TaskSystem ('boy')
   b. saveFacade.syncInventory('boy', currentInventory)  [WRITE 1]
   c. Load: newInventory = saveFacade.getInventory('girl')
   d. taskSystem.switchCharacter('girl', newInventory)
   e. saveFacade.setLastSelectedRole('girl')             [WRITE 2]
   f. world.setActiveRole('girl')                        [Visual swap]
   g. progressionSystem.switchRole('girl')               [Task reload]
   h. interactionSystem.clearDwell()
   i. autosaveSystem.setRole('girl')                     [Prevent stale save]
   ↓
5. TaskSystem: broadcasts game/inventoryUpdate with new role + inventory
   ↓
6. UI: InventoryPanel re-renders with new items
```

### Task Completion Sequence
```
1. InteractionSystem: detects dwell complete on targetId
   ↓
2. TaskSystem: completeCurrentStep()
   ↓
3. TaskSystem: emits { type: 'game/task', taskId, complete: true }
   ↓
4. GameApp: receives task complete event
   ↓
5. GameApp: calls progressionSystem.handleTaskEvent(taskId, true)
   ↓
6. ProgressionSystem: saveFacade.markTaskComplete(this.roleId, taskId) [WRITE]
   ↓
7. ProgressionSystem: advances to next task OR completes area
   ↓
8. AutosaveSystem: receives 'game/task' event, triggers debounced save
   ↓
9. AutosaveSystem: saveFacade.syncInventory(this.roleId, inventory)    [WRITE]
```

---

## Risk Analysis

### High-Risk Patterns (Fixed in Phase 2.7)
1. ❌ **Cached role in system constructor** (AutosaveSystem)
   - **Problem:** `this.roleId` set once, never updated → writes to stale role
   - **Fix:** Added `setRole()` method, called by CharacterSwitchSystem (step 6.6)

### Remaining Risk Areas (Phase 2.8 will monitor)
1. **Debounced saves** (AutosaveSystem)
   - 500ms debounce could fire after switch if timed poorly
   - Mitigated by `setRole()` call BEFORE emitting `game/characterSwitch`
2. **Area transition saves** (GameApp.onAreaRequest)
   - Uses `taskSystem.getCurrentRole()` — correct IF TaskSystem updated first
   - Should be safe due to CharacterSwitchSystem orchestration order
3. **Task completion timing**
   - ProgressionSystem writes with `this.roleId`
   - Updated in `switchRole()` BEFORE loading new task
   - Race window: very small, but trace harness will detect

---

## Summary for Next Phase

**Phase 2.8 trace harness should monitor:**
1. Every `saveFacade.syncInventory()` / `markTaskComplete()` call
   - Log: `roleId`, `callStack`, `timestamp`, `switchSeq` (if mid-switch)
2. Every `CharacterSwitchSystem.switchTo()` transaction
   - Assign correlation ID (`switchSeq`)
   - Log each step with ID for tracing
3. Every `eventBus.emit()` event
   - Type + shallow payload summary
4. **Invariant snapshot** before/after every save write
   - Capture: TaskSystem.role, World.role, ProgressionSystem.role, AutosaveSystem.role, inventory length, current task
   - Detect: "save wrote to boy while snapshot says girl"

**This gives us:**
- Exact timestamp of corruption
- Stack trace to source
- Correlation ID to link switch steps
- Invariant diff to prove desync

**Next:** Build trace harness (TraceBuffer, taps, window.__traceDump()).
