# Phase 11 - Woodline Sweep Findings

**Generated:** Pre-implementation codebase analysis  
**Purpose:** Document existing systems before making changes (Phase 11 Step 0 requirement)

---

## 1. Current Woodline State Machine

### Event Flow Map
```
Interactable Interaction
    ↓
emit: { type: 'interaction/complete', targetId: INTERACTABLE_ID }
    ↓
GameApp.onCompletionEvent() → TaskSystem.handleCompletion(targetId)
    ↓
emit: { type: 'game/task', taskId, complete: true }
    ↓
ProgressionSystem.handleTaskEvent(taskId, complete)
    ↓
saveFacade.markTaskComplete(roleId, taskId)
    ↓
(if all tasks complete) → emit: { type: 'game/areaComplete', areaId, roleId }
    ↓
ProgressionSystem.completeArea(roleId, areaId)
    ↓
saveFacade.markAreaComplete(roleId, areaId, nextAreaId)
    ↓
(unlocks nextAreaId for roleId)
```

### World Transition Flow
```
Gate Interaction
    ↓
emit: { type: 'game/areaRequest', areaId: 'target' }
    ↓
GameApp.onAreaRequest(areaId)
    ↓
Check: saveFacade.getUnlockedAreas(roleId).includes(areaId)
    ↓
YES → sessionFacade.setArea(areaId) → GameHost remounts
NO  → emit: { type: 'ui/toast', message: 'Keep exploring...' }
```

### Current Woodline Interactables
| ID | Type | Role | Current Behavior |
|----|------|------|------------------|
| `FLINT_PICKUP` | Pickup | Boy | Emits `interaction/complete` on collect |
| `FIELDGUIDE_PICKUP` | Pickup | Girl | Emits `interaction/complete` on collect |
| `WOODLINE_CAMPFIRE` | Interactive | Boy | Boy lights with flint → emits `interaction/complete` ✅ |
| `BOWDRILL_STATION` | Interactive | Girl | Girl lights via bowdrill → emits for bowdrill only ❌ |

**BUG IDENTIFIED:** Girl's bowdrill path calls `campfire.setFireLit(true)` but only emits `interaction/complete` for `BOWDRILL_STATION`, NOT for `WOODLINE_CAMPFIRE`. This breaks progression symmetry—Girl cannot complete the campfire task.

---

## 2. Area Completion & Persistence Mechanism

### How Area Complete is Determined
1. **Task-Based:** Each area has `tasksByRole` (boy tasks, girl tasks)
2. **Progression System:** Listens for `game/task` events with `complete: true`
3. **Completion Check:** When all tasks for a role complete → fires `game/areaComplete`
4. **Unlock:** Next area (via `AreaDef.next`) becomes available for that role

### Persistence Architecture
```typescript
// Save Structure (localStorage, key: 'lw_save_main')
interface SaveData {
  version: number;
  roles: {
    boy: {
      unlockedAreas: AreaId[];     // ['backyard', 'woodline']
      completedAreas: AreaId[];    // ['backyard']
      completedTasks: string[];    // ['backyard_gate_boy', ...]
      inventory: ItemStack[];
    };
    girl: { /* same */ };
  };
}

// Access Pattern
saveFacade.markAreaComplete(roleId, areaId, nextAreaId);
// → Adds areaId to completedAreas, nextAreaId to unlockedAreas

saveFacade.getUnlockedAreas(roleId);
// → Returns string[] of unlocked areas for role
```

### Current Areas Definition
```typescript
// src/game/content/areas.ts
{
  backyard: { id: 'backyard', next: 'woodline', ... },
  woodline: { id: 'woodline', next: undefined, ... }
}
// ⚠️ No Creek area defined yet
```

---

## 3. World Transition Trigger Pattern

### Existing Implementation (BackyardWorld gate)
```typescript
// BackyardWorld.ts line 724
{
  id: INTERACTABLE_ID.BACKYARD_GATE,
  label: 'To Woodline',
  type: InteractableType.INTERACT,
  interact: () => {
    // No unlock check here - GameApp handles it
    eventBus.emit({ type: 'game/areaRequest', areaId: 'woodline' });
  }
}
```

### GameApp Handling (line 174)
```typescript
private onAreaRequest(areaId: string) {
  const unlockedAreas = saveFacade.getUnlockedAreas(roleId);
  
  if (unlockedAreas.includes(areaId)) {
    saveFacade.setInventory(roleId, this.taskSystem?.getInventory() || []);
    sessionFacade.setArea(areaId as AreaId);
    // GameHost listens to sessionStore, remounts world
  } else {
    this.bus.emit({ type: 'ui/toast', level: 'info', message: 'Keep exploring to go deeper.' });
  }
}
```

### Pattern Rules
✅ **DO:** Emit `game/areaRequest` from gate interactables  
✅ **DO:** Let GameApp check unlock status via saveFacade  
✅ **DO:** Use `sessionFacade.setArea()` to trigger remount  
❌ **DON'T:** Invent new event types (use existing `game/areaRequest`)  
❌ **DON'T:** Put unlock logic in world code (centralized in GameApp)

---

## 4. Missing Systems

### ❌ World Flag Persistence
- **Problem:** Campfire lit state is local to world instance, resets on remount
- **Need:** Persistent flags like `woodline.campfireLit` that survive reloads
- **Solution:** Create `worldFlags` in SaveData or dedicated state helper

### ❌ Creek World Implementation
- **Status:** `src/game/worlds/creek/` folder exists with README.md only
- **Need:** CreekWorld.ts factory function
- **Need:** AreaId type update ('creek'), areas.ts entry, interactableIds.ts gate constant

### ❌ Woodline Asset Robustness
- **Problem:** TreesBushes.glb clones not tracked for disposal/freezing
- **Problem:** `setTimeout(..., 1000)` for freeze is timing-based, unreliable
- **Problem:** Shared material disposal can double-dispose
- **Solution:** Use `LoadAssetContainerAsync`, track meshes in arrays, freeze after load

---

## 5. Implementation Sequence (Phase 11)

### Step 1: Fix Campfire Convergent Path ✅ CRITICAL
- Refactor Girl's bowdrill to emit `WOODLINE_CAMPFIRE` completion
- Create single `completeCampfireTask()` helper both paths call

### Step 2: Create World Flag System
- Add `worldFlags: Record<string, any>` to SaveData structure
- Create `saveFacade.getWorldFlag(areaId, key)` / `setWorldFlag(...)`
- Persist campfire lit state, load on world creation

### Step 3: Add Creek to Content System
- Update AreaId type with 'creek'
- Create AREAS.creek definition, set woodline.next = 'creek'
- Add WOODLINE_CREEK_GATE to interactableIds.ts

### Step 4: Create Creek World Stub
- Create src/game/worlds/creek/CreekWorld.ts
- Minimal factory returning player, companion, empty interactables, dispose
- Register in WorldManager/worldManifest.ts

### Step 5: Implement Creek Gate in Woodline
- Position between north pines (per README "north edge path")
- Check `campfireLit OR areaComplete` for unlock hint
- Emit `game/areaRequest` with areaId 'creek'

### Step 6: Robustness Fixes (Optional)
- Refactor tree loading to use LoadAssetContainerAsync
- Track all instantiated meshes for freeze/dispose
- Remove setTimeout, use asset-ready callback

---

## 6. Key Quotes from Spec

> "MUST READ FIRST: Sweep through your codebase. How does the current Woodline work? How does your event system detect 'complete' for interactables?"

> "Don't invent a new event type unless it already exists in your codebase."

> "The gate's unlock hint can be smart: if campfire is lit OR area complete → allow passage."

> "Make campfire lighting a single function with a single state flag; both role paths call it."

---

## 7. Technical Constraints

- **Event System:** AppEvent union in events.ts, typed eventBus
- **World Pattern:** Factory functions returning `{ player, companion, interactables, dispose }`
- **Asset Loading:** SceneLoader.ImportMeshAsync or LoadAssetContainerAsync
- **Material Sharing:** Track unique materials to avoid double-dispose
- **Persistence:** localStorage-based via saveFacade, MAIN_SLOT = 'main'

---

## Ready to Implement ✅

All systems mapped. No unknown patterns. Following existing conventions for all changes.
