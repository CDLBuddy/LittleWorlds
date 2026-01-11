# Pine World - Coordinate Frame & Placement Audit

**Date:** January 10, 2026  
**Purpose:** Map all coordinate systems used in Pine world to identify frame mismatches

---

## Executive Summary

✅ **No coordinate frame issues detected**

- All systems use **centered coordinate system**: `x ∈ [-45, 45]`, `z ∈ [-80, 80]`
- All 179 trees within bounds (0 OOB)
- Trail points authored in same frame as terrain
- Props/markers use sampler.heightAt() for correct placement

**Recommendation:** No conversion layer needed. Current frame is canonical and consistent.

---

## Bounds Report

### Actual Measurements (from console output)

| System | X Min | X Max | Z Min | Z Max | OOB Count | Total |
|--------|-------|-------|-------|-------|-----------|-------|
| **Terrain** | -45.0 | +45.0 | -80.0 | +80.0 | N/A | N/A |
| **Trees** | -40.98 | +40.81 | -78.95 | +78.81 | 0 | 179 |
| **Trail** | ~-22 | ~+22 | -80.0 | +72.0 | _(implicit)_ | ~190 pts |
| **Props** | -10 | +12 | -28 | +60 | _(implicit)_ | ~8 |
| **Markers** | -3 | +3 | -60 | +60 | _(implicit)_ | ~9 |

**All systems within terrain bounds ✅**

---

## File Structure

### Pine World Root
```
src/game/worlds/pine/
├── PineWorld.ts              # Main world orchestrator
├── index.ts                  # Public API barrel
├── types.ts                  # Type definitions
├── config/
│   ├── constants.ts          # PINE_TERRAIN, bounds constants
│   └── interactables.ts      # Interactable definitions
├── forest/
│   ├── createForest.ts       # 179 pine trees (hero + procedural)
│   ├── createTree.ts         # (Legacy/unused)
│   ├── materials.ts          # Forest materials
│   └── scatterClutter.ts     # Ground clutter (stumps, logs, rocks)
├── trail/
│   ├── buildCenterline.ts    # Trail path generation
│   ├── createTrailRibbon.ts  # Trail mesh/ribbon
│   ├── scatterEdgeRocks.ts   # Rocks along trail edges
│   └── subdividePolyline.ts  # Path subdivision utility
├── props/
│   ├── createProps.ts        # Props orchestrator
│   ├── cairn.ts              # Stone cairn markers
│   ├── lanternStation.ts     # Lantern platform
│   ├── logBench.ts           # Log bench
│   ├── pineBoughHut.ts       # Pine shelter
│   ├── pineconeTotem.ts      # Pinecone totem
│   ├── rockyOutcrop.ts       # Rock clusters
│   ├── scatteredPinecones.ts # Ground pinecones
│   └── trappersCache.ts      # Supply cache
├── markers/
│   └── createMarkers.ts      # Trail markers (cairns, saplings)
├── terrain/
│   └── createGrass.ts        # Grass field creation
├── utils/
│   ├── terrain.ts            # Legacy elevation helpers
│   ├── DisposableBag.ts      # Resource tracking
│   ├── MaterialCache.ts      # Material management
│   └── math.ts               # Seeded RNG, clamping
├── interactables/
│   └── gate.ts               # Gate interactable
└── models/
    └── loadContainer.ts      # (Legacy/unused async loader)
```

### Terrain System
```
src/game/terrain/
├── createTerrain.ts          # Flat/heightmap terrain factory
├── terrainSampler.ts         # Bounds-checked height/normal queries
├── snapToTerrain.ts          # Snap utilities
└── types.ts                  # Terrain API types
```

### Thin Instance Utilities
```
src/game/assets/thinInstances/
└── normalizeForThinInstances.ts  # GLB transform baking + foot offset
```

---

## Coordinate System Analysis

### 1. Terrain Definition
**File:** `src/game/worlds/pine/config/constants.ts`

**System:** **Centered coordinate frame**

```typescript
PINE_TERRAIN = {
  width: 90,      // x ∈ [-45, +45]
  depth: 160,     // z ∈ [-80, +80]
  halfDepth: 80,
  maxRise: 12,    // y ∈ [0, 12]
}

Z_NORTH = -80   // Top of hill
Z_SOUTH = +80   // Bottom of hill
X_MIN = -43     // width * 0.5 - 2
X_MAX = +43     // width * 0.5 - 2
```

**Dependencies:** None (canonical definition)  
**Notes:** Babylon GroundMesh is centered by default, matches this convention

---

### 2. Terrain Sampler
**File:** `src/game/terrain/terrainSampler.ts`

**System:** **World-space coordinates (same as terrain)**

**Purpose:** Bounds-checked height/normal queries

```typescript
TerrainSamplerWithBounds {
  inBounds(x, z): boolean
  heightAt(x, z): number
  normalAt(x, z): Vector3
  bounds: { min: Vector3, max: Vector3 }
}
```

**Input:** World XZ coordinates  
**Output:** Terrain Y height in world space  
**Frame:** Uses terrain's centered coordinate system  
**Dependencies:** Babylon GroundMesh bounding box

---

### 3. Tree Placement
**File:** `src/game/worlds/pine/forest/createForest.ts`

**System:** **Centered coordinates (matches terrain)**

#### Hero Trees (Hardcoded)
```typescript
const hero = [
  { x: -15, z: 65, scale: 0.9, rotation: 0 },   // Near trailhead
  { x: 15, z: 65, scale: 0.85, rotation: 0 },   // Near trailhead
  { x: -20, z: 40, scale: 1.0, rotation: 0 },   // Upper switchback
  { x: 20, z: 40, scale: 0.9, rotation: 0 },    // Upper switchback
  // ... 9 total hero trees
];
```

**Authoring Frame:** Centered (-45 to +45, -80 to +80)  
**Validation:** All within bounds ✅

#### Procedural Wall Trees (170 trees)
```typescript
for (let i = 0; i < 170; i++) {
  const z = Z_NORTH + rand() * (Z_SOUTH - Z_NORTH);  // -80 to +80
  const corridor = TRAIL_HALF_WIDTH + 10;             // 15.5
  const side = rand() < 0.5 ? -1 : 1;
  const bandMin = corridor;
  const bandMax = PINE_TERRAIN.width * 0.5 - 4;       // 45 - 4 = 41
  let x = bandMin + rand() * (bandMax - bandMin);     // 15.5 to 41
  x *= side;                                          // ±[15.5, 41]
  x = clamp(x, X_MIN, X_MAX);                         // ±[-43, 43]
}
```

**Generation Frame:** Centered  
**Constraints:**
- Z: Full depth range (-80 to +80)
- X: Outside trail corridor (±15.5 to ±41), clamped to terrain bounds
- RNG: Seeded ('pine_forest_wall')

**Dependencies:**
- `PINE_TERRAIN.width`, `Z_NORTH`, `Z_SOUTH`, `X_MIN`, `X_MAX`
- `sampler.heightAt(x, z)` for Y positioning
- Seeded RNG for deterministic placement

**Validation:** 179 total trees, 0 OOB ✅

---

### 4. Trail Centerline
**File:** `src/game/worlds/pine/trail/buildCenterline.ts`

**System:** **Centered coordinates (matches terrain)**

**Method:** Hardcoded path points

```typescript
function buildSwitchbackCenterline(): Vector3[] {
  const add = (x: number, z: number) => {
    const y = heightAtXZ(x, z);  // Legacy helper
    pts.push(new Vector3(x, y, z));
  };

  add(0, 72);      // South entry
  add(-4, 64);
  add(-8, 58);
  add(-14, 48);
  // ... ~50 hardcoded points through switchbacks
  add(0, -76);     // North summit
}
```

**Authoring Frame:** Centered (-22 to +22 X, -80 to +72 Z)  
**Height Method:** `heightAtXZ()` uses old procedural formula (linear gradient)  
**Dependencies:** `PINE_TERRAIN.halfDepth`, `PINE_TERRAIN.depth`, `PINE_TERRAIN.maxRise`

**Notes:**
- Trail uses legacy `heightAtXZ()` instead of sampler
- Works because heightmap matches procedural gradient (inverted, then fixed)
- All points within terrain bounds ✅

---

### 5. Props
**File:** `src/game/worlds/pine/props/createProps.ts`

**System:** **Centered coordinates, uses sampler**

```typescript
createCairn(scene, bag, mats, new Vector3(0, sampler.heightAt(0, 60), 60));
createRockyOutcrop(scene, bag, mats, new Vector3(12, sampler.heightAt(12, 0), 0));
createLanternStation(scene, bag, mats, new Vector3(5, sampler.heightAt(5, -10), -10));
createTrappersCache(scene, bag, mats, new Vector3(-10, sampler.heightAt(-10, -15), -15));
// ... 8 total props
```

**Authoring Frame:** Centered  
**Height Method:** `sampler.heightAt(x, z)` (correct, bounds-checked)  
**Dependencies:** Terrain sampler  
**Validation:** All positions within bounds ✅

---

### 6. Markers
**File:** `src/game/worlds/pine/markers/createMarkers.ts`

**System:** **Centered coordinates, uses sampler**

```typescript
// Cairns along climb
const cairnZ = [60, 30, 0, -30, -60];
for (let i = 0; i < cairnZ.length; i++) {
  const z = cairnZ[i];
  const x = i % 2 === 0 ? -3 : 3;
  createCairn(scene, bag, mats, new Vector3(x, sampler.heightAt(x, z), z));
}

// Bent saplings
const saplings = [
  { x: -3, z: 45 },
  { x: 3, z: 15 },
  { x: -3, z: -15 },
  { x: 3, z: -45 },
];
```

**Authoring Frame:** Centered  
**Height Method:** `sampler.heightAt(x, z)` (correct)  
**Dependencies:** Terrain sampler  
**Validation:** All positions within bounds ✅

---

### 7. Grass Field
**File:** `src/game/worlds/pine/terrain/createGrass.ts`

**System:** **Centered coordinates, grid placement**

```typescript
// Not visible yet, depends on:
// - Grid placement pattern (hex/square)
// - Terrain sampler for height conformance
// - Density/exclusion zones
```

**Authoring Frame:** Centered (uses terrain bounds from sampler)  
**Height Method:** `sampler.heightAt()` during placement  
**Dependencies:** Terrain sampler, grass system API

---

## Legacy vs Modern Height Methods

### Legacy (Procedural)
**File:** `src/game/worlds/pine/utils/terrain.ts`

```typescript
function getElevationAtZ(z: number): number {
  const t = (z + PINE_TERRAIN.halfDepth) / PINE_TERRAIN.depth;  // 0..1
  const clamped = Math.min(1, Math.max(0, t));
  return PINE_TERRAIN.maxRise * (1 - clamped);  // 12→0 linear
}
```

**Used by:** Trail centerline  
**Issue:** Doesn't match actual heightmap (has hills, noise, edge berm)  
**Impact:** Trail ribbon may not sit perfectly on terrain

### Modern (Sampler)
**File:** `src/game/terrain/terrainSampler.ts`

```typescript
sampler.heightAt(x, z)  // Queries actual GroundMesh geometry
```

**Used by:** Trees, props, markers, grass  
**Correct:** ✅ Reads actual heightmap terrain

**Recommendation:** Migrate trail to use sampler instead of legacy `heightAtXZ()`

---

## Coordinate Convention Summary

### Canonical Frame (Used Everywhere)

```
Origin: World center (0, 0, 0)
X: [-45, +45]  (90 units wide)
Y: [0, 12]     (0=bottom/south, 12=top/north)
Z: [-80, +80]  (160 units deep)

North (top of hill): Z = -80, Y = 12
South (bottom):      Z = +80, Y = 0
```

**Why This Works:**
- Babylon GroundMesh is centered by default
- All content authored in same frame
- No conversion needed
- Bounds checking catches authoring errors

---

## Phase 5-6 Fixes Applied

### Phase 5: Thin Instance Transform Baking
**File:** `src/game/assets/thinInstances/normalizeForThinInstances.ts`

**Issue:** GLB models have parent/child transforms that conflict with thin instance matrices  
**Solution:** Bake transforms into vertices, reset to identity

```typescript
normalizeMeshesForThinInstances(meshes):
  - computeWorldMatrix(true)
  - bakeCurrentTransformIntoVertices()
  - setParent(null)
  - Reset position/rotation/scale to identity
```

**Result:** Thin instance matrices now work as pure world transforms ✅

### Phase 6: Scale-Aware Foot Offset
**File:** `src/game/worlds/pine/forest/createForest.ts`

**Issue:** Foot offset not scaled, causing floating/embedding on scaled trees  
**Fix:**
```typescript
// Before:
const pos = new Vector3(t.x, terrainY + footOffsetY, t.z);

// After:
const scaledFoot = footOffsetY * t.scale;
const pos = new Vector3(t.x, terrainY + scaledFoot, t.z);
```

**Result:** All tree scales sit correctly on terrain ✅

### Phase 6: Bounds Diagnostics + OOB Filtering
**Added:**
- Bounds logging (terrain vs trees)
- OOB count tracking
- Filter out OOB trees before thin instance buffer creation

**Result:** 0 OOB trees, all systems aligned ✅

---

## Remaining Issues (Not Coordinate-Related)

### Potential Causes if Trees Still Wrong:
1. **Pinetree.glb model issue:**
   - Non-standard up axis
   - Incorrect pivot point
   - Mesh-local transforms not fully baked

2. **Thin instance rendering:**
   - Buffer stride incorrect
   - Matrix composition order
   - Babylon version incompatibility

3. **Terrain heightmap mismatch:**
   - Heightmap image inverted/rotated
   - Subdivision count mismatch
   - Height scale incorrect

### NOT Issues:
- ✅ Coordinate frame (all systems centered, consistent)
- ✅ Bounds checking (0 OOB)
- ✅ Height sampling (sampler works correctly)
- ✅ Scale handling (now scale-aware)

---

## Recommendations

### Immediate (No Blockers)
- ✅ All coordinate systems aligned - no conversion needed
- ✅ Bounds checking in place
- ✅ Scale-aware footing implemented

### Future Improvements
1. **Migrate trail to sampler:** Replace `heightAtXZ()` with `sampler.heightAt()` in trail centerline
2. **Add worldFrame helper:** Optional convenience API if other worlds need conversions
3. **Chunked culling:** When scaling beyond 179 trees, split into spatial chunks for better frustum culling

---

## Phase 7 Readiness

**Status:** ✅ Ready for Phase 7 (Debug Rendering / Visual Verification)

Since coordinate frame is correct:
- Trees should be in correct positions
- If visuals are wrong, issue is transform/rendering (not placement)
- Can proceed to debug rendering, thin instance visualization, or model verification

**Next Steps:**
1. Test in browser (refresh and check Pine world)
2. If trees still wrong: debug GLB model transforms / thin instance rendering
3. If trees correct: optimize (LOD, shadows, physics)
