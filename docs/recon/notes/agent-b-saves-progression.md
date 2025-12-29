# Agent B: Save Data, Progression, and Inventory Systems Audit

**Date:** December 28, 2025  
**Agent:** Agent B  
**Mission:** Forensic audit of save/load, progression tracking, and inventory persistence

---

## 1. SaveData Model

### v2 Schema (Current)

Location: [src/game/systems/saves/SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts#L18-L28)

```typescript
interface RoleProgress {
  unlockedAreas: string[];      // AreaId[]
  completedAreas: string[];     // AreaId[]
  completedTasks: string[];     // task ids
  inventory: string[];          // persistent per role (future-ready)
  lastAreaId: string;           // AreaId
}

interface SaveData {
  version: number;              // Currently 2
  timestamp: number;            // Last write timestamp
  slotId: string;               // Save slot identifier (default: 'main')
  roles: Record<'boy' | 'girl', RoleProgress>;
  lastSelectedRole: 'boy' | 'girl' | null;
}
```

### Key Design Decisions

1. **Dual-Role Architecture**: Each role (boy/girl) has independent progression tracking
2. **Version Control**: Built-in versioning system with migration support
3. **Area-Based Progression**: Areas unlock sequentially; completed areas tracked separately
4. **Per-Role Inventory**: Inventory is tracked per role (though currently not fully utilized)
5. **Session Persistence**: `lastSelectedRole` allows quick resume to last played character

### Default Values

From [SaveSystem.ts:L44-50](../../../src/game/systems/saves/SaveSystem.ts#L44-L50):

```typescript
createDefaultRoleProgress(): RoleProgress {
  return {
    unlockedAreas: ['backyard'],     // Always start with backyard unlocked
    completedAreas: [],
    completedTasks: [],
    inventory: [],
    lastAreaId: 'backyard',
  };
}
```

**Critical**: All new roles start with 'backyard' unlocked by default. This is the game's entry point.

---

## 2. Save/Load Flow

### 2.1 Storage Layer

#### StorageManager ([src/lib/storage.ts](../../../src/lib/storage.ts))

**Wrapper Pattern**: Provides versioned schema wrapper around raw localStorage.

```typescript
interface StorageSchema {
  version: number;
  data: any;  // ⚠️ Uses 'any' type
}
```

**Key Methods:**
- `set<T>(key, value)` → Wraps data with version metadata
- `get<T>(key, defaultValue?)` → Unwraps and validates version
- `has(key)` → Check existence
- `clear()` → Remove all prefixed keys

**Prefix**: `'littleworlds_'` by default  
**Version Handling**: Returns `defaultValue` if version mismatch detected

**⚠️ Gap**: StorageManager has its own versioning (currently v1) that's separate from SaveData versioning (currently v2). These two version systems are decoupled.

#### SaveSystem ([src/game/systems/saves/SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts))

**Direct localStorage Usage**: Does NOT use StorageManager wrapper. Directly accesses localStorage.

**Storage Key Pattern**: `'littleworlds_save_' + slotId`

**Load Path** (Line 70-91):
1. Read raw string from localStorage
2. Parse JSON (wrapped in try/catch)
3. Pass to `migrateSaveData(rawData, SAVE_VERSION)`
4. If migration occurred, immediately persist migrated data
5. Return migrated SaveData

**Write Path** (Line 111-125):
1. Update timestamp
2. Stringify SaveData
3. Write to localStorage (wrapped in try/catch)
4. Return success boolean

**Error Handling**:
- Load: Returns `null` on any error (corrupt data, parse failure, etc.)
- Write: Returns `false` on any error
- Both log errors to console but don't throw

**⚠️ Critical Gap**: If JSON.parse fails (corrupted save), the error is swallowed and `null` is returned. Caller must handle null gracefully.

### 2.2 Save Facade

Location: [src/game/systems/saves/saveFacade.ts](../../../src/game/systems/saves/saveFacade.ts)

**Purpose**: High-level API abstracting save operations. Singleton pattern.

**Key Methods:**

| Method | Purpose | File:Line |
|--------|---------|-----------|
| `loadMain()` | Load or create 'main' slot | [saveFacade.ts:L16](../../../src/game/systems/saves/saveFacade.ts#L16) |
| `writeMain(save)` | Write to 'main' slot | [saveFacade.ts:L23](../../../src/game/systems/saves/saveFacade.ts#L23) |
| `resetRole(roleId)` | Reset role to defaults | [saveFacade.ts:L30](../../../src/game/systems/saves/saveFacade.ts#L30) |
| `setLastSelectedRole(roleId)` | Update last played role | [saveFacade.ts:L40](../../../src/game/systems/saves/saveFacade.ts#L40) |
| `markAreaComplete(roleId, areaId, nextAreaId?)` | Complete area + unlock next | [saveFacade.ts:L62](../../../src/game/systems/saves/saveFacade.ts#L62) |
| `markTaskComplete(roleId, taskId)` | Add task to completedTasks | [saveFacade.ts:L84](../../../src/game/systems/saves/saveFacade.ts#L84) |
| `setInventory(roleId, inventory)` | Replace role's inventory | [saveFacade.ts:L98](../../../src/game/systems/saves/saveFacade.ts#L98) |
| `getInventory(roleId)` | Get role's inventory | [saveFacade.ts:L107](../../../src/game/systems/saves/saveFacade.ts#L107) |

**Transaction Pattern**: All methods follow read-modify-write:
1. Load save via `loadMain()`
2. Modify in-memory copy
3. Write back via `writeMain()`

**⚠️ Concurrency Risk**: No locking mechanism. Rapid successive calls could lead to lost updates if multiple systems write simultaneously.

### 2.3 Migration System

Location: [src/game/systems/saves/migrations.ts](../../../src/game/systems/saves/migrations.ts)

**Purpose**: Upgrade save data from older versions to current schema.

**Migration Registry**:

```typescript
export const migrations: Record<number, Migration> = {
  1: (data: any) => { /* v0 → v1: add worldId */ },
  2: (data: any) => { /* v1 → v2: dual-role conversion */ }
};
```

**Migration Logic** (Line 73-82):
- Sequential application: Applies all migrations from `currentVersion + 1` to `targetVersion`
- If save has no version field, assumes v0
- Migration functions use `any` types (4 instances) - necessary for schema evolution

**V1 → V2 Migration Details** ([migrations.ts:L23-69](../../../src/game/systems/saves/migrations.ts#L23-L69)):

If save already has `roles` structure:
- Keeps existing role data
- Fills in missing fields with defaults
- Ensures both boy and girl roles exist

If migrating from v1 (single-role format):
- Creates both roles with default progression
- Old `completedTasks` → copied to both roles
- Old `inventory` → copied to both roles

**⚠️ Data Loss Risk**: V1 → V2 migration duplicates progress to both roles. There's no way to know which role the old data belonged to.

---

## 3. Progression Logic

### 3.1 ProgressionSystem

Location: [src/game/systems/progression/ProgressionSystem.ts](../../../src/game/systems/progression/ProgressionSystem.ts)

**Purpose**: Orchestrates area → tasks → unlock flow. Created per game session.

**Constructor Dependencies**:
- `TaskSystem` - for loading and starting tasks
- `RoleId` - which character is playing
- `AreaId` - which area to load tasks from
- `devBootFallback` option - special mode for testing

**Initialization Flow** (Line 15-54):

1. Check for BootWorld fallback mode
   - If `devBootFallback=true` AND `areaId='backyard'`, use hardcoded `campfire_v1` task
   - This allows testing progression before real worlds are built

2. Load area definition from `AREAS[areaId]`
   - Fetch task IDs from `area.tasksByRole[roleId]`
   - Filter out missing tasks (dev safety)

3. Store validated task IDs for progression tracking

**⚠️ Gap**: If `AREAS[areaId]` is undefined, logs error but sets `taskIds = []`. Progression effectively breaks silently.

### 3.2 Task Progression Flow

**Start** (Line 58-65):
- Loads first task from `taskIds[0]`
- Calls `taskSystem.startTask(task)`
- Sets `currentTaskIndex = 0`

**Task Completion Handler** (Line 70-96):
- Triggered by `game/task` event with `complete: true`
- Marks task complete via `saveFacade.markTaskComplete(roleId, taskId)`
- Increments `currentTaskIndex`
- If more tasks remain, loads next task
- If all tasks done, calls `completeArea()`

**BootWorld Fallback** (Line 75-79):
- Special case: `campfire_v1` completion = Backyard complete
- Bypasses normal task progression
- Immediately calls `completeArea()`

**Area Completion** (Line 101-112):
- Looks up next area from `AREAS[areaId].next`
- Calls `saveFacade.markAreaComplete(roleId, areaId, nextAreaId)`
  - Adds current area to `completedAreas`
  - Adds next area to `unlockedAreas`
  - Updates `lastAreaId`
- Saves current inventory via `saveFacade.setInventory(roleId, taskSystem.getInventory())`

**⚠️ Critical**: Inventory is ONLY saved on area completion, not on task completion. If game crashes mid-area, inventory progress is lost.

### 3.3 Area Definitions

Location: [src/game/content/areas.ts](../../../src/game/content/areas.ts)

**Current Areas**:

```typescript
export const AREAS: Record<AreaId, AreaDef> = {
  backyard: {
    id: 'backyard',
    worldKey: 'BACKYARD',
    next: 'woodline',
    tasksByRole: {
      boy: ['boy_backyard_find_slingshot', 'boy_backyard_first_shots'],
      girl: ['girl_backyard_find_multitool', 'girl_backyard_carve_token'],
    },
  },
  woodline: {
    id: 'woodline',
    worldKey: 'WOODLINE',
    next: undefined,  // Terminal area
    tasksByRole: {
      boy: ['boy_woodline_find_flint', 'boy_woodline_spark_fire'],
      girl: ['girl_woodline_find_fieldguide', 'girl_woodline_bowdrill_fire'],
    },
  },
};
```

**Design**: 
- Each area defines separate task chains for boy and girl roles
- Areas unlock sequentially via `next` pointer
- No `isGate` concept - all tasks in an area must be completed before progression

**⚠️ No Gate Tasks**: Search for "isGate" returned 0 results. Gate-based unlocking is not implemented. All tasks must complete for area progression.

---

## 4. Inventory Persistence

### 4.1 Three Inventory Systems (⚠️ CRITICAL ISSUE)

**Problem**: Inventory state exists in THREE separate locations with unclear ownership:

#### Location 1: TaskSystem Runtime State

File: [src/game/systems/tasks/TaskSystem.ts:L15](../../../src/game/systems/tasks/TaskSystem.ts#L15)

```typescript
private inventory = new Set<string>();
```

**Type**: `Set<string>`  
**Lifecycle**: Created per GameApp session, disposed on unmount  
**Usage**: 
- Checked for `requiresItems` validation (Line 52-57)
- Modified by `grantsItems` and `consumesItems` (Line 68-78)
- Exported via `getInventory()` → converts to array

**This is the runtime source of truth.**

#### Location 2: SaveData Persistence

File: [src/game/systems/saves/SaveSystem.ts:L23](../../../src/game/systems/saves/SaveSystem.ts#L23)

```typescript
interface RoleProgress {
  inventory: string[];  // persistent per role
}
```

**Type**: `string[]`  
**Lifecycle**: Persisted to localStorage, survives game restarts  
**Usage**:
- Read on game start ([GameApp.ts:L275-276](../../../src/game/GameApp.ts#L275-L276))
- Written on area completion ([ProgressionSystem.ts:L111](../../../src/game/systems/progression/ProgressionSystem.ts#L111))

**This is the persistent source of truth.**

#### Location 3: UI State (DUPLICATE!)

File: [src/ui/state/useUiStore.ts:L15](../../../src/ui/state/useUiStore.ts#L15)

```typescript
interface UiState {
  inventoryItems: string[];
}
```

**Type**: `string[]`  
**Lifecycle**: Zustand store, exists for UI render session  
**Usage**: 
- Methods: `addInventoryItem()`, `removeInventoryItem()`
- **⚠️ NOT USED**: Search for "addInventoryItem" shows only type definition and implementation, no actual callers

**This appears to be dead code - not synchronized with TaskSystem.**

### 4.2 Inventory Load Flow

**On Game Start** ([GameApp.ts:L274-276](../../../src/game/GameApp.ts#L274-L276)):

```typescript
// Load saved inventory for this role
const savedInventory = saveFacade.getInventory(this.startParams.roleId);
savedInventory.forEach(item => this.taskSystem!.addItem(item));
```

**Flow**:
1. Read inventory from SaveData (persistent)
2. Populate TaskSystem inventory (runtime)
3. UI state inventory is NEVER populated

**⚠️ Desync Risk**: If UI inventory was ever wired up, it would be out of sync with TaskSystem on load.

### 4.3 Inventory Save Flow

**On Area Completion** ([ProgressionSystem.ts:L110-111](../../../src/game/systems/progression/ProgressionSystem.ts#L110-L111)):

```typescript
const inventory = this.taskSystem.getInventory();
saveFacade.setInventory(this.roleId, inventory);
```

**Flow**:
1. Read current inventory from TaskSystem (runtime)
2. Write to SaveData (persistent)
3. Happens ONLY on area completion

**⚠️ Critical Gaps**:
- No save on task completion
- No periodic autosave
- Game crash during area = inventory lost
- No save on pause/quit

### 4.4 Per-Role vs Global Inventory

**Current Design**: Per-role inventory (each role has independent inventory)

**Evidence**:
- SaveData stores `roles[roleId].inventory` separately
- Load/save always uses `roleId` parameter
- Tasks are role-specific ([areas.ts:L24-39](../../../src/game/content/areas.ts#L24-L39))

**⚠️ Cross-Role Item Sharing**: No mechanism exists for items to transfer between roles. Boy's slingshot cannot be used by Girl.

**Future-Ready Comment** ([SaveSystem.ts:L23](../../../src/game/systems/saves/SaveSystem.ts#L23)):
```typescript
inventory: string[];  // persistent per role (future-ready)
```

This suggests per-role inventory is intentional design, not a limitation.

---

## 5. Edge Cases & Gaps

### 5.1 Corrupted Save Data

**Scenario**: localStorage contains invalid JSON or schema

**Current Handling** ([SaveSystem.ts:L70-91](../../../src/game/systems/saves/SaveSystem.ts#L70-L91)):

```typescript
try {
  const rawData = JSON.parse(data);
  const migratedData = migrateSaveData(rawData, this.SAVE_VERSION);
  // ...
} catch (error) {
  console.error('Failed to load save:', error);
  return null;
}
```

**Result**: 
- Returns `null`
- Caller (`loadOrCreate()`) creates fresh save
- Old corrupted data remains in localStorage (not deleted)

**⚠️ Gap**: 
- No user notification of data loss
- Corrupted save not cleaned up (wastes storage)
- No backup/recovery mechanism

### 5.2 Missing Tasks

**Scenario**: Area references task ID that doesn't exist in `TASKS_BY_ID`

**Current Handling** ([ProgressionSystem.ts:L37-42](../../../src/game/systems/progression/ProgressionSystem.ts#L37-L42)):

```typescript
this.taskIds = taskIds.filter((id) => {
  if (!TASKS_BY_ID[id]) {
    console.warn(`[ProgressionSystem] Task ${id} not found in TASKS_BY_ID`);
    return false;
  }
  return true;
});
```

**Result**: 
- Missing tasks silently filtered out
- Progression continues with remaining tasks
- Area may complete prematurely if all tasks are missing

**⚠️ Risk**: Area with all missing tasks would immediately complete, skipping gameplay.

### 5.3 Invalid RoleId

**Scenario**: Save contains roleId that's not 'boy' or 'girl' (future expansion risk)

**Current Handling**: 
- No validation in SaveSystem
- TypeScript types prevent this at compile time: `Record<'boy' | 'girl', RoleProgress>`
- But migrated data or manual localStorage edits could introduce invalid roleId

**⚠️ Gap**: No runtime validation of roleId in saved data.

### 5.4 Version Migration Edge Cases

**V1 → V2 Migration Ambiguity**:

If old save has:
```json
{ "version": 1, "completedTasks": ["task_a"], "inventory": ["item_x"] }
```

Migration creates:
```json
{
  "version": 2,
  "roles": {
    "boy": { "completedTasks": ["task_a"], "inventory": ["item_x"] },
    "girl": { "completedTasks": ["task_a"], "inventory": ["item_x"] }
  }
}
```

**⚠️ Problem**: Both roles get identical progress. No way to determine original role.

**User Impact**: If player was halfway through as Boy, they'll find Girl role also halfway through. Breaks dual-role progression concept.

### 5.5 Concurrent Save Conflicts

**Scenario**: Multiple systems call saveFacade simultaneously

Example race:
1. System A: `loadMain()` → gets save v1
2. System B: `loadMain()` → gets save v1
3. System A: modifies save, `writeMain()`
4. System B: modifies save, `writeMain()` → overwrites A's changes

**⚠️ Gap**: No transaction locking or conflict detection.

### 5.6 Area Completion Without Next Area

**Scenario**: Player completes Woodline (terminal area with `next: undefined`)

**Current Handling** ([saveFacade.ts:L62-80](../../../src/game/systems/saves/saveFacade.ts#L62-L80)):

```typescript
markAreaComplete(roleId, areaId, nextAreaId?) {
  // ...
  if (nextAreaId && !role.unlockedAreas.includes(nextAreaId)) {
    role.unlockedAreas.push(nextAreaId);
  }
  if (nextAreaId) {
    role.lastAreaId = nextAreaId;
  }
  // ...
}
```

**Result**: 
- If `nextAreaId` is `undefined`, nothing added to `unlockedAreas`
- `lastAreaId` unchanged
- **This is correct behavior** - terminal area

**✅ No issue here.**

### 5.7 Role Switching Mid-Area

**Scenario**: Player starts Backyard as Boy, then switches to Girl via ProfileSelect

**Current Handling**:
- GameHost remounts ([GameHost.tsx:L59](../../../src/game/GameHost.tsx#L59))
- Entire GameApp disposed and recreated
- New TaskSystem created with Girl's saved inventory
- Boy's in-progress inventory changes LOST if not yet saved

**⚠️ Gap**: No autosave on role switch. Inventory changes lost unless area was completed.

### 5.8 QuotaExceededError

**Scenario**: localStorage full (common on old devices, ~5-10MB limit)

**Current Handling**: 
- SaveSystem catches error, returns `false`
- No fallback storage mechanism

**⚠️ Gap**: 
- User gets no notification
- Game continues running with unsaved state
- Silent data loss on subsequent sessions

---

## 6. Search Results

### 6.1 TODO/FIXME/STUB Search

**Saves System**: 0 results  
**Progression System**: 0 results  
**Session Facade**: 0 results

**Finding**: Code is marked as complete. No outstanding work items.

### 6.2 localStorage Usage

**16 total matches**:

| File | Lines | Usage |
|------|-------|-------|
| [src/lib/storage.ts](../../../src/lib/storage.ts) | L25, L35, L54, L58, L61, L67 | StorageManager wrapper |
| [src/game/systems/saves/SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts) | L72, L118, L143 | Direct save/load/delete |
| [docs/**](../../../docs) | Various | Documentation only |

**Architecture**: 
- StorageManager exists but NOT used by SaveSystem
- SaveSystem bypasses abstraction, uses localStorage directly
- Two separate implementations of localStorage access

**⚠️ Inconsistency**: Why have StorageManager if save system doesn't use it?

### 6.3 'any' Type Usage in Save Code

**4 matches in [migrations.ts](../../../src/game/systems/saves/migrations.ts)**:

| Line | Usage |
|------|-------|
| L8 | `type Migration = (data: any) => any;` |
| L13 | `1: (data: any) => { ... }` |
| L23 | `2: (data: any) => { ... }` |
| L73 | `function migrateSaveData(data: any, targetVersion: number)` |

**Justification**: Migration functions inherently work with unknown schemas. Using `any` is acceptable here since:
- Input schema varies by version
- Output schema is cast to known `SaveData` type
- Each migration validates and transforms structure

**ProgressionSystem**: 0 'any' types - clean typing

### 6.4 completedTasks References

**15 total matches**:

| File | Purpose |
|------|---------|
| [SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts) | Type definitions (V1 + V2) |
| [migrations.ts](../../../src/game/systems/saves/migrations.ts) | V1→V2 migration logic |
| [saveFacade.ts](../../../src/game/systems/saves/saveFacade.ts) | L87-88: markTaskComplete() implementation |
| [docs/**](../../../docs) | Documentation |

**Key Implementation** ([saveFacade.ts:L84-93](../../../src/game/systems/saves/saveFacade.ts#L84-L93)):

```typescript
markTaskComplete(roleId: 'boy' | 'girl', taskId: string): SaveData {
  const save = this.loadMain();
  const role = save.roles[roleId];
  
  if (!role.completedTasks.includes(taskId)) {
    role.completedTasks.push(taskId);
  }
  
  this.writeMain(save);
  return save;
}
```

**⚠️ Append-Only**: Tasks can be marked complete but never removed. No "reset task" functionality except full role reset.

### 6.5 inventory References

**20+ matches**:

| File | Purpose |
|------|---------|
| [SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts) | SaveData schema |
| [TaskSystem.ts](../../../src/game/systems/tasks/TaskSystem.ts) | Runtime inventory (Set) |
| [saveFacade.ts](../../../src/game/systems/saves/saveFacade.ts) | Get/set methods |
| [useUiStore.ts](../../../src/ui/state/useUiStore.ts) | Unused duplicate |
| [GameApp.ts](../../../src/game/GameApp.ts) | Load inventory on start |
| [ProgressionSystem.ts](../../../src/game/systems/progression/ProgressionSystem.ts) | Save inventory on area complete |

**Architectural Issue**: Three separate inventory implementations (see Section 4.1).

### 6.6 roleId References

**20+ matches**:

| File | Purpose |
|------|---------|
| [areas.ts](../../../src/game/content/areas.ts) | Type definition |
| [SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts) | Save data structure |
| [saveFacade.ts](../../../src/game/systems/saves/saveFacade.ts) | All methods take roleId param |
| [ProgressionSystem.ts](../../../src/game/systems/progression/ProgressionSystem.ts) | Constructor + task loading |
| [GameHost.tsx](../../../src/game/GameHost.tsx) | Session param |
| [ProfileSelect.tsx](../../../src/ui/screens/ProfileSelect.tsx) | Role selection UI |
| [Player.ts](../../../src/game/entities/player/Player.ts) | Character model loading |
| World creation functions | All take roleId param |

**Finding**: roleId is pervasive throughout codebase. Dual-role design is deeply integrated.

---

## 7. Recommended Improvements

### 7.1 Critical Issues

#### A. Fix Inventory Persistence Gaps

**Problem**: Inventory only saved on area completion. Crash = data loss.

**Solutions**:
1. **Autosave on Task Completion**: Modify [ProgressionSystem.handleTaskEvent()](../../../src/game/systems/progression/ProgressionSystem.ts#L70-L96) to save inventory after each task
2. **Periodic Autosave**: Add 30-second interval save in GameApp
3. **Save on Pause**: Hook into pause menu to trigger save
4. **Save on Role Switch**: GameHost should save inventory before unmounting

**Recommended**: Implement #1 (task-level save) + #3 (pause save)

#### B. Eliminate Duplicate Inventory Systems

**Problem**: Three separate inventory implementations cause confusion.

**Solutions**:
1. **Remove UI Store Inventory**: Delete `inventoryItems`, `addInventoryItem`, `removeInventoryItem` from useUiStore
2. **Single Source of Truth**: TaskSystem.inventory is runtime truth; SaveData is persistent truth
3. **Wire UI to TaskSystem**: If inventory display needed, read from TaskSystem via event bus

**Effort**: Low (delete ~10 lines of code)

#### C. Add Save Corruption Recovery

**Problem**: Corrupted save returns null with no user notification.

**Solutions**:
1. **Backup System**: Store last 2 valid saves (main + backup)
2. **Corruption Detection**: Add schema validation before returning save
3. **User Notification**: Emit event to show "Save corrupted, starting new game" modal
4. **Debug Export**: Add button to export/import save as JSON for manual recovery

**Recommended**: Implement #1 (backup) + #3 (notification)

### 7.2 Medium Priority

#### D. Unify localStorage Access

**Problem**: StorageManager exists but SaveSystem bypasses it.

**Solutions**:
1. **Refactor SaveSystem**: Use StorageManager for all reads/writes
2. **Or Remove StorageManager**: If not needed, delete dead abstraction

**Recommended**: Option 1 (use StorageManager) - provides consistent error handling and versioning.

#### E. Add Runtime Validation

**Problem**: No validation of loaded save data structure.

**Solutions**:
1. **Schema Validator**: Use Zod or similar to validate SaveData on load
2. **Fallback to Defaults**: If validation fails, use defaults instead of crashing
3. **Type Guards**: Add `isSaveData(obj): obj is SaveData` function

**Recommended**: Lightweight validation after JSON.parse, before migration.

#### F. Implement QuotaExceeded Handling

**Problem**: No fallback if localStorage is full.

**Solutions**:
1. **Compress Saves**: Use LZ-string to compress JSON before storing
2. **IndexedDB Fallback**: Attempt IndexedDB if localStorage fails
3. **User Prompt**: Ask to clear old saves if quota exceeded

**Recommended**: #1 (compression) - easiest, works for 90% of cases.

### 7.3 Nice-to-Have

#### G. Add Save Metadata

**Enhancement**: Store additional save metadata for better UX.

**Add to SaveData**:
```typescript
interface SaveData {
  // ... existing fields
  metadata: {
    lastPlayedTimestamp: number;
    totalPlayTime: number;        // milliseconds
    roleCompletionPercent: Record<RoleId, number>;
  };
}
```

**Use Cases**:
- ProfileSelect shows "Last played: 2 hours ago"
- Show completion percentage per role
- Track total playtime

#### H. Implement Selective Task Reset

**Enhancement**: Allow resetting individual tasks (useful for testing/debugging).

**Add to saveFacade**:
```typescript
resetTask(roleId: RoleId, taskId: string): SaveData {
  const save = this.loadMain();
  const role = save.roles[roleId];
  role.completedTasks = role.completedTasks.filter(id => id !== taskId);
  this.writeMain(save);
  return save;
}
```

#### I. Add Migration Rollback

**Enhancement**: Store original save version for safe rollback.

**Pattern**:
```typescript
interface SaveData {
  version: number;
  previousVersionBackup?: string;  // JSON of pre-migration save
}
```

If migrated save causes issues, user can rollback to previous version.

---

## 8. Summary

### Architecture Strengths

✅ **Dual-Role Design**: Clean separation of boy/girl progression  
✅ **Migration System**: Robust version upgrade path  
✅ **Error Handling**: Try/catch on all localStorage operations  
✅ **Type Safety**: Strong typing throughout (except necessary 'any' in migrations)  
✅ **Facade Pattern**: saveFacade provides clean API  

### Critical Gaps

❌ **Inventory Save Frequency**: Only on area completion - crash risk  
❌ **Duplicate Inventory Systems**: Three separate implementations cause confusion  
❌ **No Corruption Recovery**: Corrupted save = silent new game  
❌ **No Autosave**: No periodic or pause-triggered saves  
❌ **StorageManager Bypass**: Inconsistent localStorage access patterns  

### Risk Assessment

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Inventory loss on crash | High | Medium | High |
| Save corruption unnoticed | Medium | Low | High |
| Concurrent save conflicts | Low | Low | Medium |
| QuotaExceeded errors | Medium | Low | High |
| V1→V2 migration ambiguity | Low | One-time | Medium |

### Next Steps

**Immediate** (Next Sprint):
1. Add inventory save on task completion
2. Remove duplicate UI inventory state
3. Add save corruption notification

**Short-term** (Within Month):
4. Implement backup save system
5. Unify localStorage access via StorageManager
6. Add QuotaExceeded handling

**Long-term** (Future Enhancement):
7. Add save metadata (playtime, completion %)
8. Implement compression for larger saves
9. Build debug export/import tool

---

**End of Report**
