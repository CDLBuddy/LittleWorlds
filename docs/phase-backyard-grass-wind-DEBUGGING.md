# Grass Wind Plugin Debugging Summary

**Date:** January 4, 2026  
**Status:** 🔴 Plugin registered but shader not executing  
**Issue:** Effect never becomes ready despite successful plugin registration

---

## Problem Statement

Grass wind animation plugin is fully implemented and registered, but produces **zero visual movement** despite:
- ✅ Plugin successfully registered in material's pluginManager
- ✅ Shader force-compilation reports success
- ✅ No TypeScript/build errors
- ✅ Material has pluginManager with 8 plugins including 'GrassWind'
- ❌ Effect remains `undefined` on instances after 30+ render frames
- ❌ No visible grass movement even with cranked settings (amplitude: 0.75)

---

## Current Console Output

```
{Total Meshes: 1672, Active Meshes: 0, Materials: 47, Textures: 28, FPS: 60}

[GrassWind] Processing material: summer, has pluginManager: true
[GrassWind] Before plugin creation, pluginManager exists: true
[GrassWind] After plugin creation, pluginManager exists: true
[GrassWind] Plugin created: GrassWind enabled: true
[GrassWind] Plugins in manager: (8) ['PBRBRDF', 'PBRClearCoat', 'PBRIridescence', 'PBRAnisotropic', 'Sheen', 'PBRSubSurface', 'DetailMap', 'GrassWind']
[GrassWind] Attached plugin to material: summer
[GrassWind] Processed 1 unique material(s)
[GrassWind] ✅ Shader force-compiled successfully
[GrassWind] Checking first instance: grass_0_0
[GrassWind] Instance material: summer
[GrassWind] Instance plugins: (8) ['PBRBRDF', 'PBRClearCoat', 'PBRIridescence', 'PBRAnisotropic', 'Sheen', 'PBRSubSurface', 'DetailMap', 'GrassWind']
[GrassWind] ❌ Effect never became ready after 30 frames
[GrassWind] Last effect state: undefined isReady: undefined
```

---

## Key Observations

### 1. Plugin Registration: ✅ WORKING
- Material has `pluginManager: true`
- Plugin successfully created with name 'GrassWind'
- Plugin appears in 8th position in plugins array
- Plugin `enabled: true`
- Same plugin list on both template mesh and instances

### 2. Shader Compilation: 🟡 UNCLEAR
- `forceCompilation()` callback fires: "✅ Shader force-compiled successfully"
- **BUT:** No shader compilation errors in console
- **BUT:** `mat.getEffect()` returns `undefined` on instances
- **BUT:** Effect never becomes ready (`isReady: undefined`)

### 3. Rendering State: ❌ SUSPICIOUS
- **`Active Meshes: 0`** - Nothing is being actively rendered
- Total meshes: 1672 (includes all scene objects)
- Grass instances created: ~33 (based on 6×6 grid minus exclusions)
- Instances have correct material reference: "summer"

### 4. Material State
- Template mesh material: "summer" (PBRMaterial)
- Instance material: "summer" (same reference)
- Both show identical plugin list
- Material exists and is accessible

---

## Attempts Made

### Attempt 1: Basic Plugin Implementation
**Action:** Created MaterialPluginBase extension with shader injection  
**Result:** Plugin registered but no movement  
**Console:** `pluginManager: undefined`

### Attempt 2: Fix Mask Attribute
**Action:** Changed `vColor.r` to `color.r` in shader  
**Result:** No change  
**Issue:** vColor might not be in scope at injection point

### Attempt 3: Add Debug Force Mask
**Action:** Added `debugForceMask` uniform to bypass masking  
**Result:** No change (shader not executing)  
**Config:** `debugForceMask: true, amplitude: 0.75`

### Attempt 4: Crank Wind Settings
**Action:** Increased amplitude to 0.75, maskScale to 8.0  
**Result:** No change  
**Reasoning:** Make wind obvious if it's working

### Attempt 5: Force Material Recompilation
**Action:** Called `material.markAsDirty(1)` and `markAsDirty(2)`  
**Result:** No change  
**Issue:** Material might not recompile on markAsDirty alone

### Attempt 6: Create MaterialPluginManager
**Action:** Explicitly create `new MaterialPluginManager(material)` if missing  
**Result:** ✅ Plugin manager now exists  
**Issue:** Effect still undefined

### Attempt 7: Check Instance Material
**Action:** Moved probe from template mesh to first instance  
**Result:** Instance has same material and plugins  
**Issue:** Effect still undefined on instance

### Attempt 8: Force Shader Compilation
**Action:** Called `material.forceCompilation(mesh, callback, {useInstances: true})`  
**Result:** ✅ Callback fires but effect still undefined  
**Issue:** Compilation succeeds but effect not accessible via `getEffect()`

---

## Technical Analysis

### Why Effect is Undefined

Possible causes:
1. **Effect not stored on material** - PBRMaterial might store effect elsewhere
2. **Instances don't share effect** - Each instance might need its own effect compile
3. **Effect query timing** - `getEffect()` might return different object than `forceCompilation` creates
4. **Active meshes = 0** - Babylon might not compile shaders for non-rendering meshes
5. **Plugin injection not working** - Custom code might not be injecting properly

### Shader Injection Points

We're using:
- `CUSTOM_VERTEX_DEFINITIONS` - For uniform declarations
- `CUSTOM_VERTEX_UPDATE_POSITION` - For position modification

These should work for PBRMaterial in Babylon 7.0, but we haven't **verified** that the custom code is actually present in the compiled shader.

---

## Current Code State

### GrassWindPlugin.ts
- Extends `MaterialPluginBase`
- Define: `GRASSWIND`
- Priority: 200
- 7 uniforms (time, dir, amplitude, speed, frequency, maskScale, debugForceMask)
- Shader code guarded by `#ifdef GRASSWIND`
- Uses `color.r` for vertex color mask
- Falls back to `positionUpdated.y * grassWindMaskScale`
- Debug force mask: `if (grassWindDebugForceMask > 0.5) windMask = 1.0;`

### applyGrassWind.ts
- Creates `MaterialPluginManager` if missing
- Creates `GrassWindPlugin` instance
- Calls `material.markAsDirty(1)` and `markAsDirty(2)`
- Deduplicates by material uniqueId

### createGrass.ts
- Loads Summergrass.glb via AssetContainer
- Finds grass mesh by name matching
- Calls `applyGrassWindToMesh(grassMesh, GRASS_WIND_CONFIG)`
- Force compiles with `material.forceCompilation(mesh, callback, {useInstances: true})`
- Disables template mesh
- Creates ~33 instances via `createInstance()`
- Instances automatically share material

### GRASS_WIND_CONFIG
```typescript
{
  windDir: new Vector2(1, 0.2),
  amplitude: 0.75,      // CRANKED
  speed: 2.5,           // CRANKED
  frequency: 0.6,
  maskScale: 8.0,       // CRANKED
  enabled: true,
  debugForceMask: true  // CRANKED
}
```

---

## Missing Verification Steps

### 1. Verify Shader Source
**Need to check:** Does the compiled shader actually contain our custom code?

**How:**
```typescript
const effect = mat.getEffect();
const vertexSource = effect?._vertexSourceCode;
console.log('Vertex shader contains GRASSWIND:', vertexSource?.includes('GRASSWIND'));
console.log('Vertex shader contains grassWindTime:', vertexSource?.includes('grassWindTime'));
```

### 2. Verify Define is Set
**Need to check:** Is `GRASSWIND` define actually being set to true?

**How:**
```typescript
const defines = mat.getEffect()?.defines;
console.log('All defines:', defines);
console.log('GRASSWIND value:', defines?.GRASSWIND);
```

### 3. Verify prepareDefines is Called
**Need to check:** Is our `prepareDefines()` method actually being invoked?

**How:** Add console.log in GrassWindPlugin.prepareDefines()

### 4. Verify bindForSubMesh is Called
**Need to check:** Are uniforms being updated every frame?

**How:** Add console.log in GrassWindPlugin.bindForSubMesh() (throttled)

### 5. Check Effect on SubMesh
**Need to check:** Maybe effect lives on SubMesh, not Material?

**How:**
```typescript
const subMesh = instance.subMeshes[0];
const effect = subMesh.effect;
console.log('SubMesh effect:', effect, effect?.isReady());
```

---

## Babylon.js Version Specifics

**Using:** @babylonjs/core: ^7.0.0

**Known issues with plugins in Babylon 7:**
- MaterialPluginBase API stable since 5.0
- PBRMaterial should support plugins natively
- glTF-imported materials might need pluginManager initialization (we do this)
- Effect storage might differ between Babylon 6 → 7

---

## Next Debugging Steps

### Priority 1: Verify Shader Compilation
Add to createGrass.ts after forceCompilation:
```typescript
const mat: any = grassMesh.material;
const effect = mat._activeEffect || mat.getEffect();
if (effect) {
  console.log('[DEBUG] Effect exists:', effect);
  console.log('[DEBUG] Effect ready:', effect.isReady());
  console.log('[DEBUG] Vertex source includes GRASSWIND:', 
    effect._vertexSourceCode?.includes('GRASSWIND'));
  console.log('[DEBUG] Defines:', effect.defines);
} else {
  console.log('[DEBUG] No effect found on material');
}
```

### Priority 2: Check for Shader Compilation Errors
```typescript
scene.onAfterRenderObservable.addOnce(() => {
  const engine = scene.getEngine();
  console.log('[DEBUG] Compile errors:', engine.getCompilationErrors());
});
```

### Priority 3: Verify Plugin Methods Are Called
Add to GrassWindPlugin.ts:
```typescript
prepareDefines(defines, _scene, _mesh): void {
  console.log('[GrassWind] prepareDefines called, setting GRASSWIND:', this._enabled);
  defines['GRASSWIND'] = this._enabled;
}

bindForSubMesh(uniformBuffer): void {
  if (!this._enabled) return;
  console.log('[GrassWind] bindForSubMesh called, time:', this._time);
  // ... rest of method
}
```

### Priority 4: Test with Simple Mesh
**Hypothesis:** Issue is specific to instanced meshes or glTF materials

**Test:** Create a simple box with StandardMaterial, apply plugin, see if that works
```typescript
const testBox = MeshBuilder.CreateBox('test', {}, scene);
const testMat = new StandardMaterial('test', scene);
testBox.material = testMat;
applyGrassWindToMesh(testBox, GRASS_WIND_CONFIG);
```

---

## Alternate Approaches if Plugin Fails

### Option 1: Use ShaderMaterial
Skip MaterialPluginBase entirely, write full vertex/fragment shaders with instancing support manually.

**Pros:** Full control  
**Cons:** Lose PBR lighting, more complex

### Option 2: Use NodeMaterial
Visual shader editor approach, export to code.

**Pros:** Editor support  
**Cons:** Overkill for simple wind

### Option 3: Pre-baked Animation
Vertex animation texture or morph targets.

**Pros:** Guaranteed to work  
**Cons:** Not dynamic, memory cost

### Option 4: Compute Shader Displacement
Use compute shader to modify vertex buffer.

**Pros:** Very fast  
**Cons:** WebGPU only, complex setup

---

## Questions to Answer

1. **Does `forceCompilation` actually compile with plugin code?**
   - Callback fires but effect is undefined
   - Need to verify shader source contains our code

2. **Why is `getEffect()` returning undefined?**
   - Material might use different property (`_activeEffect`?)
   - Effect might be on SubMesh not Material
   - PBRMaterial might have different effect access pattern

3. **Why Active Meshes = 0?**
   - Camera not looking at grass?
   - Frustum culling too aggressive?
   - Instances not marked as renderable?
   - This might be red herring (grass might be out of view initially)

4. **Is the plugin system even compatible with glTF-imported PBRMaterial?**
   - Documentation says yes
   - We created pluginManager successfully
   - Plugin is in the list
   - But effect compilation seems broken

---

## Similar Working Examples

Need to find a working example of MaterialPluginBase with:
- PBRMaterial (not StandardMaterial)
- Instanced meshes (createInstance, not thin instances)
- Vertex position modification
- Babylon 7.0

**Known examples:**
- PBR plugins: ClearCoat, Anisotropic, Sheen (all work, visible in our plugin list)
- Those are built-in and may have special handling

---

## Wild Card Theories

### Theory 1: Plugin Priority Conflict
Our priority is 200, built-in PBR plugins might conflict.
**Test:** Try priority 1000 (after all PBR plugins)

### Theory 2: Resolve Includes
Our `resolveIncludes` is default (true?). Maybe set to false?
**Test:** Set `this.resolveIncludes = false` in constructor

### Theory 3: Shader Language
PBR might use WGSL not GLSL?
**Test:** Check `material.getClassName()`, verify shader language

### Theory 4: Double Plugin Registration
Maybe plugin is registering twice and breaking?
**Evidence:** Our dedupe logic should prevent this
**Test:** Check `_plugins` array for duplicates

### Theory 5: Effect Cache Issue
Babylon might be caching old effect without plugin.
**Test:** Clear material effect cache: `material._effect = null`

---

## Recommendation

**Immediate next step:** Add vertex shader source logging to confirm whether our custom code is even in the compiled shader.

If our code IS in the shader → Problem is with uniform binding or rendering  
If our code is NOT in the shader → Problem is with plugin registration/injection

This will cut the debugging space in half.

---

**End of debugging summary**
