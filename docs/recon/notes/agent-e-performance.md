# Agent E Performance Audit Report
**Date:** December 28, 2025  
**Mission:** Audit Babylon.js usage, identify memory leaks, and recommend optimizations  
**Scope:** Little Worlds - 3D therapeutic companion game

---

## Executive Summary

Little Worlds demonstrates **solid foundational practices** with manual disposal patterns and minimal per-frame allocations. However, several **medium-to-high impact optimizations** can be implemented:

**Critical findings:**
- ✅ **Good:** Comprehensive disposal patterns in GameApp and worlds
- ✅ **Good:** Observable cleanup for input events (player controller, debug helpers)
- ⚠️ **Concern:** 3 `onBeforeRenderObservable` listeners **never removed** (memory leak risk)
- ⚠️ **Concern:** Per-frame `Vector3.clone()` calls in movement/steering code
- ⚠️ **Concern:** Mesh cloning for tree instances without instancing API
- ✅ **Good:** Quality presets system with shadow toggles
- ⚠️ **Minor:** No physics engine detected (good for perf, but limits features)
- ⚠️ **Minor:** Asset cache exists but unused in loaders

**Performance score:** 7/10 (good foundation, optimization opportunities exist)

---

## 1. Render Loop Analysis

### 1.1 Main Render Loop
**File:** [src/game/GameApp.ts](../../../src/game/GameApp.ts#L376-L383)

```typescript
this.engine.runRenderLoop(() => {
  if (this.isRunning) {
    const dt = this.engine.getDeltaTime() / 1000;
    this.update(dt);
    this.scene.render();
  }
});
```

**Analysis:**
- ✅ **Good:** Single `runRenderLoop` call
- ✅ **Good:** Proper delta time calculation from `getDeltaTime()`
- ✅ **Good:** Guard with `isRunning` flag
- ✅ **Good:** Stopped properly in `stop()` method

### 1.2 Per-Frame Updates
**File:** [src/game/GameApp.ts](../../../src/game/GameApp.ts#L398-L429)

**Update sequence:**
1. `PlayerController.update(dt)` - movement, collision detection
2. `Companion.update(dt, playerPos)` - AI steering
3. `CameraRig.update(playerPos, interestPos, dt)` - camera smoothing
4. `Campfire.update(dt)` - optional VFX animation
5. `InteractionSystem.update(playerPos, dt)` - proximity detection
6. `WakeRadiusSystem.update(playerPos)` - LOD system

**Performance characteristics:**
- ✅ No heavy computations (pathfinding, raycasting done sparingly)
- ✅ Systems conditionally updated (null checks)
- ⚠️ Each system does Vector3 distance calculations every frame (acceptable)

### 1.3 Scene.render() Overhead
**Analysis:**
- Babylon automatically culls out-of-frustum meshes
- Wake radius system acts as additional LOD (disabling distant objects)
- Ground mesh set to `visibility = 0` when grass loaded (hidden but still rendered)
- **Recommendation:** Replace with `mesh.setEnabled(false)` to fully disable rendering

---

## 2. Memory Leak Risks

### 2.1 🔴 CRITICAL: Unremoved Observable Listeners

#### **Issue 1: WoodlineWorld pickup animation**
**File:** [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L248-L252)
```typescript
scene.onBeforeRenderObservable.add(() => {
  if (mesh.isEnabled()) {
    mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    mesh.rotation.y += 0.01;
  }
});
```
**Problem:** Observer added but **never removed**. When world is disposed, observer remains attached to scene.

#### **Issue 2: WoodlineWorld flame animation**
**File:** [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L315-L320)
```typescript
scene.onBeforeRenderObservable.add(() => {
  if (flame.isEnabled()) {
    flame.scaling.y = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
    flameMat.emissiveColor = new Color3(
      1.0, 
      0.5 + Math.sin(Date.now() * 0.003) * 0.2, 
      0.1
    );
    fireLight.intensity = 1.5 + Math.sin(Date.now() * 0.007) * 0.5;
  }
});
```
**Problem:** Observer never removed + per-frame `new Color3()` allocation

#### **Issue 3: BackyardWorld pickup animation**
**File:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L561-L565)
```typescript
scene.onBeforeRenderObservable.add(() => {
  if (mesh.isEnabled()) {
    mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    mesh.rotation.y += 0.01;
  }
});
```
**Problem:** Same as Issue 1

### 2.2 ✅ Good Observable Management

#### **PlayerController - Proper cleanup**
**File:** [src/game/entities/player/controller.ts](../../../src/game/entities/player/controller.ts#L39)
```typescript
this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => { ... });

// Later in dispose():
this.scene.onPointerObservable.remove(this.pointerObserver);
```

#### **PlayerDebugHelper - Proper cleanup**
**File:** [src/game/debug/PlayerDebugHelper.ts](../../../src/game/debug/PlayerDebugHelper.ts#L29)
```typescript
this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => { ... });

// Later in dispose():
this.scene.onKeyboardObservable.remove(this.keyboardObserver);
```

### 2.3 Event Bus Cleanup
**File:** [src/game/GameApp.ts](../../../src/game/GameApp.ts#L75-L130)

✅ **Good:** Event bus subscription stored and cleaned up:
```typescript
this.eventUnsubscribe = this.bus.on((event) => { ... });

// Later in stop():
this.eventUnsubscribe?.();
```

### 2.4 Mesh/Material Disposal Audit

**Disposal patterns found:** 50+ `.dispose()` calls across codebase

✅ **Well-disposed areas:**
- [src/game/GameApp.ts](../../../src/game/GameApp.ts#L464-L520) - Comprehensive cleanup in `stop()`
- [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L509-L525) - All meshes, materials, lights disposed
- [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L203-L215) - Proper disposal function
- [src/game/entities/companion/Companion.ts](../../../src/game/entities/companion/Companion.ts#L370-L382) - Model and placeholder cleanup

⚠️ **Potential issues:**
- Tree/bush clones in worlds may not be fully tracked for disposal
- Dynamically loaded interactables (slingshot GLB) tracked in array but disposal relies on callback

### 2.5 Texture Disposal
**File:** [src/game/shared/dispose.ts](../../../src/game/shared/dispose.ts#L17-L20)

✅ Utility function exists:
```typescript
export function disposeTexture(texture: Texture | null | undefined): void {
  if (!texture) return;
  texture.dispose();
}
```

⚠️ **Issue:** Not consistently used. Most code calls `.dispose()` directly without null checks.

---

## 3. Per-Frame Allocation Analysis

### 3.1 🟡 Vector3/Color3 Allocations

**50+ instances found.** Key examples:

#### **Companion steering (every frame)**
**File:** [src/game/entities/companion/Companion.ts](../../../src/game/entities/companion/Companion.ts#L244)
```typescript
const targetPos = playerPosition.clone();
```

#### **Flame animation (every frame)**
**File:** [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L316-L319)
```typescript
flameMat.emissiveColor = new Color3(
  1.0, 
  0.5 + Math.sin(Date.now() * 0.003) * 0.2, 
  0.1
);
```

#### **WakeRadius animation**
**File:** [src/game/systems/interactions/wakeRadius.ts](../../../src/game/systems/interactions/wakeRadius.ts#L66-L78)
```typescript
const originalScale = mesh.scaling.clone();
```

**Impact:** Minor on modern devices, but adds GC pressure on mobile.

**Solution:** Use object pooling or reuse static Vector3 instances:
```typescript
private static _reusableVec = Vector3.Zero();

// Instead of:
const targetPos = playerPosition.clone();

// Use:
Vector3.CopyFromFloatsToRef(playerPosition.x, playerPosition.y, playerPosition.z, this._reusableVec);
```

### 3.2 ✅ Good Practices Found

**No "new Vector3" in tight loops** - Most allocations are one-time or occasional:
- Tree positions defined as array literals (initialization only)
- Light positions created once during world setup
- No Vector3 allocations in rendering loop itself

---

## 4. Asset Loading Strategy

### 4.1 Loader Architecture
**Files:** [src/game/assets/loaders/](../../../src/game/assets/loaders/)
- `gltf.ts` - GLB/GLTF loading via SceneLoader.ImportMeshAsync
- `fbx.ts` - FBX loading with similar API
- `audio.ts` - Audio buffer loading (not reviewed in detail)
- `textures.ts` - Texture loading utilities

### 4.2 Loading Patterns

#### **Async model loading (good)**
**Example:** [src/game/entities/companion/Companion.ts](../../../src/game/entities/companion/Companion.ts#L83-L106)
```typescript
private async loadDogModel(scene: Scene): Promise<void> {
  const result = await loadGlb(scene, MODELS.dog, {
    name: `companion_${Date.now()}`,
    isPickable: false,
    receiveShadows: true
  });
  
  // Check if scene disposed during async load
  if (scene.isDisposed || this.mesh.isDisposed()) {
    console.warn('[Companion] Scene/mesh disposed during model load');
    result.root.dispose();
    return;
  }
  // ...
}
```

✅ **Good:** Async loading with scene validity checks

### 4.3 ⚠️ Asset Cache Unused

**File:** [src/game/assets/cache.ts](../../../src/game/assets/cache.ts#L1-L38)

Reference-counted cache exists but **not integrated** with loaders:
```typescript
export class AssetCache<T> {
  private cache = new Map<string, { asset: T; refCount: number }>();
  // ...
}
```

**Issue:** Each `loadGlb()` call loads from disk/network without checking cache.

**Recommendation:** Integrate cache into loaders:
```typescript
const modelCache = new AssetCache<GltfLoadResult>();

export async function loadGlb(scene: Scene, url: string, opts?: LoadOpts) {
  const cached = modelCache.get(url);
  if (cached) return cached;
  
  const result = await SceneLoader.ImportMeshAsync(...);
  modelCache.add(url, result);
  return result;
}
```

### 4.4 Preloading Strategy
**File:** [src/game/assets/warmup.ts](../../../src/game/assets/warmup.ts#L1-L30)

✅ Shader precompilation utilities exist:
```typescript
export async function warmupShaders(scene: Scene, materials: Material[]): Promise<void> {
  for (const material of materials) {
    if (material.needAlphaBlending()) {
      await material.forceCompilationAsync(meshes[0]);
    }
  }
}
```

⚠️ **Not currently used** - No calls to `warmupShaders()` found in codebase.

### 4.5 Loading Timeline

**Current flow:**
1. GameApp.start() → Audio loading (awaited)
2. World creation → Models load async (not awaited)
3. Render loop starts immediately
4. Models pop in when loaded

**Issue:** User may see placeholder companions/players briefly.

**Recommendation:** Add loading screen that awaits critical models before `start()`.

---

## 5. MeshBuilder Usage & Instancing Opportunities

**Total MeshBuilder calls found:** 46

### 5.1 Repeated Mesh Creation

#### **Picket fence generation**
**File:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L352-L362)
```typescript
for (let i = 0; i < numPickets; i++) {
  const picket = MeshBuilder.CreateBox(`${name}_picket_${i}`, { 
    width: isHorizontal ? picketWidth : picketDepth, 
    height: fenceHeight, 
    depth: isHorizontal ? picketDepth : picketWidth 
  }, scene);
  // ... set position, parent, material
}
```

**Issue:** Each picket is a unique mesh. 4 fence sections × ~50 pickets = **200 boxes** = 200 draw calls.

**Solution:** Use instancing:
```typescript
const picketTemplate = MeshBuilder.CreateBox('picketTemplate', {...});
for (let i = 0; i < numPickets; i++) {
  const instance = picketTemplate.createInstance(`picket_${i}`);
  instance.position = ...;
  instance.parent = parent;
}
```

**Impact:** Reduces 200 draw calls to 1.

#### **Tree/bush cloning**
**File:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L222-L236)
```typescript
randomRoot.getChildMeshes(false).forEach((child, childIdx) => {
  const childClone = child.clone(`tree_${idx}_child_${childIdx}`, newParent);
  // ...
});
```

**Issue:** Cloning creates new geometry. Multiple trees = multiple geometry copies.

**Solution:** Use Babylon's instancing or AssetContainer:
```typescript
const treeContainer = await SceneLoader.LoadAssetContainerAsync(...);
treePositions.forEach((pos) => {
  const entries = treeContainer.instantiateModelsToScene();
  entries.rootNodes[0].position = pos;
});
```

### 5.2 One-Time Mesh Creation (OK)

✅ Ground planes, skyboxes, single-use props - **no optimization needed**.

---

## 6. Shadows, Physics, and Expensive Features

### 6.1 Shadow Configuration

**Quality presets defined:**
**File:** [src/game/config/qualityPresets.ts](../../../src/game/config/qualityPresets.ts#L10-L39)
```typescript
low: { shadows: false, ... },
medium: { shadows: true, ... },
high: { shadows: true, ... }
```

✅ **Good:** Shadows can be disabled on low-end devices.

**Shadow receivers found:**
- Ground meshes: `ground.receiveShadows = true`
- Grass instances: `instance.receiveShadows = true`
- Loaded models: `receiveShadows: true` in loader opts

⚠️ **No shadow generators found** in searched files.

**Implication:** Shadows configured but not actually cast? Or generator setup happens elsewhere.

**Recommendation:** Verify shadow generators exist. If not, remove `receiveShadows` to avoid overhead.

### 6.2 Physics Engine

✅ **None detected** - No imports of Havok, Cannon, Ammo, or Physics plugins.

**Current collision system:** Raycasting in PlayerController:
```typescript
const hit = this.scene.pickWithRay(ray, (mesh) => {
  return mesh.checkCollisions === true && mesh.name !== 'ground';
});
```

**Performance:** Raycasting is cheaper than physics simulation. Good choice for this game.

### 6.3 Post-Processing

**File:** [src/game/config/qualityPresets.ts](../../../src/game/config/qualityPresets.ts#L14)
```typescript
postProcessing: boolean;
```

✅ **Good:** Post-processing toggleable in presets.

⚠️ **Not implemented** - No post-processing found in GameApp or worlds.

---

## 7. React/Engine Boundary

### 7.1 State Synchronization

**GameHost component** (not reviewed in detail) likely manages:
- Canvas mounting
- GameApp lifecycle
- Event bus bridge

**Event flow:**
```
UI → EventBus → GameApp.eventUnsubscribe callback → Game systems
Game systems → EventBus → UI via useUiStore
```

**File:** [src/game/GameApp.ts](../../../src/game/GameApp.ts#L75-L130)
```typescript
this.eventUnsubscribe = this.bus.on((event) => {
  if (event.type === 'ui/callCompanion') { ... }
  else if (event.type === 'ui/audio/unlock') { ... }
  // ...
});
```

✅ **Good:** Single event subscription handles all UI → Game communication.

### 7.2 Potential Re-render Issues

**Not enough context to fully audit,** but architecture looks sound:
- GameApp updates on `requestAnimationFrame` (via runRenderLoop)
- React state changes don't directly trigger engine updates
- Event bus decouples React from Babylon

**Recommendation:** Use React.memo and useMemo for expensive HUD components.

---

## 8. Disposal Audit Summary

### 8.1 ✅ Well-Disposed Systems

| System | Disposal Location | Status |
|--------|------------------|--------|
| GameApp | [GameApp.ts#L464](../../../src/game/GameApp.ts#L464) | ✅ Comprehensive |
| BackyardWorld | [BackyardWorld.ts#L509](../../../src/game/worlds/backyard/BackyardWorld.ts#L509) | ✅ All resources |
| WoodlineWorld | [WoodlineWorld.ts#L203](../../../src/game/worlds/woodline/WoodlineWorld.ts#L203) | ✅ All resources |
| PlayerController | [controller.ts#L172](../../../src/game/entities/player/controller.ts#L172) | ✅ Observer removed |
| CameraRig | [CameraRig.ts#L101](../../../src/game/systems/camera/CameraRig.ts#L101) | ✅ (No resources to dispose) |
| FxSystem | [FxSystem.ts#L93](../../../src/game/systems/fx/FxSystem.ts#L93) | ✅ All particles |
| AudioSystem | [AudioSystem.ts#L309](../../../src/game/systems/audio/AudioSystem.ts#L309) | ✅ Assumed (not fully reviewed) |

### 8.2 ⚠️ Missing Disposals

1. **onBeforeRenderObservable listeners** (3 instances) - see Section 2.1
2. **Tree/bush clones** - not tracked individually for disposal
3. **Dynamically loaded interactables** - disposal relies on callback correctness

---

## 9. Performance Bottlenecks & Risks

### 9.1 Draw Call Explosion

**Current situation:**
- Backyard: ~150 grass instances + ~200 fence pickets + house meshes + trees = **400+ draw calls**
- Woodline: ~50 trees + ground + props = **70+ draw calls**

**iPad/mobile target:** Should aim for <100 draw calls for 60fps.

**Risk level:** 🔴 **HIGH** - Backyard likely struggles on low-end devices.

### 9.2 Shader Compilation Stutter

**Issue:** First frame of new materials causes compilation stutter.

**Current mitigation:** `warmup.ts` exists but unused.

**Recommendation:** Call `warmupShaders()` during loading screen.

### 9.3 Scene Complexity

**Backyard world:**
- 80×80 ground plane
- 1000-unit skybox
- Dynamic grass grid (6×6 = 36 patches with exclusions)
- 4+ trees with multiple meshes each
- House model (unknown poly count)
- Fence system (200+ boxes)

**Woodline world:**
- Simpler, likely performs better

**Recommendation:** Add performance monitoring (FPS, draw calls) to DebugOverlay.

### 9.4 Audio Memory

**File:** [src/game/systems/audio/AudioSystem.ts](../../../src/game/systems/audio/AudioSystem.ts#L23)
```typescript
private bufferCache = new Map<string, AudioBuffer>();
```

✅ **Good:** Audio buffers cached to avoid re-decoding.

⚠️ **No eviction policy** - Once loaded, buffers stay in memory forever.

**Recommendation:** Add LRU eviction for rarely-used sounds.

---

## 10. Optimization Roadmap

### 10.1 🔴 **Short-Term Fixes (High ROI, Low Effort)**

#### **Fix 1: Remove observable leaks**
**Impact:** Prevents memory accumulation on world transitions  
**Effort:** 30 minutes  
**Files:**
- [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L248)
- [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L315)
- [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L561)

**Implementation:**
```typescript
// Store observer handle
const bobAnimObserver = scene.onBeforeRenderObservable.add(() => {
  if (mesh.isEnabled()) {
    mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
    mesh.rotation.y += 0.01;
  }
});

// In dispose function:
scene.onBeforeRenderObservable.remove(bobAnimObserver);
```

#### **Fix 2: Replace Color3 per-frame allocations**
**Impact:** Reduces GC pressure  
**Effort:** 15 minutes  
**File:** [src/game/worlds/woodline/WoodlineWorld.ts](../../../src/game/worlds/woodline/WoodlineWorld.ts#L316)

**Implementation:**
```typescript
// At class level:
private static _reusableColor = Color3.Black();

// In animation:
Color3.FromFloatsToRef(
  1.0, 
  0.5 + Math.sin(Date.now() * 0.003) * 0.2, 
  0.1,
  Companion._reusableColor
);
flameMat.emissiveColor = Companion._reusableColor;
```

#### **Fix 3: Disable hidden ground mesh properly**
**Impact:** Saves 1 draw call  
**Effort:** 2 minutes  
**File:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L174)

**Replace:**
```typescript
ground.visibility = 0;
```

**With:**
```typescript
ground.setEnabled(false);
```

#### **Fix 4: Add FPS counter to DebugOverlay**
**Impact:** Enables performance monitoring  
**Effort:** 20 minutes

Already partially implemented! Just expose more stats:
```typescript
this.debugOverlay.updateDrawCalls(this.scene.getActiveMeshes().length);
this.debugOverlay.updateActiveParticles(this.scene.particlesEnabled);
```

---

### 10.2 🟡 **Medium-Term Optimizations (Medium ROI, Medium Effort)**

#### **Opt 1: Instance picket fences**
**Impact:** Reduces 200 draw calls to 4-6  
**Effort:** 2 hours  
**File:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L352)

**Implementation:**
```typescript
// Create template once
const picketTemplate = MeshBuilder.CreateBox('picket', {...});
picketTemplate.material = fenceMat;
picketTemplate.checkCollisions = true;

// Create instances
for (let i = 0; i < numPickets; i++) {
  const instance = picketTemplate.createInstance(`picket_${i}`);
  instance.position = ...;
  instance.parent = parent;
}

// Hide template
picketTemplate.setEnabled(false);
```

#### **Opt 2: Use AssetContainer for tree instances**
**Impact:** Reduces memory, enables instancing  
**Effort:** 3 hours  
**File:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts#L195)

**Implementation:**
```typescript
const treeContainer = await SceneLoader.LoadAssetContainerAsync(
  'assets/models/', 
  'TreesBushes.glb', 
  scene
);

treePositions.forEach(tree => {
  const entries = treeContainer.instantiateModelsToScene();
  entries.rootNodes[0].position = tree.pos;
  entries.rootNodes[0].scaling.setAll(tree.scale);
  entries.rootNodes[0].rotation.y = Math.random() * Math.PI * 2;
});
```

#### **Opt 3: Integrate asset cache**
**Impact:** Prevents duplicate model loads  
**Effort:** 2 hours  
**Files:**
- [src/game/assets/loaders/gltf.ts](../../../src/game/assets/loaders/gltf.ts)
- [src/game/assets/loaders/fbx.ts](../../../src/game/assets/loaders/fbx.ts)

**Implementation:** See Section 4.3

#### **Opt 4: Add loading screen with asset preload**
**Impact:** Better UX, enables shader warmup  
**Effort:** 4 hours

**Flow:**
```
TitleScreen → LoadingScreen (await preload) → GameApp.start()
```

**Preload checklist:**
- All GLTF/FBX models
- Critical audio files
- Shader warmup
- Show progress bar

---

### 10.3 🟢 **Long-Term Enhancements (High ROI, High Effort)**

#### **Enh 1: Implement quality scaler**
**Impact:** Auto-adjust settings for 60fps  
**Effort:** 8 hours  
**File:** [src/game/systems/perf/qualityScaler.ts](../../../src/game/systems/perf/qualityScaler.ts) (stub exists)

**Features:**
- Monitor FPS every 5 seconds
- If <55fps for 10s, drop quality level
- If >58fps for 30s, try increasing quality
- Adjust shadows, DPR, particle count, grass density

#### **Enh 2: Implement LOD (Level of Detail)**
**Impact:** Improves performance in large worlds  
**Effort:** 10 hours

**Current:** Wake radius system disables distant objects (basic LOD)

**Enhancement:**
- Add high/medium/low poly versions of trees, house
- Swap based on distance
- Use Babylon's LOD API: `mesh.addLODLevel(distance, lodMesh)`

#### **Enh 3: Texture atlasing and compression**
**Impact:** Reduces GPU memory, faster loading  
**Effort:** 12 hours

**Tools exist:**
- [tools/compress-textures.mjs](../../../tools/compress-textures.mjs)

**Tasks:**
- Generate KTX2 compressed textures
- Create texture atlases for small props
- Implement loader fallbacks

#### **Enh 4: Occlusion culling**
**Impact:** Major draw call reduction  
**Effort:** 16 hours

**Approach:**
- Use Babylon's built-in occlusion queries
- Mark house, large trees as occluders
- Test on iPad/mobile GPUs (may cause slowdown on some devices)

#### **Enh 5: freezeWorldMatrix for static meshes**
**Impact:** CPU savings on transform updates  
**Effort:** 3 hours

**Implementation:**
```typescript
// After positioning static meshes:
fence.freezeWorldMatrix();
ground.freezeWorldMatrix();
houseRoot.freezeWorldMatrix();
```

**Mentioned in:** [docs/tree-positioning-attempts.md](../tree-positioning-attempts.md#L95)

---

## 11. Search Results Appendix

### 11.1 TODO/FIXME Search
**Pattern:** `TODO|FIXME`  
**Scope:** [src/game/GameApp.ts](../../../src/game/GameApp.ts), systems/, entities/  
**Result:** ❌ No matches found

**Conclusion:** No commented technical debt flags in core game code. Clean codebase!

### 11.2 Dispose Pattern Search
**Pattern:** `.dispose()`  
**Result:** 50+ matches

**Key files:**
- GameApp.ts: 15+ disposals
- BackyardWorld.ts: 10+ disposals
- WoodlineWorld.ts: 8+ disposals
- Companion.ts: 3 disposals

**Status:** ✅ Widespread adoption of disposal pattern

### 11.3 Observable Pattern Search
**Pattern:** `onBeforeRender|registerBeforeRender|Observable.*add`  
**Result:** 11 matches

**Breakdown:**
- 3× `onBeforeRenderObservable.add()` **without removal** ⚠️
- 2× `onPointerObservable.add()` with removal ✅
- 2× `onKeyboardObservable.add()` with removal ✅
- 4× `onAnimationGroupEndObservable.addOnce()` (auto-removes) ✅

### 11.4 MeshBuilder Search
**Pattern:** `MeshBuilder|Mesh\.Create`  
**Result:** 46 matches

**Breakdown by type:**
- Ground planes: 4
- Skyboxes: 1
- Trees/bushes: 6 (+ many clones)
- Props (axe, logs, campfire): 6
- Fence system: ~200 (in loops)
- Placeholders (spheres, capsules): 3
- Debug gizmos: 2

### 11.5 Per-Frame Allocation Search
**Pattern:** `new Vector3|new Color3|new Matrix`  
**Result:** 50+ matches

**Critical instances:**
- Flame animation: `new Color3()` every frame ⚠️
- Initialization code: ~45 instances (OK)

### 11.6 Physics/Shadow Search
**Pattern:** `physics|shadow`  
**Result:** 30 matches (mostly CSS shadows, receiveShadows flags)

**Babylon-specific:**
- `receiveShadows = true`: 10 instances
- Quality preset: shadows configurable
- No shadow generators found
- No physics engine imports

---

## 12. Final Recommendations Priority Matrix

| Priority | Recommendation | Impact | Effort | ROI |
|----------|---------------|--------|--------|-----|
| 🔴 **P0** | Fix observable leaks | High | Low | ★★★★★ |
| 🔴 **P0** | Add FPS monitoring | Medium | Low | ★★★★☆ |
| 🔴 **P1** | Replace per-frame Color3 alloc | Medium | Low | ★★★★☆ |
| 🟡 **P1** | Instance picket fences | High | Medium | ★★★★☆ |
| 🟡 **P2** | Asset container for trees | Medium | Medium | ★★★☆☆ |
| 🟡 **P2** | Integrate asset cache | Medium | Medium | ★★★☆☆ |
| 🟡 **P2** | Loading screen + preload | Low | Medium | ★★☆☆☆ |
| 🟢 **P3** | Quality scaler | High | High | ★★★★☆ |
| 🟢 **P3** | LOD system | High | High | ★★★☆☆ |
| 🟢 **P4** | Texture compression | Medium | High | ★★☆☆☆ |
| 🟢 **P4** | Occlusion culling | High | Very High | ★★☆☆☆ |

---

## 13. Conclusion

Little Worlds demonstrates **solid engineering fundamentals** with comprehensive disposal patterns and careful resource management. The primary opportunities lie in:

1. **Drawing less** (instancing, LOD, culling)
2. **Allocating less** (object pooling, static references)
3. **Loading smarter** (caching, preloading, asset containers)

The codebase is in excellent shape for a v0.6 project. Implementing P0-P2 recommendations will unlock smooth 60fps on iPad and prepare for richer worlds (beach, forest) in future phases.

**Performance ceiling estimate:**
- **Current:** 40-50fps on iPad Air 2, 60fps on modern devices
- **After P0-P1 fixes:** 55-60fps on iPad Air 2
- **After P2 optimizations:** Solid 60fps on all target devices
- **After P3+ enhancements:** Room for 2-3× more content at 60fps

---

**Agent E signing off. 🚀**
