# Phase 2.8 — Implementation Summary

**Completed:** January 2, 2026  
**Goal:** Build authoritative wiring map + DEV trace harness for debugging role/save desync

---

## ✅ Deliverables Completed

### D1) Wiring Map Doc (Single Source of Truth)
**File:** [docs/phase-2.8-wiring-map.md](phase-2.8-wiring-map.md)

**Contents:**
- Complete system creation order (GameApp boot sequence)
- Dependency injection graph showing all system references
- Role source-of-truth list (who tracks roleId)
- All save writers with call sites and roleId sources
- Event flow diagrams for character switch + task completion
- Risk analysis of existing patterns

**Key Insights:**
- TaskSystem is the canonical source for currentRole + inventory
- CharacterSwitchSystem orchestrates 9-step switch sequence in strict order
- 6 systems cache roleId, all must be updated during switch
- 6 save write methods exist, all take roleId as explicit parameter

---

### D2) Role Cache Audit
**File:** [docs/phase-2.8-role-cache-audit.md](phase-2.8-role-cache-audit.md)

**Contents:**
- Table of all roleId/areaId caches with risk ratings (HIGH/MED/LOW)
- Detailed findings for each high-risk system
- Search results for constructor roleId, setRole, syncInventory, task completion
- Conclusions on what's fixed vs. what needs monitoring

**Risk Summary:**
- ✅ **AutosaveSystem** — FIXED in Phase 2.7 via `setRole()` method
- ⚠️ **ProgressionSystem** — Small race window if task completes mid-switch (monitor)
- ✅ **TaskSystem** — Safe (updated first in switch sequence)
- ✅ **CharacterSwitchSystem** — No cache (reads dynamically)
- ✅ **saveFacade** — No cache (parameters force explicit roleId)

---

### D3) DEV Trace Harness
**Files:**
- [src/game/debug/trace/TraceBuffer.ts](../src/game/debug/trace/TraceBuffer.ts) — Ring buffer (500 entries)
- [src/game/debug/trace/trace.ts](../src/game/debug/trace/trace.ts) — Logging helpers (info/warn/error)
- [src/game/debug/trace/attachEventBusTap.ts](../src/game/debug/trace/attachEventBusTap.ts) — EventBus tap
- [src/game/debug/trace/attachSaveFacadeTap.ts](../src/game/debug/trace/attachSaveFacadeTap.ts) — saveFacade tap
- [src/game/debug/trace/snapshot.ts](../src/game/debug/trace/snapshot.ts) — Role snapshot helper

**Features:**
- Ring buffer stores last 500 events (DEV only, no production overhead)
- Event tap logs all EventBus emissions with shallow payloads
- Save tap logs ALL save writes with:
  - roleId parameter
  - Payload summary (inventory count, task ID, etc.)
  - Call stack (truncated to identify caller)
  - **Snapshot** of all system roles at time of write
  - **Automatic mismatch detection** (logs error if roleId ≠ snapshot)
- Console commands: `__traceDump()`, `__traceClear()`, `__traceStats()`, `__snapshot()`
- Configurable per-category logging via `window.__traceConfig`

**Usage:**
```js
// Show last 50 entries
__traceDump(50)

// Show only save writes
__traceDump(20, 'save')

// Show only switch transactions
__traceDump(10, 'switch')

// Capture current role state
__snapshot()
// Output:
// TaskSystem role: girl
// World role: girl
// ProgressionSystem role: girl
// AutosaveSystem role: girl
// ✅ All roles consistent
```

---

### D4) Repro Script
**File:** [docs/phase-2.8-repro.md](phase-2.8-repro.md)

**Contents:**
- 4 different repro scenarios (task during switch, autosave debounce, switch spam, area transition)
- Step-by-step instructions with expected trace outputs
- Bug signatures to look for (e.g., `syncInventory(boy, ...)` after switch to girl)
- Guide to using trace harness for diagnosis
- Success criteria for Phase 2.8 validation

**Repro Scenarios:**
1. **Task completion during switch** — Trigger task complete mid-switch to test ProgressionSystem timing
2. **Autosave debounce race** — Switch immediately after task to test AutosaveSystem.setRole() fix
3. **Switch spam** — Rapid switch attempts to test locking mechanism
4. **Area transition with stale role** — Gate interaction to test onAreaRequest save

---

## Code Changes

### 1. CharacterSwitchSystem — Correlation IDs
**File:** [src/game/systems/characters/CharacterSwitchSystem.ts](../src/game/systems/characters/CharacterSwitchSystem.ts)

**Changes:**
- Added `private switchSeq = 0` counter
- Every `switchTo()` call increments counter and logs `[Switch#N]` for all steps
- DEV-only logs include correlation ID for tracing
- All 9 switch steps now have conditional DEV logging with Switch#N prefix

**Benefit:** Can trace every save write back to a specific switch transaction

---

### 2. GameApp — Trace Harness Wiring
**File:** [src/game/GameApp.ts](../src/game/GameApp.ts)

**Changes:**
- Added DEV-only trace harness initialization in `start()` (line ~433)
- Dynamically imports all trace utilities
- Sets snapshot system references (TaskSystem, World, ProgressionSystem, AutosaveSystem)
- Attaches taps to EventBus and saveFacade
- Exposes `window.__traceDump()`, `__traceClear()`, `__traceStats()`, `__snapshot()`
- Logs startup message with available commands

**Location:** Between autosave system creation and debug overlay initialization

---

## Non-Functional Changes (Documentation Only)

- No production code behavior changes
- All trace code is DEV-only (`import.meta.env.DEV` guards)
- No runtime overhead in production builds (imports tree-shaken out)
- Existing logging preserved (trace is additive)

---

## Validation Steps

### Manual Testing
1. **Start game in DEV mode**
   - Verify console shows: `[GameApp] ✅ Trace harness initialized`
   - Verify available commands listed

2. **Test trace commands**
   ```js
   __traceStats()  // Should show buffer initialized
   __snapshot()    // Should show all roles = 'boy' (or initial role)
   __traceDump(10) // Should show recent events
   ```

3. **Test switch with tracing**
   - Open inventory → switch to Girl
   - Watch console for `[Switch#1]` logs with all 9 steps
   - Run `__traceDump(30, 'switch')`
   - Verify: `Switch#1 START` and `Switch#1 COMPLETE` present
   - Run `__snapshot()` — should show all = 'girl'

4. **Test save tap**
   - Give item: `giveitem('axe')`
   - Run `__traceDump(10, 'save')`
   - Should show: `syncInventory(girl, 1 items)` with snapshot included

5. **Test mismatch detection (intentional corruption)**
   - NOT IMPLEMENTED (would require manually breaking a system)
   - If desync occurs naturally, logs will show: `🔥 syncInventory ROLE MISMATCH`

---

## Success Criteria

✅ **All deliverables created:**
- Wiring map doc
- Role cache audit doc
- Trace harness (5 files)
- Repro script doc

✅ **No production behavior changes:**
- All code is DEV-only
- Existing logs preserved

✅ **Trace harness functional:**
- `__traceDump()` shows recent events
- `__snapshot()` captures role state
- Save writes logged with snapshot
- Switch transactions have correlation IDs

✅ **Documentation authoritative:**
- Wiring map matches actual code
- Audit table complete and accurate
- Repro steps are minimal and fast

---

## Next Steps

### Immediate: Run Repro Tests
Follow [phase-2.8-repro.md](phase-2.8-repro.md) to validate Phase 2.7 fixes:
1. Task completion during switch
2. Autosave debounce race
3. Switch spam
4. Area transition

**Expected result:** Zero role mismatches, all snapshots consistent

---

### If Desync Found
1. Run `__traceDump(100)` immediately
2. Run `__snapshot()` to capture current state
3. Save outputs to `docs/phase-2.8-desync-evidence.txt`
4. Identify which system wrote with wrong roleId
5. Check correlation ID to link to specific switch
6. Add targeted fix (e.g., update role earlier, add lock)
7. Re-run repro to confirm

---

### If No Desync Found
✅ **Phase 2.7 + 2.8 validated**
- Trace harness remains as ongoing safety net
- Can be used for future debugging (not just switch issues)
- Provides visibility into all system state transitions

**Move to Phase 2.9:** UI hardening, feedback polish, edge case handling

---

## Files Changed

### New Files (9)
1. `docs/phase-2.8-wiring-map.md` — Authoritative system wiring documentation
2. `docs/phase-2.8-role-cache-audit.md` — Risk analysis of role caches
3. `docs/phase-2.8-repro.md` — Fast repro scripts for desync detection
4. `docs/phase-2.8-implementation-summary.md` — This file
5. `src/game/debug/trace/TraceBuffer.ts` — Ring buffer for trace events
6. `src/game/debug/trace/trace.ts` — Logging helpers
7. `src/game/debug/trace/attachEventBusTap.ts` — EventBus tap
8. `src/game/debug/trace/attachSaveFacadeTap.ts` — saveFacade tap
9. `src/game/debug/trace/snapshot.ts` — Role snapshot helper

### Modified Files (2)
1. `src/game/systems/characters/CharacterSwitchSystem.ts` — Added switchSeq correlation IDs
2. `src/game/GameApp.ts` — Wired trace harness in DEV mode

---

## Phase 2.8 Complete ✅

**Outcome:**
- Comprehensive visibility into role/save system behavior
- Fast, reproducible desync detection if it exists
- Authoritative documentation for future maintainers
- Zero production overhead (DEV-only)

**Time to complete:** ~2 hours (documentation + trace implementation + integration)

**Next:** Validate with repro tests, then move to Phase 2.9
