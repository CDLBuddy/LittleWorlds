# Phase v0.5.0 — Areas + Data-Driven Tasks Foundation

**Date:** 2025-12-27  
**Status:** ✅ Complete

---

## Goal

Refactor tasks and inventory systems to support data-driven chapter authoring. This enables new areas (Backyard/Woodline) to be defined as data rather than hardcoded logic, preparing the foundation for multi-area progression with role-specific task chains.

---

## Files Added

- [src/game/content/areas.ts](../src/game/content/areas.ts) — Area registry with Backyard + Woodline definitions

---

## Files Changed

- [src/game/content/tasks.ts](../src/game/content/tasks.ts)
  - Replaced `requiresItem?: string` with `requiresItems?: string[]`
  - Added `grantsItems?: string[]` and `consumesItems?: string[]` to TaskStep
  - Converted campfire_v1 to new data structure
  - Added 8 new task definitions (boy/girl × Backyard/Woodline)
  - Created `TASKS_BY_ID` registry and updated `allTasks` export

- [src/game/content/items.ts](../src/game/content/items.ts)
  - Added 8 new items: slingshot, steel_balls, multitool, string, flint, field_guide, carved_token, bow_drill
  - Items use placeholder icons (actual assets TBD)

- [src/game/shared/events.ts](../src/game/shared/events.ts)
  - Extended PromptIcon to include: 'book', 'knife', 'spark', 'knot', 'target'

- [src/ui/hud/widgets/HintPulse.tsx](../src/ui/hud/widgets/HintPulse.tsx)
  - Added emoji mappings for new icons: 📖 🛠️ ✨ 🪢 🎯

- [src/game/systems/tasks/TaskSystem.ts](../src/game/systems/tasks/TaskSystem.ts)
  - Removed hardcoded step-id → item mappings (pickup_axe, chop_log)
  - Implemented data-driven inventory logic via `grantsItems`/`consumesItems`/`requiresItems` arrays
  - Replaced inventory clearing with preservation on task completion
  - Changed completion behavior: sets `currentTask = null` instead of resetting to step 0
  - Added `getInventory()` helper method

---

## Key Decisions

### 1. Inventory Preservation
**Why:** Previously, inventory was cleared on task completion (test-only behavior). To support multi-area progression where items carry forward (e.g., multitool from Backyard → Woodline), inventory now persists across tasks.

### 2. Data-Driven Item Grants/Requirements
**Why:** Hardcoded mappings like `if (step.id === 'pickup_axe') inventory.add('axe')` were inflexible and error-prone. The new `grantsItems`/`requiresItems`/`consumesItems` arrays make task definitions self-documenting and enable rapid authoring of new tasks without touching system code.

### 3. Task Completion = Null Current Task
**Why:** Previously, tasks reset to step 0 after completion (test loop). Now, completing a task sets `currentTask = null`, which stops prompts and allows for explicit next-task loading (will be implemented in Phase 2).

### 4. Areas as Data, Not Worlds (Yet)
**Why:** worldKey is currently a string ('BACKYARD', 'WOODLINE') rather than a direct world reference. This decouples task/area data from 3D world implementation, allowing content authoring before actual world-building.

---

## Testing

### Manual Test (BootWorld Campfire)
The existing campfire_v1 task in BootWorld should work identically:
1. Approach axe → hand icon appears
2. Interact → axe added to inventory
3. Approach log pile → axe icon appears
4. Interact → log added to inventory (axe remains)
5. Approach campfire → fire icon appears
6. Interact → task completes, inventory preserved

Expected behavior changes:
- ✅ Inventory no longer clears after step 3
- ✅ No auto-reset to step 0 (task becomes null)

### Automated Tests
- ✅ `npm run verify` passes
- ✅ TypeScript strict mode passes
- ✅ ESLint passes (0 errors, 124 pre-existing warnings)
- ✅ Build succeeds

---

## Data Summary

### Areas Defined
- **Backyard** → Woodline
  - Boy: find_slingshot, first_shots, find_flint, spark_fire
  - Girl: find_multitool, carve_token, find_fieldguide, bowdrill_fire

### Items Added
- **Boy path:** slingshot, steel_balls, flint
- **Girl path:** multitool, string, field_guide
- **Keepsakes:** carved_token, bow_drill

### Tasks Defined
9 total (1 existing + 8 new):
- campfire_v1 (existing, converted)
- 4 Backyard tasks (2 boy, 2 girl)
- 4 Woodline tasks (2 boy, 2 girl)

---

## What's Next (Phase 2 Goals)

1. **Area Progression System**
   - Implement `startArea(areaId, role)` in GameApp
   - Load task sequences from areas.ts
   - Handle area transitions (Backyard → Woodline)

2. **Profile System**
   - Store selected role (boy/girl)
   - Track area progression
   - Persist inventory across sessions

3. **World Linking**
   - Build actual Backyard/Woodline 3D worlds
   - Link worldKey → World classes
   - Create interactables with targetIds matching task definitions

4. **UI Enhancements**
   - Show current area name
   - Display inventory UI
   - Task completion celebrations

---

## Acceptance Criteria

- ✅ `npm run verify` passes
- ✅ BootWorld campfire_v1 still works
- ✅ TaskSystem contains no step-id hardcoded grant logic
- ✅ Inventory does not clear on task completion
- ✅ Areas + tasks exist as data exports
- ✅ Summary doc created

---

## Notes

- targetIds in new tasks (e.g., 'slingshot_pickup', 'backyard_target') are placeholders. Actual interactables will be created when worlds are built.
- Icons use placeholder paths; asset creation is deferred to art production phase.
- The system is now "data-first": new chapters can be authored by editing areas.ts and tasks.ts without touching TaskSystem code.
