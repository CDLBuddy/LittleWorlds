# Phase 12.1 Creek Hardening - Sweep Findings

**Date:** 2025-12-29
**Purpose:** Understand current ownership model and mesh naming before hardening

---

## Walkable Surface Determination

**Current Implementation:**
- PlayerController (line 56): `return mesh.name === 'ground';`
- **Hardcoded string check** - any mesh named exactly `'ground'` is clickable for movement
- No metadata support currently

**Creek World Current State:**
- West bank: named `'ground'`
- East bank: named `'ground'`
- Creek bed: named `'creekBed'` (not walkable)
- Water: named `'water'` (not walkable)
- Stepping stones: ALL named `'ground'` (5 stones)
- Bridge log: named `'ground'`

**Problem:** Multiple meshes with identical `'ground'` name creates collision risk if code uses `getMeshByName('ground')` anywhere.

**Solution:** Extend PlayerController to support `metadata.walkable` pattern per sweep recommendation.

---

## Dispose Ownership Model

**Current Pattern Analysis:**

### World Classes (BackyardWorld, WoodlineWorld)
- World `dispose()` calls `interactable.dispose()` for each interactable
- Interactables own their meshes/materials and dispose them
- World does NOT track meshes in arrays typically

### CreekWorld Current State (INCONSISTENT)
- World tracks `meshes[]` and `materials[]` arrays
- World `dispose()` calls `meshes.forEach(m => m.dispose())` AND `interactables.forEach(i => i.dispose())`
- Interactables ALSO dispose their meshes/materials in their dispose methods
- **Double dispose risk!** Filter station mesh pushed to `meshes[]` (line 176) AND its dispose() also disposes mesh

**Example from line 270-310:**
```typescript
function createFilterStation(...) {
  const mesh = MeshBuilder.CreateBox(...);
  // ... 
  return {
    mesh,
    dispose: () => {
      mesh.dispose(); // PROBLEM: Also in world meshes[] array
      mat.dispose();
    }
  };
}

// In createCreekWorld():
const filterStation = createFilterStation(...);
meshes.push(filterStation.mesh); // Added to world array
// Later in world dispose():
meshes.forEach(m => m.dispose()); // Disposes it
interactables.forEach(i => i.dispose()); // Disposes it AGAIN!
```

**Existing Worlds Pattern (WoodlineWorld line 588):**
```typescript
const dispose = () => {
  // Only calls interactable.dispose(), no mesh array
  interactables.forEach(i => i.dispose());
  // Disposes lights/player/companion separately
};
```

**Recommendation:** Follow existing world pattern - **Option B** (Interactables own their resources).

---

## Content ID Registry vs Created Interactables

**CREEK_INTERACTABLES manifest (line 23-30):**
```typescript
export const CREEK_INTERACTABLES = [
  INTERACTABLE_ID.CREEK_FILTER_STATION,      // ✅ Created
  INTERACTABLE_ID.CREEK_SLINGSHOT_BRANCH_TARGET, // ✅ Created
  INTERACTABLE_ID.CREEK_WILLOW_REST,         // ✅ Created
  INTERACTABLE_ID.CREEK_DEEP_POOL_LINGER,   // ✅ Created
  INTERACTABLE_ID.CREEK_NORTH_VISTA_MARKER,  // ❌ NOT CREATED
  INTERACTABLE_ID.CREEK_STONES_ENTRY,        // ✅ Created
];
```

**Missing Implementation:**
- `CREEK_NORTH_VISTA_MARKER` is registered but never instantiated
- Should either remove from manifest OR create as invisible trigger near north vista

**Content Validation:** Currently passes because validation script doesn't verify all IDs are instantiated (only checks that targetIds reference valid IDs).

---

## Current Issues Summary

### High Priority
1. **Double dispose risk:** Meshes in both world arrays and interactable dispose methods
2. **Mesh naming collision:** 8+ meshes all named `'ground'` - unsafe for `getMeshByName()`
3. **Missing interactable:** CREEK_NORTH_VISTA_MARKER in manifest but not created

### Medium Priority
4. **Splash detection brittle:** Hardcoded water bounds, distance-only check for stones
5. **lastSafePosition tracking:** Only updates when outside water, should update on all walkable surfaces

### Low Priority (Polish)
6. **Duplicate dirLight assignments:** None found (was concern from spec)
7. **Freeze timing:** Currently correct (after all mesh creation, before dispose)

---

## Recommended Implementation Order

1. **Fix PlayerController** - Add metadata.walkable support (backward compatible)
2. **Fix dispose ownership** - Remove meshes[] array, let interactables own resources
3. **Fix mesh names** - Unique names + metadata.walkable for all surfaces
4. **Fix splash logic** - Robust walkable surface detection
5. **Add CREEK_NORTH_VISTA_MARKER** - Or remove from manifest
6. **Verify** - Build, validate, manual QA
