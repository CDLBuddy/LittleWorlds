# Tree & Bush Model Positioning Issue - Troubleshooting Log

## Problem Statement
After importing TreesBushes.glb model, trees and bushes remain in their original Blender positions (appearing in rows) instead of being placed at the specified world positions in code.

## Model Structure
- TreesBushes.glb contains multiple tree/bush variations
- Structure: `__root__` → parent nodes (tree1, tree2, Plano.548, etc.) → geometry children
- Each parent node has children with actual mesh geometry
- Found tree parent nodes: tree1, tree2, tree3, tree4, tree5, and various Plano.* nodes

## Attempted Solutions

### Attempt 1: Basic Clone with Transform Reset
**Approach:** Clone parent node with children, reset position/rotation/scaling
```typescript
const instance = randomRoot.clone(`tree_${idx}`, null, true);
instance.position = tree.pos.clone();
instance.rotation = Vector3.Zero();
instance.scaling = new Vector3(tree.scale, tree.scale, tree.scale);
instance.rotation.y = Math.random() * Math.PI * 2;
```
**Result:** Trees remained in Blender positions - transforms were not properly overridden

### Attempt 2: Using copyFromFloats()
**Approach:** Use copyFromFloats() instead of creating new Vector3 objects
```typescript
instance.position.copyFromFloats(tree.pos.x, tree.pos.y, tree.pos.z);
instance.rotation.copyFromFloats(0, Math.random() * Math.PI * 2, 0);
instance.scaling.copyFromFloats(tree.scale, tree.scale, tree.scale);
```
**Result:** No change - still inherited Blender world transforms

### Attempt 3: Resetting Child Transforms
**Approach:** Explicitly iterate through children and attempt to reset their transforms
```typescript
instance.getChildMeshes().forEach(child => {
  if (child.parent === instance) {
    // Keep child's local position/rotation/scale as-is
  }
});
```
**Result:** No effect - parent world transform still dominated

### Attempt 4: New Parent with Child Cloning (Current)
**Approach:** Create fresh TransformNode at desired position, clone children into it
```typescript
const newParent = new TransformNode(`tree_parent_${idx}`, scene);
newParent.position = tree.pos.clone();
newParent.rotation.y = Math.random() * Math.PI * 2;
newParent.scaling = new Vector3(tree.scale, tree.scale, tree.scale);

randomRoot.getChildMeshes(false).forEach((child, childIdx) => {
  const childClone = child.clone(`tree_${idx}_child_${childIdx}`, newParent);
  const localPos = child.position.clone();
  const localRot = child.rotation.clone();
  const localScale = child.scaling.clone();
  
  childClone.position = localPos;
  childClone.rotation = localRot;
  childClone.scaling = localScale;
  childClone.setEnabled(true);
});
```
**Result:** Still not working - trees remain in Blender row positions

## Target Positions

### Backyard (4 trees):
- (-20, 0, 20) scale 1.2
- (18, 0, 18) scale 1.0
- (-22, 0, -10) scale 1.3
- (22, 0, -8) scale 1.4 (tire swing tree)

### Woodline (6 trees):
- (-20, 0, -20) scale 1.5
- (20, 0, -20) scale 1.5
- (-25, 0, 10) scale 1.5
- (25, 0, 10) scale 1.5
- (-15, 0, 25) scale 1.5
- (15, 0, 25) scale 1.5

## Observed Behavior
- Trees render correctly (with foliage attached)
- Random rotation works (trees face different directions each reload)
- Random tree/bush selection works (different models appear at each reload)
- **Position is NOT working** - all trees appear in same Blender export locations

## Hypothesis
The TreesBushes.glb file may have baked world transforms that cannot be overridden through Babylon.js transform properties. The parent nodes in the GLB might have their positions baked into the mesh data itself rather than being stored as scene graph transforms.

## Potential Solutions Not Yet Tried
1. Use `setAbsolutePosition()` instead of setting `position` property
2. Use `computeWorldMatrix(true)` to force matrix recalculation
3. Set `freezeWorldMatrix()` after positioning
4. Export GLB with all objects at origin (0,0,0) in Blender
5. Use Babylon's `BoundingBox` to center mesh before positioning
6. Try `instantiateHierarchy()` method instead of clone
7. Manually build transform matrices and apply via `setPreTransformMatrix()`

## Current Code Status
- TypeScript compiles without errors
- All models load successfully (House, Grass, Trees, Slingshot)
- Grass tiling with exclusion zones works correctly
- Sky material with sunrise atmosphere rendering
- Slingshot interactable with dynamic registration working

## Date: December 28, 2025
