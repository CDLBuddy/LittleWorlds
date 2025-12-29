# Agent C: Worlds, Entities, and Interactions Investigation

**Date:** December 28, 2025  
**Mission:** Map all worlds, entity creation, and interaction systems in Little Worlds  
**Status:** ✅ COMPLETE

---

## Executive Summary

Little Worlds implements **5 worlds** (2 complete, 1 boot/dev, 2 stub), **3 entity types** (Player, Companion, Props), and a **dual-system interaction architecture** (WakeRadius + InteractionSystem). Task targetIds are **hardcoded strings** with **no validation** against world interactables - major mismatch risk.

**Critical Findings:**
- ⚠️ **No targetId validation** - tasks reference interactables that may not exist
- ⚠️ **Magic strings everywhere** - 30+ hardcoded IDs across worlds/tasks
- ⚠️ **Model loading fragility** - FBX fallbacks missing, GLB-only for Player/Companion
- ✅ **Interaction system is solid** - WakeRadius + InteractionSystem work well together

---

## 1. Worlds Inventory

| World | File | Status | Scenes/Meshes | Interactables | Task Support |
|-------|------|--------|---------------|---------------|--------------|
| **BootWorld** | [BootWorld.ts](../../../src/game/worlds/BootWorld.ts) | ✅ Dev/Boot | Ground plane, primitives | 3 (axe, logpile, campfire) | Dev `campfire_v1` task only |
| **BackyardWorld** | [BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts) | ✅ COMPLETE | Sky, grass grid (6x6), House.glb, TreesBushes.glb (4), fences, sandbox, garden | 5 (slingshot, target, multitool, carve_station, gate) | Boy/Girl backyard tasks + gate to woodline |
| **WoodlineWorld** | [WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts) | ✅ COMPLETE | Ground, clearing, TreesBushes.glb (6), fog | 4 (campfire, flint, fieldguide, bowdrill) | Boy/Girl woodline tasks |
| **ForestWorld** | [ForestWorld.ts](../../../src/game/worlds/forest/ForestWorld.ts) | ❌ STUB | Empty (TODOs) | 0 | None |
| **BeachWorld** | [BeachWorld.ts](../../../src/game/worlds/beach/BeachWorld.ts) | ❌ STUB | Empty (TODOs) | 0 | None |

### World Selection Logic
**File:** [GameApp.ts](../../../src/game/GameApp.ts#L169-L177)

```typescript
if (this.startParams.areaId === 'backyard') {
  world = createBackyardWorld(this.scene, this.bus, roleId);
} else if (this.startParams.areaId === 'woodline') {
  world = createWoodlineWorld(this.scene, this.bus, roleId);
} else {
  // Boot world fallback for dev/testing
  world = createBootWorld(this.scene, this.bus, roleId);
}
```

**World Manager:** [WorldManager.ts](../../../src/game/worlds/WorldManager.ts) exists but **NOT USED** - worlds are created directly in GameApp.

---

## 2. World Implementation Details

### 2.1 BootWorld (Dev/Testing)

**File:** [BootWorld.ts](../../../src/game/worlds/BootWorld.ts)

**Purpose:** Minimal primitive-based world for dev testing

**Scenes/Meshes Created:**
- Ground plane: 60x60 MeshBuilder.CreateGround
- Fog: Scene.FOGMODE_EXP2, density 0.02
- Lights: HemisphericLight + DirectionalLight
- Player spawn: (0, 0.9, 0)
- Companion spawn: (3, 0.4, 2)

**Interactables Placed:**
1. **Axe** - Props entity at (8, 0, 0), ID: `axe_001`
2. **LogPile** - Props entity at (16, 0, 6), ID: `logpile_001`
3. **Campfire** - Props entity at (24, 0, -4), ID: `campfire`

**Task Mapping:**
- Supports dev `campfire_v1` task (lines 23-45 in [tasks.ts](../../../src/game/content/tasks.ts#L23-L45))
- TaskSystem fallback: "If devBootFallback=true && areaId='backyard', use campfire_v1"

**Hardcoded Values:**
- Ground size: 60x60
- Axe/LogPile/Campfire positions (magic numbers)
- All interactable IDs are hardcoded strings

---

### 2.2 BackyardWorld (First Real Area)

**File:** [BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts) (675 lines)

**Purpose:** Morning-lit backyard with house, fences, role-specific tasks

**Scenes/Meshes Created:**

1. **Sky:** Procedural SkyMaterial (sunrise at inclination 0.03, azimuth 0.25)
2. **Ground:** 80x80 base plane (hidden once grass loads)
3. **Grass:** 6x6 grid of Summergrass.glb instances with exclusion zones:
   - House exclusion: (0, 32) ±10x6
   - Sandbox exclusion: (-7.5, 5.5) ±2.5x2.5
   - Garden exclusion: (-15, -18) ±3x2
4. **House.glb** at (0, 0, 32) - async loaded
5. **TreesBushes.glb** instances at 4 positions (lines 182-243):
   - (-20, 0, 20), (18, 0, 18), (-22, 0, -10), (22, 0, -8)
6. **Tire swing:** Rope cylinder + torus tire at (22, 1.5-3.5, -8)
7. **Sandbox:** 3x3 sand box at (-7.5, 0.15, 5.5) with wood borders
8. **Garden:** 4x2 dirt box at (-15, 0.1, -18)
9. **White picket fences:** 4 sides with gate opening at back (lines 311-418)

**Interactables Placed:**

| ID | Type | Position | Task | Lines |
|----|------|----------|------|-------|
| `slingshot_pickup` | GLB model (Slingshot.glb) | (-10, 0.5, 10) | Boy: find_slingshot | 434-461 |
| `backyard_target` | Cylinder primitive | (-15, 1, -5) | Boy: first_shots | 463-473 |
| `multitool_pickup` | Box primitive | (10, 0.5, 10) | Girl: find_multitool | 474-483 |
| `carve_station` | Box primitive | (15, 0.4, -5) | Girl: carve_token | 485-494 |
| `backyard_gate` | Box primitive | (0, 1, -30) | Transition to woodline | 495-502 |

**Magic Strings/Hardcoded Values:**
- Model paths: `'assets/models/Summergrass.glb'`, `'assets/models/House.glb'`, `'assets/models/TreesBushes.glb'`, `'assets/models/Slingshot.glb'`
- Interactable IDs: All 5 hardcoded strings
- Grass grid: 6x6 with spacing 13, offset -40 (line 105)
- Tree positions array (line 183)
- Fence dimensions (60x60 boundary)

**TODOs Found:**
- Lines 571, 602, 633: `// TODO: Add to AppEvent type` for interaction/complete events (currently commented out)

**Dynamic Loading Issue:**
Slingshot.glb loads **asynchronously** - world provides `registerDynamic()` callback to register late-loading interactables with InteractionSystem (lines 431-462).

---

### 2.3 WoodlineWorld (Second Area)

**File:** [WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts) (400 lines)

**Purpose:** Late morning forest with campfire checkpoint and role-specific fire methods

**Scenes/Meshes Created:**

1. **Sky:** Clear Color4(0.7, 0.85, 1.0, 1.0)
2. **Ground:** 70x70 forest floor (darker green than backyard)
3. **Clearing:** 8-radius disc at (0, 0.01, 0) - lighter grass around campfire
4. **TreesBushes.glb** instances at 6 positions (lines 82-148)
5. **Fog:** Lighter than backyard (density 0.012)
6. **Lights:** Brighter morning sun (intensity 1.0)

**Interactables Placed:**

| ID | Type | Position | Task | Lines |
|----|------|----------|------|-------|
| `campfire` | Torus ring + flame cylinder + PointLight | (0, 0, -5) | Both roles (boy sparks, girl bowdrill) | 253-343 |
| `flint_pickup` | Box primitive | (-8, 0.5, 5) | Boy: find_flint | 234-263 |
| `fieldguide_pickup` | Box primitive | (8, 0.5, 5) | Girl: find_fieldguide | 234-263 |
| `bowdrill_station` | Box primitive | (5, 0.3, -8) | Girl: bowdrill_fire (lights campfire) | 345-379 |

**Campfire State Management:**
Campfire has **setFireLit(bool)** method (line 325) - controlled by:
- Boy directly (spark_fire interaction)
- Girl indirectly (bowdrill_station lights campfire on interact - line 372)

**Magic Strings:**
- All interactable IDs hardcoded
- Tree positions array (line 83)
- Model path: `'assets/models/TreesBushes.glb'`

---

### 2.4 ForestWorld & BeachWorld (Stubs)

**Files:** [ForestWorld.ts](../../../src/game/worlds/forest/ForestWorld.ts), [BeachWorld.ts](../../../src/game/worlds/beach/BeachWorld.ts)

**Status:** Empty shells with TODO comments only

**Forest subdirectory structure:**
- ambience.ts, fog.ts, ground.ts, interactables.ts, layout.ts, lighting.ts

**TODOs Found:**
- [ForestWorld.ts:14](../../../src/game/worlds/forest/ForestWorld.ts#L14): `// TODO: Load forest assets, setup lighting, spawn points`
- [ForestWorld.ts:19](../../../src/game/worlds/forest/ForestWorld.ts#L19): `// TODO: Cleanup forest resources`
- [BeachWorld.ts:14](../../../src/game/worlds/beach/BeachWorld.ts#L14): `// TODO: Load beach assets`
- [BeachWorld.ts:19](../../../src/game/worlds/beach/BeachWorld.ts#L19): `// TODO: Cleanup beach resources`

---

## 3. Entity Creation Flow

### 3.1 Player Entity

**File:** [Player.ts](../../../src/game/entities/player/Player.ts)

**Creation Flow:**

1. **Immediate:**
   - TransformNode root created at spawn position
   - **Capsule placeholder** (1.8 height, 0.4 radius) created instantly
   - Role-specific color: Boy = blue (0.2, 0.5, 0.9), Girl = pink (1.0, 0.4, 0.7)

2. **Async Model Load:**
   - Loads role-specific GLB: `MODELS[roleId]` ('boy' → Boy.glb, 'girl' → Girl.glb)
   - Uses [loadGlb](../../../src/game/assets/loaders/gltf.ts) helper
   - Model parented to root, offset Y +0.45 to align feet
   - Placeholder disposed on success

3. **Fallback Behavior:**
   - If model fails or doesn't exist (Girl.glb not in manifest yet), **keeps placeholder**
   - No FBX fallback - GLB only

**Animation Setup:**
- Heuristic mapping: idle/wait → 'idle', walk/run → 'walk', celebrate/jump → 'celebrate'
- Warning if no animations found (lines 127-132)

**Model Status:**
- Boy.glb: ✅ In manifest ([manifest.ts:16,39](../../../src/game/assets/manifest.ts#L16))
- Girl.glb: ❌ Not in manifest (fallback to placeholder)

**TODOs:**
- [animations.ts:19](../../../src/game/entities/player/animations.ts#L19): `// TODO: Play animation on mesh`

---

### 3.2 Companion Entity

**File:** [Companion.ts](../../../src/game/entities/companion/Companion.ts)

**Creation Flow:**

1. **Immediate:**
   - TransformNode root 'companionVisualRoot' at spawn position
   - **Sphere placeholder** (1.2 diameter, golden color) created instantly
   - FSM initialized to 'FollowPlayer' state

2. **Async Model Load:**
   - Loads Dog.glb via `MODELS.dog`
   - Model parented to root, scaled 2.0x, offset Y -0.4
   - Placeholder disposed on success

3. **Fallback Behavior:**
   - If model fails, **keeps placeholder** (no FBX fallback)

**Animation Setup:**
- Heuristic mapping: idle/sit → 'idle', walk/run → 'walk', sniff → 'sniff'
- Warning if no animations found (lines 139-146)

**FSM States:**
- FollowPlayer, LeadToTarget, CircleTarget, ReturnToPlayer, Sniff
- State transitions emit `game/companion/state` events

**Model Status:**
- Dog.glb: ✅ In manifest ([manifest.ts:17,40](../../../src/game/assets/manifest.ts#L17))

**TODOs:**
- [fsm.ts:20](../../../src/game/entities/companion/fsm.ts#L20): `// TODO: State transitions`

---

### 3.3 Props Entities

**Files:** [props/](../../../src/game/entities/props/)

**Created in worlds:**
- **Axe:** BootWorld only (class in Axe.ts)
- **LogPile:** BootWorld only (class in LogPile.ts)
- **Campfire:** BootWorld + WoodlineWorld (class in Campfire.ts)
- **Tent:** Entity exists (class in Tent.ts) but **NOT USED** in any world

**Tent TODO:**
- [Tent.ts:15](../../../src/game/entities/props/Tent.ts#L15): `// TODO: Trigger tent interior, rest, save`

---

### 3.4 NPC Entity

**File:** [NPC.ts](../../../src/game/entities/npc/NPC.ts)

**Status:** Empty stub with TODO

**TODO:**
- [NPC.ts:6](../../../src/game/entities/npc/NPC.ts#L6): `// TODO: Implement NPCs`

---

## 4. Interaction System Mechanics

### 4.1 WakeRadius System

**File:** [wakeRadius.ts](../../../src/game/systems/interactions/wakeRadius.ts)

**Purpose:** Hysteresis-based proximity detection to optimize rendering

**Radii:**
- **Normal:** R_IN = 6, R_OUT = 8
- **Task targets:** TASK_R_IN = 14, TASK_R_OUT = 16 (extended range)

**Algorithm:**
```typescript
if (wakeable.asleep && distance < R_IN) {
  wakeable.wake();  // Pop animation
} else if (!wakeable.asleep && distance > R_OUT && !isTaskTarget) {
  wakeable.sleep(); // Current task target NEVER sleeps
}
```

**Task-Aware Logic:**
- Gets current targetId from TaskSystem ([line 45](../../../src/game/systems/interactions/wakeRadius.ts#L45))
- Task targets use larger radius (14 vs 6)
- Task targets **never sleep** while active

**Animation:**
- Pop-in: Scale 0.85 → 1.0 over 0.2s (lines 67-83)

---

### 4.2 Interaction System

**File:** [InteractionSystem.ts](../../../src/game/systems/interactions/InteractionSystem.ts)

**Purpose:** Dwell-based interaction with UI prompts

**Flow:**

1. **Check Task Target First:**
   - Gets `targetId = taskSystem.getCurrentTargetId()` ([line 51](../../../src/game/systems/interactions/InteractionSystem.ts#L51))
   - If exists and within 3.0 radius, handle interaction
   
2. **Fallback to Always-Active:**
   - If no task target, check for `alwaysActive` interactables (gates, etc.)
   - Same 3.0 radius check

3. **Dwell Accumulation:**
   - Proximity < 3.0 → accumulate dwell time
   - Emit `game/dwell` with progress (0.0-1.0)
   - Show prompt icon (task-specific or generic 'hand')

4. **Auto-Interact:**
   - Dwell time ≥ 500ms → trigger interact()
   - For task targets: check `taskSystem.canInteract(targetId)` first
   - Complete task step if task target
   - Emit `game/interact` for SFX
   - Start cooldown (1s for tasks, 3s for gates)

**Cooldown System:**
- Prevents rapid re-triggering after interaction
- Clears prompts/dwell during cooldown ([lines 41-47](../../../src/game/systems/interactions/InteractionSystem.ts#L41-L47))

**Always-Active Interactables:**
- Gates have `alwaysActive: true` (line 663 in BackyardWorld.ts)
- Can be interacted with **without active task**

---

### 4.3 Prompts System

**File:** [prompts.ts](../../../src/game/systems/interactions/prompts.ts)

**Status:** Simple manager with haptic feedback

**TODO:**
- [Line 18](../../../src/game/systems/interactions/prompts.ts#L18): `// TODO: Trigger sparkle effect`

---

## 5. TargetId Mapping Audit

### 5.1 Task Definitions

**File:** [tasks.ts](../../../src/game/content/tasks.ts)

**All Task TargetIds:**

| Task ID | Step targetId | World | Interactable Exists? |
|---------|---------------|-------|---------------------|
| campfire_v1 | `axe_001` | Boot | ✅ Yes (BootWorld:74) |
| campfire_v1 | `logpile_001` | Boot | ✅ Yes (BootWorld:77) |
| campfire_v1 | `campfire` | Boot | ✅ Yes (BootWorld:80) |
| boy_backyard_find_slingshot | `slingshot_pickup` | Backyard | ✅ Yes (BackyardWorld:437) |
| boy_backyard_first_shots | `backyard_target` | Backyard | ✅ Yes (BackyardWorld:468) |
| girl_backyard_find_multitool | `multitool_pickup` | Backyard | ✅ Yes (BackyardWorld:477) |
| girl_backyard_carve_token | `carve_station` | Backyard | ✅ Yes (BackyardWorld:486) |
| boy_woodline_find_flint | `flint_pickup` | Woodline | ✅ Yes (WoodlineWorld:169) |
| boy_woodline_spark_fire | `campfire` | Woodline | ✅ Yes (WoodlineWorld:161) |
| girl_woodline_find_fieldguide | `fieldguide_pickup` | Woodline | ✅ Yes (WoodlineWorld:178) |
| girl_woodline_bowdrill_fire | `bowdrill_station` | Woodline | ✅ Yes (WoodlineWorld:187) |

**Verdict:** ✅ **All targetIds currently match world interactables**

**HOWEVER:** ❌ **No build-time validation exists** - easy to break in future

---

### 5.2 TargetId Usage Patterns

**Searched:** `targetId` (20+ matches)

**Key References:**
1. **TaskSystem.getCurrentTargetId()** ([TaskSystem.ts:29](../../../src/game/systems/tasks/TaskSystem.ts#L29))
   - Returns current step's targetId or null
   
2. **TaskSystem.canInteract(targetId)** ([TaskSystem.ts:43](../../../src/game/systems/tasks/TaskSystem.ts#L43))
   - Validates targetId matches current step
   
3. **InteractionSystem** ([InteractionSystem.ts:51,55,78](../../../src/game/systems/interactions/InteractionSystem.ts))
   - Gets targetId, finds interactable by ID
   
4. **WakeRadius** ([wakeRadius.ts:45,49](../../../src/game/systems/interactions/wakeRadius.ts#L45))
   - Checks if wakeable.id matches task targetId
   
5. **Companion** ([Companion.ts:323,331,362](../../../src/game/entities/companion/Companion.ts))
   - Stores targetId for LeadToTarget state
   
6. **Event Emission:**
   - BackyardWorld: COMMENTED OUT (lines 571, 602, 633)
   - WoodlineWorld: ACTIVE (lines 258, 336, 371) - `eventBus.emit({ type: 'interaction/complete', targetId })`

---

## 6. Magic Strings List

### 6.1 Interactable IDs (Hardcoded)

**BootWorld:**
- `'axe_001'`
- `'logpile_001'`
- `'campfire'`

**BackyardWorld:**
- `'slingshot_pickup'`
- `'backyard_target'`
- `'multitool_pickup'`
- `'carve_station'`
- `'backyard_gate'`

**WoodlineWorld:**
- `'campfire'` (reused ID)
- `'flint_pickup'`
- `'fieldguide_pickup'`
- `'bowdrill_station'`

**Total:** 12 unique hardcoded IDs

---

### 6.2 Model Paths (Hardcoded in Code)

**Directly in Worlds:**
- `'assets/models/Summergrass.glb'` (BackyardWorld:94)
- `'assets/models/House.glb'` (BackyardWorld:167)
- `'assets/models/TreesBushes.glb'` (BackyardWorld:190, WoodlineWorld:94)
- `'assets/models/Slingshot.glb'` (BackyardWorld:434)

**Via MODELS Manifest:**
- `MODELS.dog` → 'assets/models/Dog.glb'
- `MODELS[roleId]` → 'assets/models/Boy.glb' | 'assets/models/Girl.glb'

**Recommendation:** ✅ Use MODELS manifest consistently - avoid inline paths

---

### 6.3 Area IDs

**Defined:** [areas.ts:6](../../../src/game/content/areas.ts#L6)
```typescript
export type AreaId = 'backyard' | 'woodline';
```

**Usage:**
- GameApp world selection (GameApp.ts:169-177)
- Gate transition: `eventBus.emit({ type: 'game/areaRequest', areaId: 'woodline' })`
- sessionFacade.setArea(areaId)

---

### 6.4 Task IDs

**Defined:** [tasks.ts:160-170](../../../src/game/content/tasks.ts#L160-L170)

All task IDs are keys in `TASKS_BY_ID` object:
- `campfire_v1`
- `boy_backyard_find_slingshot`
- `boy_backyard_first_shots`
- `girl_backyard_find_multitool`
- `girl_backyard_carve_token`
- `boy_woodline_find_flint`
- `boy_woodline_spark_fire`
- `girl_woodline_find_fieldguide`
- `girl_woodline_bowdrill_fire`

---

### 6.5 Magic Numbers

**BackyardWorld:**
- Ground size: 80x80 (line 82)
- Grass grid: 6x6, spacing 13, offset -40 (line 105)
- House position: (0, 0, 32) (line 170)
- Tree positions array (lines 183-188)
- Fence boundary: 60x60 (lines 388-420)
- Interactable positions (all hardcoded Vector3)

**WoodlineWorld:**
- Ground size: 70x70 (line 66)
- Clearing radius: 8 (line 74)
- Tree positions array (lines 83-90)
- Interactable positions (all hardcoded Vector3)

**BootWorld:**
- Ground size: 60x60 (line 60)
- Interactable positions (all hardcoded Vector3)

---

## 7. Search Results

### 7.1 TODO/FIXME in Worlds

**7 matches:**
1. [ForestWorld.ts:14](../../../src/game/worlds/forest/ForestWorld.ts#L14) - Load forest assets
2. [ForestWorld.ts:19](../../../src/game/worlds/forest/ForestWorld.ts#L19) - Cleanup forest resources
3. [BackyardWorld.ts:571](../../../src/game/worlds/backyard/BackyardWorld.ts#L571) - Add to AppEvent type
4. [BackyardWorld.ts:602](../../../src/game/worlds/backyard/BackyardWorld.ts#L602) - Add to AppEvent type
5. [BackyardWorld.ts:633](../../../src/game/worlds/backyard/BackyardWorld.ts#L633) - Add to AppEvent type
6. [BeachWorld.ts:14](../../../src/game/worlds/beach/BeachWorld.ts#L14) - Load beach assets
7. [BeachWorld.ts:19](../../../src/game/worlds/beach/BeachWorld.ts#L19) - Cleanup beach resources

### 7.2 TODO/FIXME in Entities

**4 matches:**
1. [NPC.ts:6](../../../src/game/entities/npc/NPC.ts#L6) - Implement NPCs
2. [Tent.ts:15](../../../src/game/entities/props/Tent.ts#L15) - Trigger tent interior
3. [animations.ts:19](../../../src/game/entities/player/animations.ts#L19) - Play animation on mesh
4. [fsm.ts:20](../../../src/game/entities/companion/fsm.ts#L20) - State transitions

### 7.3 TODO/FIXME in Interactions

**1 match:**
1. [prompts.ts:18](../../../src/game/systems/interactions/prompts.ts#L18) - Trigger sparkle effect

### 7.4 MeshBuilder.Create Usage

**20+ matches** - All worlds create geometry:
- CreateGround (all worlds)
- CreateBox (interactables, fences, workbenches)
- CreateCylinder (targets, ropes, flames)
- CreateTorus (campfire rings, tires)
- CreateDisc (clearing in WoodlineWorld)
- CreateSphere (Companion placeholder)
- CreateCapsule (Player placeholder)

### 7.5 scene.getMeshByName Usage

**0 matches** - No direct mesh lookups by name. Worlds store references to created meshes.

---

## 8. Recommendations

### 8.1 Critical (Security/Stability)

1. **✅ Implement targetId Validation**
   - Build-time check: Ensure all task.steps[].targetId exist in corresponding world interactables
   - Runtime check: Log warning if TaskSystem receives targetId not in InteractionSystem registry
   - **Suggested file:** `tools/validate-assets.mjs` or new `tools/validate-tasks.mjs`

2. **⚠️ Centralize Interactable IDs**
   - Create `src/game/content/interactableIds.ts`:
   ```typescript
   export const INTERACTABLE_IDS = {
     BOOT: {
       AXE: 'axe_001',
       LOGPILE: 'logpile_001',
       CAMPFIRE: 'campfire',
     },
     BACKYARD: {
       SLINGSHOT: 'slingshot_pickup',
       TARGET: 'backyard_target',
       MULTITOOL: 'multitool_pickup',
       CARVE_STATION: 'carve_station',
       GATE: 'backyard_gate',
     },
     WOODLINE: {
       CAMPFIRE: 'campfire',
       FLINT: 'flint_pickup',
       FIELDGUIDE: 'fieldguide_pickup',
       BOWDRILL: 'bowdrill_station',
     },
   };
   ```
   - Replace all hardcoded IDs in worlds/tasks with constants

3. **⚠️ Handle Girl.glb Missing Model**
   - Add Girl.glb to manifest.json OR
   - Reuse Boy.glb with different material/color OR
   - Add clear "Girl model not yet implemented" warning

---

### 8.2 High Priority (Architecture)

4. **Standardize Model Loading**
   - All model paths should go through MODELS manifest (not inline strings)
   - Add MODELS.summergrass, MODELS.house, MODELS.treesbushes to manifest

5. **Activate Event Emission**
   - BackyardWorld has 3 commented-out `interaction/complete` events (lines 571, 602, 633)
   - Either add to AppEvent type and emit, or remove commented code
   - WoodlineWorld emits these events - standardize

6. **Extract Magic Numbers to Config**
   - Create `src/game/worlds/backyard/config.ts`:
   ```typescript
   export const BACKYARD_CONFIG = {
     GROUND_SIZE: 80,
     GRASS_GRID: { rows: 6, cols: 6, spacing: 13, offset: -40 },
     HOUSE_POS: { x: 0, y: 0, z: 32 },
     TREE_POSITIONS: [...],
   };
   ```
   - Same for WoodlineWorld and BootWorld

7. **Dynamic Interactable Registry**
   - BackyardWorld has `registerDynamic()` callback for async-loaded interactables
   - WoodlineWorld does NOT - add it for consistency
   - Document pattern in worlds/README.md

---

### 8.3 Medium Priority (Quality)

8. **Complete Stub Worlds**
   - ForestWorld and BeachWorld are empty shells
   - Either implement or remove from codebase
   - Remove TODO comments if not planned for near-term

9. **WorldManager Usage**
   - WorldManager exists but is unused - GameApp creates worlds directly
   - Either use WorldManager OR remove it (dead code)

10. **Implement Missing Entities**
    - NPC.ts is a stub (TODO at line 6)
    - Tent.ts exists but unused in any world
    - Either implement or document as future work

11. **Animation Validation**
    - Player/Companion warn if no animations found
    - Add validation: Check if expected animations exist in GLB
    - Document required animation names in model export guide

---

### 8.4 Low Priority (Polish)

12. **Consolidate Interactable Factories**
    - createPickupInteractable, createTargetInteractable, createWorkbenchInteractable, createGateInteractable
    - Duplicated between BackyardWorld and WoodlineWorld
    - Extract to `src/game/worlds/shared/interactables.ts`

13. **Sparkle Effect**
    - prompts.ts has TODO for sparkle effect (line 18)
    - Implement or remove TODO

14. **Companion FSM Documentation**
    - fsm.ts has TODO for state transitions (line 20)
    - Document FSM state machine diagram

15. **Player Animation System**
    - animations.ts has TODO "Play animation on mesh" (line 19)
    - Implement animation playback or remove placeholder

---

## 9. Architecture Diagram

```
GameApp (GameApp.ts)
  ├─> World Selection (areaId)
  │     ├─> BootWorld (dev fallback)
  │     ├─> BackyardWorld (backyard area)
  │     └─> WoodlineWorld (woodline area)
  │
  ├─> Entity Creation
  │     ├─> Player (roleId → Boy.glb/Girl.glb)
  │     │     └─> PlayerController (touch-to-move)
  │     ├─> Companion (Dog.glb)
  │     │     └─> FSM (FollowPlayer, LeadToTarget, etc.)
  │     └─> Props (Axe, LogPile, Campfire, etc.)
  │
  ├─> Interaction Systems
  │     ├─> WakeRadiusSystem (R_IN=6, R_OUT=8, TASK_R_IN=14)
  │     │     └─> Wakeables (interactables with sleep/wake)
  │     ├─> InteractionSystem (dwell-based, 500ms)
  │     │     ├─> Task target priority
  │     │     └─> Always-active fallback (gates)
  │     └─> PromptManager (icons, haptics)
  │
  └─> Task System
        ├─> TaskSystem (getCurrentTargetId, canInteract)
        │     └─> tasks.ts (targetId → interactable ID)
        └─> ProgressionSystem (area/role task chains)
              └─> areas.ts (tasksByRole)
```

---

## 10. Data Flow: Task → Interactable

```
1. UI/Session selects roleId + areaId
   └─> GameHost passes to GameApp

2. GameApp creates world (BackyardWorld)
   ├─> Spawns interactables with IDs
   │     └─> slingshot_pickup, backyard_target, etc.
   └─> Registers interactables with InteractionSystem

3. TaskSystem loads tasks from areas.ts
   └─> AREAS[areaId].tasksByRole[roleId]
   └─> tasks.ts: boy_backyard_find_slingshot
         └─> step[0].targetId = 'slingshot_pickup'

4. InteractionSystem.update(playerPos, dt)
   ├─> Gets targetId from TaskSystem.getCurrentTargetId()
   │     └─> 'slingshot_pickup'
   ├─> Finds interactable by ID match
   │     └─> interactables.find(i => i.id === 'slingshot_pickup')
   └─> If within 3.0 radius:
         ├─> Accumulate dwell
         ├─> Show prompt (hand/axe/fire icon)
         └─> Auto-interact at 500ms

5. Interact triggered
   ├─> interactable.interact() (mesh.setEnabled(false))
   ├─> TaskSystem.completeCurrentStep()
   ├─> Emit 'game/interact' for SFX
   └─> eventBus.emit({ type: 'interaction/complete', targetId })
```

**Critical Link:** `task.steps[].targetId` (string) **MUST MATCH** `interactable.id` (string)
- ❌ No compile-time check
- ❌ No runtime validation
- ✅ Currently all match (manually verified)

---

## 11. Summary

**Strengths:**
- ✅ Interaction system is well-designed (WakeRadius + Dwell)
- ✅ Clean separation: worlds create interactables, TaskSystem drives flow
- ✅ Entity loading is async-first with placeholders (good UX)
- ✅ All current targetIds match world interactables

**Weaknesses:**
- ❌ No targetId validation (major future-proofing gap)
- ❌ 30+ hardcoded magic strings across worlds/tasks
- ❌ Model paths duplicated (inline strings vs manifest)
- ❌ Girl.glb missing from manifest (placeholder fallback)
- ❌ Stub worlds (Forest/Beach) with TODO comments
- ❌ Inconsistent event emission (Backyard commented out, Woodline active)

**Next Steps:**
1. Implement targetId validation tool
2. Centralize interactable IDs to constants
3. Add Girl.glb to manifest OR document intentional placeholder
4. Extract magic numbers to config files
5. Standardize model loading (all via MODELS)

---

**End of Report**
