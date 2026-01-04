# Spawn System Audit

**Date:** January 3, 2026  
**Purpose:** Full mapping of current spawn behavior across all worlds to support gate-based spawning refactor

---

## Executive Summary

### Current Architecture
- **Spawn Logic:** Currently uses `fromArea` branching in each world
- **Gate Interaction:** Emits `game/areaRequest` event with only `areaId` (no gate info)
- **Transition Pipeline:** `GameApp.onAreaRequest()` → `sessionFacade.setArea(areaId, fromArea)` → GameHost remount → world factory receives `fromArea`
- **Player Offset:** Inactive player offset is hardcoded as `+Vector3(2, 0, 0)` (always right, regardless of facing)
- **Companion Spawn:** Generally relative to player (`spawnPos + Vector3(3, 0, 2)`) but some worlds hardcode positions
- **Rotation:** No yaw/rotation applied on spawn - players always face default forward

### Key Issues
1. **No fromGateId tracking:** Cannot distinguish which specific gate was used
2. **Duplicated spawn logic:** Each world has `if (fromArea === ...)` blocks
3. **Wrong facing:** Players spawn facing default direction, not into the world
4. **Wrong inactive offset:** Always offset by `(2, 0, 0)` regardless of spawn forward direction
5. **Gate position drift:** Gate positions and spawn positions are separate numbers that can drift

---

## Transition Pipeline

### Current Flow
```
[Gate Interaction]
  ↓
  emit({ type: 'game/areaRequest', areaId: targetArea })
  ↓
[GameApp.onAreaRequest(areaId)]
  ↓
  const currentArea = sessionFacade.getSession().areaId
  sessionFacade.setArea(areaId, currentArea) // Sets fromArea
  ↓
[GameHost remount (React)]
  ↓
  Reads session: { areaId, fromArea, roleId }
  ↓
[new GameApp(canvas, eventBus, { areaId, fromArea, roleId })]
  ↓
[World Factory (e.g., createBackyardWorld)]
  ↓
  Receives fromArea, does spawn branching
```

### Missing Data
- **fromGateId:** Not captured or passed
- **entryGateId:** Not computed or used
- **spawn forward:** Not passed or applied

---

## Gate Pairs Mapping

| From Gate | To Gate | Notes |
|-----------|---------|-------|
| `BACKYARD_GATE` | `WOODLINE_BACKYARD_GATE` | Backyard ↔ Woodline |
| `WOODLINE_BACKYARD_GATE` | `BACKYARD_GATE` | Woodline ↔ Backyard |
| `WOODLINE_CREEK_GATE` | `CREEK_WOODLINE_GATE` | Woodline ↔ Creek |
| `CREEK_WOODLINE_GATE` | `WOODLINE_CREEK_GATE` | Creek ↔ Woodline |
| `CREEK_PINE_GATE` | `PINE_CREEK_GATE` | Creek ↔ Pine |
| `PINE_CREEK_GATE` | `CREEK_PINE_GATE` | Pine ↔ Creek |
| `PINE_DUSK_GATE` | `DUSK_PINE_GATE` | Pine ↔ Dusk |
| `DUSK_PINE_GATE` | `PINE_DUSK_GATE` | Dusk ↔ Pine |
| `DUSK_NIGHT_GATE` | `NIGHT_DUSK_GATE` | Dusk ↔ Night |
| `NIGHT_DUSK_GATE` | `DUSK_NIGHT_GATE` | Night ↔ Dusk |
| `NIGHT_BEACH_GATE` | `BEACH_NIGHT_GATE` | Night ↔ Beach |
| `BEACH_NIGHT_GATE` | `NIGHT_BEACH_GATE` | Beach ↔ Night |

**Total Gates:** 12 gate interactables (6 bidirectional pairs)

---

## World-by-World Analysis

### 1. Backyard World

**File:** [src/game/worlds/backyard/BackyardWorld.ts](../src/game/worlds/backyard/BackyardWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `BACKYARD_GATE` | `(0, 0, -30)` | woodline | Bright forest green | North fence gate |

**Current Spawn Logic:**
```typescript
let spawnPos: Vector3;
if (fromArea === 'woodline') {
  // Coming from woodline gate (north) - spawn near north gate
  spawnPos = new Vector3(0, 0, -20);
} else {
  // Default spawn (center-front near house)
  spawnPos = new Vector3(0, 0, 20);
}
```

**Spawn Positions:**
- **From Woodline:** `(0, 0, -20)` - near north gate
- **Default/New Game:** `(0, 0, 20)` - center front

**Companion:** `spawnPos + (3, 0, 2)` - relative

**Rotation:** None applied

**Proposed Gate Anchors:**
- `BACKYARD_GATE` at `(0, 0, -30)` with forward `(0, 0, 1)` (into backyard) → spawn at `(0, 0, -26)` with 4m inset

---

### 2. Woodline World

**File:** [src/game/worlds/woodline/WoodlineWorld.ts](../src/game/worlds/woodline/WoodlineWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `WOODLINE_CREEK_GATE` | `(0, 0, -25)` | creek | Brighter forest green | North clearing |
| `WOODLINE_BACKYARD_GATE` | `(0, 0, 40)` | backyard | Lighter green | South edge |

**Current Spawn Logic:**
```typescript
let spawnPos: Vector3;
if (fromArea === 'creek') {
  // Coming from creek gate (north at z=-25) - spawn near north
  spawnPos = new Vector3(0, 0, -15);
} else {
  // Coming from backyard gate (south at z=40) or default - spawn near south
  spawnPos = new Vector3(0, 0, 30);
}
```

**Spawn Positions:**
- **From Creek:** `(0, 0, -15)`
- **From Backyard / Default:** `(0, 0, 30)`

**Companion:** `spawnPos + (3, 0, 2)` - relative

**Rotation:** None applied

**Proposed Gate Anchors:**
- `WOODLINE_CREEK_GATE` at `(0, 0, -25)` with forward `(0, 0, 1)` → spawn at `(0, 0, -21)`
- `WOODLINE_BACKYARD_GATE` at `(0, 0, 40)` with forward `(0, 0, -1)` → spawn at `(0, 0, 36)`

---

### 3. Creek World

**File:** [src/game/worlds/creek/CreekWorld.ts](../src/game/worlds/creek/CreekWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `CREEK_PINE_GATE` | `(-25, 0, -65)` | pine | Pine forest brown | North gate |
| `CREEK_WOODLINE_GATE` | `(-25, 0, 65)` | woodline | Lighter forest green | South gate |

**Current Spawn Logic:**
```typescript
let spawnPos: Vector3;
if (fromArea === 'pine') {
  // Coming from north gate (forward) - spawn near north
  spawnPos = new Vector3(-25, 0, -55);
} else {
  // Coming from south gate (backward) or default - spawn near south
  spawnPos = new Vector3(-25, 0, 55);
}
```

**Spawn Positions:**
- **From Pine:** `(-25, 0, -55)`
- **From Woodline / Default:** `(-25, 0, 55)`

**Companion:** Hardcoded at `(-22, 0, 27)` - NOT relative

**Rotation:** None applied

**Proposed Gate Anchors:**
- `CREEK_PINE_GATE` at `(-25, 0, -65)` with forward `(0, 0, 1)` → spawn at `(-25, 0, -61)`
- `CREEK_WOODLINE_GATE` at `(-25, 0, 65)` with forward `(0, 0, -1)` → spawn at `(-25, 0, 61)`

---

### 4. Pine World

**File:** [src/game/worlds/pine/PineWorld.ts](../src/game/worlds/pine/PineWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `PINE_DUSK_GATE` | `atTerrain(0, -60, 4)` | dusk | Sunset orange/gold | North gate |
| `PINE_CREEK_GATE` | `atTerrain(0, 70, 4)` | creek | Creek blue-green | South gate |

**Current Spawn Logic:**
```typescript
const spawnZ = fromArea === 'dusk' ? -50 : 60;
const spawnPos = atTerrain(0, spawnZ, PINE_TERRAIN.playerYOffset);
```

**Spawn Positions:**
- **From Dusk:** `atTerrain(0, -50, playerYOffset)`
- **From Creek / Default:** `atTerrain(0, 60, playerYOffset)`

**Companion:** `atTerrain(3, spawnZ + 2, playerYOffset)` - relative to spawn

**Rotation:** None applied

**Notes:** Uses terrain-adjusted Y positioning via `atTerrain` helper

**Proposed Gate Anchors:**
- `PINE_DUSK_GATE` at `atTerrain(0, -60, 4)` with forward `(0, 0, 1)` → spawn at `atTerrain(0, -56, playerYOffset)`
- `PINE_CREEK_GATE` at `atTerrain(0, 70, 4)` with forward `(0, 0, -1)` → spawn at `atTerrain(0, 66, playerYOffset)`

---

### 5. Dusk World

**File:** [src/game/worlds/dusk/DuskWorld.ts](../src/game/worlds/dusk/DuskWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `DUSK_NIGHT_GATE` | `(0, 0, -50)` | night | Sunset gold | North gate |
| `DUSK_PINE_GATE` | `(0, 0, 52)` | pine | Pine brown | South gate |

**Current Spawn Logic:**
```typescript
let spawnPos: Vector3;
if (fromArea === 'night') {
  // Coming from north gate (forward) - spawn near north
  spawnPos = new Vector3(0, 0.9, -40);
} else {
  // Coming from south gate (backward) or default - spawn near south
  spawnPos = new Vector3(0, 0.9, 42);
}
```

**Spawn Positions:**
- **From Night:** `(0, 0.9, -40)`
- **From Pine / Default:** `(0, 0.9, 42)`

**Companion:** Hardcoded at `(3, 0.9, 44)` - NOT relative

**Rotation:** None applied

**Proposed Gate Anchors:**
- `DUSK_NIGHT_GATE` at `(0, 0, -50)` with forward `(0, 0, 1)` → spawn at `(0, 0.9, -46)`
- `DUSK_PINE_GATE` at `(0, 0, 52)` with forward `(0, 0, -1)` → spawn at `(0, 0.9, 48)`

---

### 6. Night World

**File:** [src/game/worlds/night/NightWorld.ts](../src/game/worlds/night/NightWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `NIGHT_BEACH_GATE` | `(0, 0.5, -45)` | beach | Starlight silver | North gate |
| `NIGHT_DUSK_GATE` | `(0, 0.5, 47)` | dusk | Dusk gold | South gate |

**Current Spawn Logic:**
```typescript
let spawnPos: Vector3;
if (fromArea === 'beach') {
  // Coming from north gate (forward) - spawn near north
  spawnPos = new Vector3(0, 0.9, -35);
} else {
  // Coming from south gate (backward) or default - spawn near south
  spawnPos = new Vector3(0, 0.9, 37);
}
```

**Spawn Positions:**
- **From Beach:** `(0, 0.9, -35)`
- **From Dusk / Default:** `(0, 0.9, 37)`

**Companion:** `spawnPos + (3, 0, 2)` - relative

**Rotation:** None applied

**Proposed Gate Anchors:**
- `NIGHT_BEACH_GATE` at `(0, 0.5, -45)` with forward `(0, 0, 1)` → spawn at `(0, 0.9, -41)`
- `NIGHT_DUSK_GATE` at `(0, 0.5, 47)` with forward `(0, 0, -1)` → spawn at `(0, 0.9, 43)`

---

### 7. Beach World

**File:** [src/game/worlds/beach/BeachWorld.ts](../src/game/worlds/beach/BeachWorld.ts)

**Gates Created:**
| Gate ID | Position | Target Area | Color | Notes |
|---------|----------|-------------|-------|-------|
| `BEACH_NIGHT_GATE` | `(0, 0.5, 37)` | night | Night indigo | South gate (only entry) |

**Current Spawn Logic:**
```typescript
const spawnPos = new Vector3(0, 0.9, 27); // Beach only has one entry from Night (near south gate at z=37)
```

**Spawn Positions:**
- **Fixed:** `(0, 0.9, 27)` - no branching, only one entry

**Companion:** Hardcoded at `(3, 0.9, 29)` - NOT relative

**Rotation:** None applied

**Notes:** Beach is terminal world with only one entry point

**Proposed Gate Anchors:**
- `BEACH_NIGHT_GATE` at `(0, 0.5, 37)` with forward `(0, 0, -1)` → spawn at `(0, 0.9, 33)`
- Default spawn (new game, if ever used) could be same position

---

## Common Patterns

### Spawn Logic Pattern
```typescript
let spawnPos: Vector3;
if (fromArea === 'sourceWorld') {
  spawnPos = new Vector3(...); // Near entry gate
} else {
  spawnPos = new Vector3(...); // Default or opposite gate
}
```

### Gate Creation Pattern
```typescript
const gate = createGateInteractable(
  scene,
  INTERACTABLE_ID.XXX_GATE,
  position,      // Gate position
  color,         // Visual color
  eventBus,
  targetArea     // Destination area string
);
```

### Gate Interaction
```typescript
interact: () => {
  console.log(`[World] Gate ${id} activated → ${targetArea}`);
  eventBus.emit({ type: 'game/areaRequest', areaId: targetArea });
}
```

**Missing:** No `fromGateId` passed in event

---

## Issues & Gaps

### 1. No Gate ID Tracking
- **Issue:** `game/areaRequest` event only passes `areaId`
- **Impact:** Cannot distinguish which gate was used
- **Fix:** Add `fromGateId` to event payload

### 2. Duplicated Spawn Logic
- **Issue:** Each world has its own spawn branching
- **Impact:** Maintenance burden, potential drift
- **Fix:** Centralize in `spawnRegistry.ts`

### 3. No Rotation Applied
- **Issue:** Players always face default direction after spawn
- **Impact:** Disorienting, may face back toward gate
- **Fix:** Apply yaw derived from spawn forward vector

### 4. Wrong Inactive Player Offset
- **Issue:** Always offset by `(2, 0, 0)` regardless of forward direction
- **Impact:** Inactive player appears in wrong location relative to facing
- **Fix:** Compute local right from forward: `right = forward × up`, offset by `right * 2`

### 5. Gate Position Drift
- **Issue:** Gate positions and spawn positions are separate constants
- **Impact:** Can drift over time during edits
- **Fix:** Compute spawn from gate anchor + inset

### 6. Inconsistent Companion Spawn
- **Issue:** Some worlds use relative spawn, others hardcode
- **Impact:** Inconsistent behavior
- **Fix:** Standardize to relative spawn in all worlds

---

## Refactor Target State

### New Flow
```
[Gate Interaction]
  ↓
  emit({ 
    type: 'game/areaRequest', 
    areaId: targetArea,
    fromArea: currentArea,
    fromGateId: gateInteractableId  // NEW
  })
  ↓
[GameApp.onAreaRequest]
  ↓
  entryGateId = GATE_PAIR[fromGateId]  // NEW
  setPendingSpawn({ toArea: areaId, entryGateId })  // NEW
  sessionFacade.setArea(areaId, fromArea)
  ↓
[World Factory]
  ↓
  const pending = consumePendingSpawn()  // NEW
  const spawn = getSpawnForWorld(areaId, pending?.entryGateId)  // NEW
  createWorldPlayers(scene, spawn, roleId)  // spawn: SpawnPoint { position, forward }
```

### New Helper Signature
```typescript
interface SpawnPoint {
  position: Vector3;
  forward: Vector3;  // Normalized direction into world
}

function createWorldPlayers(
  scene: Scene,
  spawn: SpawnPoint,  // Changed from Vector3
  roleId: RoleId
): WorldPlayers
```

### New Registry
```typescript
interface GateAnchor {
  position: Vector3;
  forwardIntoWorld: Vector3;  // Direction into the world
  spawnInset?: number;  // Default: 4
}

interface WorldSpawnConfig {
  defaultSpawn: SpawnPoint;
  gateAnchors: Record<InteractableId, GateAnchor>;
}

function getSpawnForWorld(
  worldId: AreaId, 
  entryGateId?: InteractableId
): SpawnPoint {
  // Return computed spawn from gate anchor or default
}
```

---

## Implementation Order

1. **Phase 0:** ✅ Discovery complete (this document)
2. **Phase 1:** Add `gatePairs.ts`, `spawnState.ts`, extend event payload
3. **Phase 2:** Update `createWorldPlayers` to accept `SpawnPoint`, apply yaw, fix offset
4. **Phase 3:** Create `spawnRegistry.ts`, source anchors from gate definitions
5. **Phase 4:** Update all worlds to use registry, remove `fromArea` branching
6. **Phase 5:** Validation, testing, verification

---

## Gate Position Reference Table

For copy-paste convenience during Phase 3:

| Gate ID | World | Position | Target Area | Forward Into World |
|---------|-------|----------|-------------|-------------------|
| `BACKYARD_GATE` | backyard | `(0, 0, -30)` | woodline | `(0, 0, -1)` north |
| `WOODLINE_BACKYARD_GATE` | woodline | `(0, 0, 40)` | backyard | `(0, 0, -1)` south |
| `WOODLINE_CREEK_GATE` | woodline | `(0, 0, -25)` | creek | `(0, 0, 1)` north |
| `CREEK_WOODLINE_GATE` | creek | `(-25, 0, 65)` | woodline | `(0, 0, -1)` south |
| `CREEK_PINE_GATE` | creek | `(-25, 0, -65)` | pine | `(0, 0, 1)` north |
| `PINE_CREEK_GATE` | pine | `atTerrain(0, 70, 4)` | creek | `(0, 0, -1)` south |
| `PINE_DUSK_GATE` | pine | `atTerrain(0, -60, 4)` | dusk | `(0, 0, 1)` north |
| `DUSK_PINE_GATE` | dusk | `(0, 0, 52)` | pine | `(0, 0, -1)` south |
| `DUSK_NIGHT_GATE` | dusk | `(0, 0, -50)` | night | `(0, 0, 1)` north |
| `NIGHT_DUSK_GATE` | night | `(0, 0.5, 47)` | dusk | `(0, 0, -1)` south |
| `NIGHT_BEACH_GATE` | night | `(0, 0.5, -45)` | beach | `(0, 0, 1)` north |
| `BEACH_NIGHT_GATE` | beach | `(0, 0.5, 37)` | night | `(0, 0, -1)` south |

---

## Notes

- All worlds currently spawn at y=0 or y=0.9 (ground level)
- Pine world uses `atTerrain` helper for terrain-adjusted Y
- No worlds currently apply rotation quaternion or euler angles on spawn
- Player controller may override initial rotation - needs verification
- Default forward direction appears to be `(0, 0, 1)` (positive Z)

---

**End of Audit**
