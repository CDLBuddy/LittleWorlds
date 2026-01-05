# Phase C - Grass Rollout Leak Testing Checklist

## Purpose
Verify that worlds properly dispose grass terrain during transitions, preventing GPU/scene resource accumulation.

## Phase C Rollout Status

### ✅ Completed Worlds
- **Backyard**: Grass field with disposal wired (6×6 grid, house exclusions, random jitter)
- **Woodline**: Grass field with disposal wired (4×4 grid, campfire exclusion, random jitter)
- **Creek**: Grass field with disposal wired (5×5 grid, water/stones/filter exclusions, random jitter)
- **Pine**: Grass field with DisposableBag disposal (5×5 grid, trail/hut/outcrop exclusions, random jitter)

## Manual Testing Procedure

### Test 1: Basic Disposal Verification

**Goal**: Confirm grass disposes on world unload

**Steps**:
1. Start game in Backyard
2. Open browser DevTools console
3. Check for grass creation log: `[Backyard] Created grass field with N instances`
4. Navigate to Woodline world
5. Check for disposal log: `[disposeGrassField] Disposing...` (DEV only)
6. Check for Woodline grass creation log
7. Navigate back to Backyard
8. Check for disposal log again
9. Repeat cycle 3 times (Backyard → Woodline → Backyard)

**Expected Outcome**:
- Each world transition logs disposal before new grass creation
- No error messages during disposal
- Grass visually appears correctly in each world

---

### Test 2: Scene Resource Leak Detection

**Goal**: Verify no unbounded growth in scene resources

**Setup**:
```js
// Run in browser console
const scene = window.__lwDebugScene; // Exposed in DEV only
function checkResources() {
  console.table({
    meshes: scene.meshes.length,
    materials: scene.materials.length,
    textures: scene.textures.length,
  });
}
```

**Steps**:
1. Start in Backyard
2. Run `checkResources()` - record baseline
3. Navigate to Woodline
4. Run `checkResources()` - should increase (Woodline assets load)
5. Navigate to Backyard
6. Run `checkResources()` - should decrease or stabilize (Woodline disposed)
7. Repeat cycle 5 times
8. Compare final resource counts to baseline

**Expected Outcome**:
- Resource counts should NOT grow unbounded over multiple cycles
- Some baseline increase is normal (shared/cached assets)
- No growth trend after 3-5 cycles indicates proper disposal

**Warning Signs**:
- Mesh count increases by ~100+ each cycle (grass instances not disposed)
- Material count increases by 2+ each cycle (template material + plugin not disposed)
- Texture count increases (container textures not disposed)

---

### Test 3: Performance Baseline

**Goal**: Ensure grass disposal doesn't cause framerate degradation over time

**Steps**:
1. Open browser DevTools Performance monitor
2. Start in Backyard, wait 10 seconds
3. Record FPS average
4. Navigate to Woodline → Backyard → Woodline (3 cycles)
5. Record FPS average after cycling
6. Compare baseline vs post-cycling FPS

**Expected Outcome**:
- FPS variance < 5% between baseline and post-cycling
- No stuttering during world transitions
- Smooth grass animation in both worlds

---

## Diagnostic Helper Usage

The `logGrassFieldStats` helper is automatically called in DEV mode during disposal:

```typescript
// Automatically invoked in disposeGrassField (DEV only)
[GrassFieldStats] Backyard (before disposal)
  ├─ Instances: 108
  ├─ Template: Plane.001 (has GrassWind plugin)
  ├─ Material: SummerGrassMat (green)
  ├─ Scene totals: { meshes: 324, materials: 48, textures: 76 }
  └─ First instance: (13.0, 13.0)
```

**What to check**:
- **Instance count**: Should match expected grid (Backyard: 108 = 6×6 grid - exclusions)
- **Scene totals**: Should decrease after disposal
- **Template/Material names**: Verify correct asset loaded

---

## Known Behaviors (Not Bugs)

### AssetContainer Shared Ownership
- Template mesh owned by container (not disposed by default)
- `disposeGrassField` defaults to `disposeContainer: false` (safe)
- Container may be cached/reused by BabylonJS loader

### Async Grass Creation
- Grass loads asynchronously (non-blocking)
- World may be disposed before grass finishes loading
- `getIsAlive` callback prevents ghost meshes

### Material Plugin WeakMap
- GrassWindPlugin uses WeakMap for material tracking
- No manual cleanup needed (garbage collected)

---

## Troubleshooting

### Grass Doesn't Appear
- Check console for "Failed to create grass" errors
- Verify asset URL correct: `Summergrass.glb`
- Check template mesh predicate matches mesh name

### Ghost Meshes (Grass Appears After Disposal)
- Verify `isAlive` flag set to false in dispose()
- Check async grass creation uses `getIsAlive()` callback
- Confirm grass creation wrapped in `.catch()` handler

### Unbounded Resource Growth
- Verify `disposeGrassField` called in world dispose()
- Check disposal happens BEFORE world marked dead
- Ensure grassField variable captured correctly

---

## Phase C Next Steps

1. ✅ Backyard disposal wired
2. ✅ Woodline disposal wired
3. ⏭️ Creek world rollout
4. ⏭️ Pine world rollout (DisposableBag integration)
5. ⏭️ Final phase C documentation

---

## Related Files

- **Disposal Helper**: `src/game/terrain/grass/disposeGrassField.ts`
- **Diagnostics**: `src/game/terrain/grass/debug/logGrassFieldStats.ts`
- **Backyard Config**: `src/game/worlds/backyard/config/constants.ts`
- **Woodline Config**: `src/game/worlds/woodline/terrain/grassConfig.ts`
