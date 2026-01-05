# Phase C: Grass Rollout & Lifecycle (Complete)

**Status**: ✅ **COMPLETE** (Backyard, Woodline, Creek, Pine)  
**Date**: 2025-01-10  
**Goal**: Standardize grass usage across all worlds using Phase B factory with explicit leak-safe teardown

---

## Overview

Phase C successfully standardized grass terrain across all 4 grass-enabled worlds. Each world now uses the shared factory system (`createGrassField`) with proper lifecycle management to prevent GPU/scene resource leaks during world transitions.

### Key Achievements
- ✅ All 4 worlds rolled out (Backyard, Woodline, Creek, Pine)
- ✅ Two disposal patterns implemented (manual + DisposableBag)
- ✅ Z-fighting completely eliminated (ground hiding pattern)
- ✅ Grid pattern eliminated (random jitter system)
- ✅ Enhanced performance monitoring (accurate metrics)
- ✅ Stable 60 FPS across all worlds
- ✅ Verified leak-free transitions via console logs

---

## Disposal Patterns

### Pattern 1: Manual Disposal (Backyard, Woodline, Creek)

**When to Use**: Worlds with simple resource management, minimal external dependencies

```typescript
// World setup
let grassField: GrassFieldResult | undefined;
let isWorldAlive = true;
const getIsAlive = () => isWorldAlive;

// Async grass creation
createGrass(scene, getIsAlive)
  .then((field) => {
    grassField = field;
    // Hide ground to prevent z-fighting
    ground.visibility = 0;
    ground.setEnabled(false);
  })
  .catch((err) => {
    console.error('[World] Failed to create grass:', err);
  });

// Disposal
const dispose = () => {
  isWorldAlive = false;  // Stop async ops
  disposeGrassField(grassField, { debug: { log: import.meta.env.DEV } });
  // ... dispose other resources
};
```

**Pros**:
- Explicit control over disposal order
- Simple to understand and debug
- Minimal boilerplate

**Cons**:
- Must track each resource separately
- Risk of forgetting to dispose something

### Pattern 2: DisposableBag (Pine)

**When to Use**: Worlds with many resources, complex cleanup sequences

```typescript
// World setup
const bag = new DisposableBag();
let isWorldAlive = true;
const getIsAlive = () => isWorldAlive;

// Async grass creation with automatic tracking
createGrass(scene, bag, getIsAlive)
  .then((_field) => {
    // Grass parent + container automatically tracked in bag
  })
  .catch((err) => {
    console.error('[Pine] Failed to create grass:', err);
  });

// Disposal
const dispose = () => {
  isWorldAlive = false;
  bag.dispose();  // Handles grass + all other tracked resources
};
```

**Pros**:
- Centralized resource management
- Impossible to forget disposal (everything tracked)
- Cleaner dispose() logic

**Cons**:
- Requires `bag.trackMesh()` / `bag.trackOther()` calls
- Less control over disposal order

---

## Jitter System (Grid Pattern Elimination)

### Problem
Grass instances in perfect grid alignment with identical rotations create visible "grid pattern" artifacts—alternating lighter/darker squares due to uniform shading and texture orientation.

### Solution
Randomize position and rotation for organic appearance:

```typescript
// In GrassGridPlacement type:
jitter?: {
  position?: number;   // +/- meters in X/Z
  rotationY?: number;  // +/- radians around Y-axis
};
```

**Implementation** (in `createGrassField.ts`):
```typescript
// Apply position jitter
const posJitter = cfg.placement.jitter?.position;
if (posJitter !== undefined && posJitter > 0) {
  finalX += (Math.random() - 0.5) * posJitter * 2;
  finalZ += (Math.random() - 0.5) * posJitter * 2;
}

// Apply rotation jitter
const rotJitter = cfg.placement.jitter?.rotationY;
if (rotJitter !== undefined && rotJitter > 0) {
  instance.rotation.y = (Math.random() - 0.5) * rotJitter * 2;
}
```

**Tuning Guidelines**:
- **Position**: ~15% of spacing (e.g., 3m jitter for 20m spacing)
- **Rotation**: Full `Math.PI * 2` (0-360°) for maximum variety
- No seeding needed—pure random is sufficient for visual variety

---

## Z-Fighting Resolution

### Problem
120×120m ground planes flickering during camera movement due to multiple surfaces at Y≈0 (ground, clearing, grass) causing depth buffer precision issues.

### Solutions Applied
1. **offsetY**: Raise grass instances 10cm above ground (`offsetY: 0.1`)
2. **Hide Ground**: Disable ground plane after grass loads (Backyard pattern)
   ```typescript
   .then((field) => {
     ground.visibility = 0;
     ground.setEnabled(false);
   });
   ```

**Result**: Complete elimination of flickering in all 4 worlds

---

## World Configurations

| World | Grid | Spacing | Height | Wind | Exclusions | Jitter |
|-------|------|---------|--------|------|------------|--------|
| **Backyard** | 6×6 | 13m | 60% | Default (0.15 / 1.2) | 2 house rects | ±2m pos, full rot |
| **Woodline** | 4×4 | 20m | 50% | Calm (0.12 / 1.0) | Campfire circle (r=10) | ±3m pos, full rot |
| **Creek** | 5×5 | 20m | 60% | Breezy (0.18 / 1.3) | Water rect (30×140), stones (r=12), filter (r=15) | ±3m pos, full rot |
| **Pine** | 5×5 | 18m | 40% | Very Calm (0.08 / 0.8) | Trail rect (15×100), hut (r=12), outcrop (r=10) | ±3m pos, full rot |

**Design Rationale**:
- **Backyard**: Medium density, tall grass for suburban lawn
- **Woodline**: Lower density, shorter grass for forest floor with campfire gathering area
- **Creek**: Medium density along narrow corridor banks, breezier wind near water
- **Pine**: Dense coverage, shortest grass (pine needle floor), calmest wind (dense forest shelter)

---

## Performance Validation

### Metrics Before/After (Backyard Example)
```
Backyard:
  Meshes: 628/628 (544 instances)
  Materials: 48 | Textures: 29
  FPS: 60 (stable)
```

**Disposal Verification** (console logs):
```
[disposeGrassField] Starting disposal...
[disposeGrassField]   Disposing 25 children of grass_parent
[disposeGrassField]   Cleaned up parent
[disposeGrassField]   Disposed container (36 meshes)
[disposeGrassField] ✅ Disposal complete
```

### Resource Stability Test
Cycled through all 4 worlds repeatedly—mesh counts return to baseline after each transition. No cumulative growth observed.

### Performance Monitoring Enhancement
**Removed**: Draw calls counter (was showing cumulative total, not per-frame)  
**Added**:
- `meshesRendered` / `meshesActive` (instance efficiency)
- `instanceCount` (instancing usage)
- Player position tracking for spatial debugging

---

## Lessons Learned

### 1. Draw Calls Counter Misleading
**Problem**: Counter showed cumulative total since engine start (~5,000 increase/second)  
**User Insight**: "Wouldn't my fps drop if I had 30-40000 draw calls every second. My fps stays at steady 60"  
**Resolution**: Removed metric (BabylonJS doesn't expose per-frame draw calls via public API)

### 2. LoadContainer Type Assertions
**Problem**: `loadContainer` returns `AssetContainer | undefined`, factory expects non-null  
**Solution**: Wrapped with non-null assertion: `(await loadContainer(args))!`  
**Rationale**: `getIsAlive` check ensures container exists or operation already aborted

### 3. Ground Hiding More Effective Than Y-Separation
**Attempted**: Increased Y-offsets (5cm, 10cm) for z-fighting  
**Result**: Flickering persisted on large planes  
**Final Solution**: Hide ground plane entirely after grass loads (Backyard pattern)

### 4. Jitter System Simple But Effective
**Implementation**: Pure random (no seeding)  
**Configuration**: 15% position jitter + full rotation jitter  
**Result**: Completely eliminated grid pattern with minimal code

---

## File Structure Created

```
src/game/worlds/
├── creek/
│   ├── models/
│   │   └── loadContainer.ts       (NEW - 40 lines)
│   ├── terrain/
│   │   ├── grassConfig.ts         (NEW - 46 lines)
│   │   └── createGrass.ts         (NEW - 38 lines)
│   └── CreekWorld.ts              (MODIFIED - manual disposal)
│
└── pine/
    ├── terrain/
    │   ├── grassConfig.ts         (NEW - 47 lines)
    │   └── createGrass.ts         (NEW - 68 lines, DisposableBag)
    └── PineWorld.ts               (MODIFIED - DisposableBag disposal)
```

**Total New Code**: ~240 lines across 6 files  
**Modified Code**: 4 world entry files + performance monitoring

---

## Testing Checklist

**DEV Environment** (all ✅):
- [x] All worlds load grass successfully (no console errors)
- [x] Disposal logs confirm cleanup (see "Disposing X children" messages)
- [x] FPS stable at 60 across all worlds
- [x] No z-fighting visible in any world
- [x] No grid pattern visible (organic grass appearance)
- [x] World transitions don't accumulate resources (mesh counts stable)
- [x] TypeCheck clean (no type errors)
- [x] Lint clean (no style warnings)
- [x] Build succeeds (all chunks optimized)

---

## Future Enhancements (Out of Scope)

Not implemented in Phase C but documented for future work:

1. **Scale Jitter** (`jitter.scale`): Height variation for more organic appearance
2. **Deterministic Seeding** (`jitter.seed`): Reproducible randomness for save/load
3. **Terrain Conforming**: Grass follows ground contours (currently flat Y-offset)
4. **Density Maps**: Organic coverage patterns (sparse→dense transitions)
5. **LOD System**: Reduce instances for distant grass patches

---

## Conclusion

Phase C successfully achieved 100% grass rollout across all worlds with:
- ✅ **Leak-free lifecycle management** (verified via console logs)
- ✅ **Visual quality improvements** (no z-fighting, no grid patterns)
- ✅ **Performance stability** (60 FPS, healthy mesh/instance counts)
- ✅ **Maintainable patterns** (manual + DisposableBag documented)

**Production-Ready**: All 4 worlds compile, build, and run without errors. Grass system now fully integrated into Little Worlds game engine.
