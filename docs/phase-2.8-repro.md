# Phase 2.8 — Repro Script (Fast Desync Detection)

**Purpose:** Minimal steps to reproduce role/save desync if it still exists after Phase 2.7 fixes.

**Goal:** Trigger corruption in <30 seconds, then use `__traceDump()` to diagnose exact cause.

---

## Prerequisites

1. **DEV mode enabled** (trace harness only works in DEV)
2. **Fresh save state** (reset via ProfileSelect or localStorage clear)
3. **Console open** (Chrome DevTools)

---

## Repro Steps (v1: Task Completion During Switch)

**Hypothesis:** Task completes mid-switch → ProgressionSystem writes to wrong role

### Steps:
1. **Start as Boy in Backyard**
   - Press Play from menu
   - Verify: `__snapshot()` shows all systems = 'boy'

2. **Get items for task 1**
   - Use cheats: `giveitem('axe')`, `giveitem('log')`
   - Open inventory: verify 2 items

3. **Begin task interaction (but don't complete)**
   - Approach campfire
   - Start dwell (hold interaction)
   - **Stop at ~50% progress** (don't complete yet)

4. **Switch to Girl mid-dwell**
   - Open inventory → click switch button
   - Watch console for `[Switch#1] ...` logs
   - Verify: `__snapshot()` now shows all systems = 'girl'

5. **Immediately complete the task as Girl**
   - Approach campfire again
   - Complete interaction (full dwell)
   - Watch for `[ProgressionSystem] markTaskComplete` log

6. **Check for desync**
   ```js
   __snapshot()
   // Expected: All roles = 'girl', inventory = boy's items
   // Bug: If task wrote to 'boy', completedTasks will be wrong
   ```

7. **Switch back to Boy**
   - Open inventory → switch to Boy
   - Verify inventory loads correctly

8. **Reload page**
   - Press Ctrl+R
   - Check: Boy should have completed task OR Girl should
   - Bug symptom: Neither has task complete, OR both have task complete

### Expected Trace Entries (if working correctly):
```
[Switch#1] Step 1: Saving boy inventory: ['axe', 'log']
[Switch#1] Step 3: Switching TaskSystem to girl
[Switch#1] Step 6: Reloading ProgressionSystem tasks for girl
[Switch#1] Step 6.6: Updating AutosaveSystem role to girl
[save] markTaskComplete(girl, campfire_v1)  ← Should be 'girl'
[save] syncInventory(girl, ['axe', 'log'])  ← AutosaveSystem should write to 'girl'
```

### Bug Signature (if broken):
```
[save] markTaskComplete(boy, campfire_v1)  ← WRONG! Should be 'girl'
```

---

## Repro Steps (v2: Autosave Debounce Race)

**Hypothesis:** Debounced autosave fires after switch → writes to stale role

### Steps:
1. **Start as Boy, give items**
   - `giveitem('axe')`
   - `giveitem('log')`

2. **Trigger autosave debounce (don't wait for it to fire)**
   - Complete a task interaction
   - This schedules a save in 500ms

3. **Switch to Girl IMMEDIATELY (within 500ms)**
   - Open inventory → switch
   - Race condition: switch updates `AutosaveSystem.roleId`, but debounced save may still reference old context

4. **Wait 1 second for debounce to fire**
   - Watch console for `[save] syncInventory(...)`

5. **Check for desync**
   ```js
   __snapshot()
   // Expected: All roles = 'girl'
   ```

6. **Inspect trace**
   ```js
   __traceDump(20, 'save')
   // Look for: syncInventory(boy, ...) AFTER Switch#N
   // Bug: If autosave wrote to 'boy' after switch completed
   ```

### Expected Trace Entries (if working correctly):
```
[game/task] complete: true
[Switch#1] START: boy → girl
[Switch#1] Step 6.6: Updating AutosaveSystem role to girl
[Switch#1] COMPLETE
[save] syncInventory(girl, ...)  ← Should be 'girl' even if debounced
```

### Bug Signature (if broken):
```
[save] syncInventory(boy, ...)  ← WRONG! Fired after switch but used stale role
```

---

## Repro Steps (v3: Switch Spam)

**Hypothesis:** Rapid switching causes systems to desync due to race conditions

### Steps:
1. **Start as Boy with items**
   - `giveitem('axe')`
   - `giveitem('log')`

2. **Spam switch button 10 times rapidly**
   - Open inventory
   - Click switch button repeatedly as fast as possible
   - Watch console for `[CharacterSwitchSystem] Switch already in progress` warnings

3. **Check final state**
   ```js
   __snapshot()
   // Expected: All systems agree on final role
   // Bug: Systems disagree (e.g., TaskSystem=girl, World=boy)
   ```

4. **Inspect trace for incomplete switches**
   ```js
   __traceDump(50, 'switch')
   // Look for: Switch#N START without corresponding COMPLETE
   ```

### Expected Behavior:
- Only one switch executes at a time (lock via `this.switching`)
- All other attempts are rejected
- Final snapshot shows consistent role

### Bug Signature (if broken):
```
[Switch#3] START: boy → girl
[Switch#4] START: girl → boy  ← Should be blocked!
```

---

## Repro Steps (v4: Area Transition with Stale Role)

**Hypothesis:** Gate transition saves inventory using wrong role

### Steps:
1. **Start as Boy, complete Backyard tasks**
   - Cheat to complete: `giveitem('axe')`, `giveitem('log')`, interact with campfire

2. **Switch to Girl**
   - Open inventory → switch to Girl
   - Verify: `__snapshot()` shows all = 'girl'

3. **Immediately interact with Woodline gate**
   - Approach gate
   - Interact to trigger `game/areaRequest`

4. **Check trace for save**
   ```js
   __traceDump(10, 'save')
   // Look for: syncInventory(...) during onAreaRequest
   // Expected: syncInventory(girl, ...)
   ```

### Expected Trace Entries (if working correctly):
```
[game/areaRequest] areaId: woodline
[save] syncInventory(girl, ...)  ← Should match current role
[save] setInventory(girl, ...)
```

### Bug Signature (if broken):
```
[save] syncInventory(boy, ...)  ← WRONG! Should be 'girl'
```

---

## Using Trace Harness for Diagnosis

### Quick Commands
```js
// Show last 50 entries (all categories)
__traceDump(50)

// Show only save writes
__traceDump(20, 'save')

// Show only switch transactions
__traceDump(10, 'switch')

// Show only errors
__traceDump(50, 'error')

// Capture current role snapshot
__snapshot()

// Clear buffer (start fresh)
__traceClear()

// Check buffer stats
__traceStats()
```

### Analyzing a Desync

**Step 1:** Capture snapshot immediately when corruption suspected
```js
const snap = __snapshot()
// Check if all roles match
```

**Step 2:** Dump recent save writes
```js
__traceDump(30, 'save')
// Look for roleId parameter in each write
// Compare to snapshot at time of write
```

**Step 3:** Find correlation ID for problem switch
```js
__traceDump(20, 'switch')
// Find Switch#N that triggered the issue
```

**Step 4:** Filter events by time range
```js
const switches = __traceDump(100, 'switch')
const problemSwitch = switches.find(e => e.msg.includes('Switch#5'))
const timeStart = problemSwitch.t - 1000  // 1s before
const timeEnd = problemSwitch.t + 2000    // 2s after

// Manually filter (or add helper):
__traceDump(200).filter(e => e.t >= timeStart && e.t <= timeEnd)
```

---

## Success Criteria

**Phase 2.8 is successful if:**
1. ✅ All 4 repro attempts produce ZERO role mismatches
2. ✅ `__snapshot()` always shows consistent roles across all systems
3. ✅ `__traceDump()` shows correct `roleId` parameter in every save write
4. ✅ No `🔥 ROLE MISMATCH` errors in trace logs
5. ✅ Reload after switch preserves correct inventory + tasks per role

**If ANY mismatch is found:**
- Trace dump provides exact timestamp, call stack, and snapshot
- Correlation ID links the save write to a specific switch transaction
- This makes root cause identification trivial (vs. hours of log digging)

---

## Next Steps

**If desync is detected:**
1. Capture `__traceDump(100)` and `__snapshot()` immediately
2. Save output to `docs/phase-2.8-desync-evidence.txt`
3. Identify which system wrote with wrong role
4. Add targeted fix (e.g., update role earlier, lock during switch)
5. Re-run repro to confirm fix

**If no desync is detected after all 4 repro attempts:**
- Phase 2.7 + 2.8 fixes are validated ✅
- Trace harness remains as ongoing safety net
- Move to Phase 2.9 (UI hardening / feedback polish)
