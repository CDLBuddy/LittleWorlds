# Babylon.js Feature Audit Report
**Project:** Little Worlds  
**Babylon.js Version:** 7.0.0 (core), 7.54.3 (materials)  
**Date:** January 10, 2026  
**Audit Scope:** Complete src/ directory analysis

> **📊 Related Reports:**
> - [Performance & Optimization Audit](BABYLONJS_PERFORMANCE_AUDIT.md) - Performance risks and high-ROI feature recommendations

---

## Executive Summary

| Feature Category | Status | Usage Level | Notes |
|-----------------|--------|-------------|-------|
| **Physics Engine** | ❌ NO | None | No physics plugin detected |
| **Character Movement** | ✅ YES | Transform-based | Custom velocity + raycasting |
| **Materials System** | ✅ YES | StandardMaterial only | No PBR materials in use |
| **Shadows** | ❌ NO | None | No shadow generators found |
| **Global Illumination** | ❌ NO | None | Not implemented |
| **Animation System** | ✅ YES | Full | AnimationGroups + manual animations |
| **Particle Systems** | ✅ YES | Moderate | CPU particles only |
| **Inspector/Debug** | ❌ NO | None | Custom debug tools instead |
| **GUI System** | ⚠️ PARTIAL | HTML Overlay | React-based UI, no Babylon GUI |
| **Instancing** | ✅ YES | Standard instancing | createInstance() pattern |
| **WebGPU** | ❌ NO | Not ready | GLSL shaders only |
| **Scene Optimization** | ✅ YES | Selective | Freezing, culling, no LOD/octrees |
| **Asset Loading** | ✅ YES | SceneLoader + AssetContainer | GLB/FBX support |
| **Camera System** | ✅ YES | ArcRotateCamera | Custom third-person rig |
| **Post-Processing** | ❌ NO | Disabled | Config exists but unused |
| **Audio Engine** | ✅ YES | Web Audio API | Custom system, not Babylon Sound |
| **Lighting** | ✅ YES | Standard lights | Hemispheric, Directional, Point |
| **Sky System** | ✅ YES | PhotoDome | Panoramic skyboxes |

---

## 1. Physics Engine / Plugin Usage

**Status:** ❌ **NOT IN USE**

### Findings:
- **No physics plugin detected** (Cannon, Ammo, Havok, etc.)
- Search for `Physics`, `Cannon`, `Ammo`, `Havok`, `PhysicsImpostor`, `PhysicsAggregate` yielded only:
  - Comment in [controller.ts](src/game/entities/player/controller.ts#L605): `// ---- Movement + physics`
  - Unrelated match: `'Ammo for the slingshot'` in items content

### Implications:
- No rigid body dynamics
- No collision physics engine
- Manual collision detection via raycasting

---

## 2. Character Movement Approach

**Status:** ✅ **VELOCITY-BASED TRANSFORM MOVEMENT**

### Implementation Details:

#### Player Controller ([controller.ts](src/game/entities/player/controller.ts))
```typescript
// Line 97-102
private velocity = Vector3.Zero();
private verticalVelocity = 0;

// Line 688
const move = this.v3a.copyFrom(this.velocity).scaleInPlace(dt);

// Line 775
this.grounded = pos.y <= feetY + epsilon && this.verticalVelocity <= 0;

// Line 781
this.verticalVelocity = this.jumpSpeed;
```

**Pattern:** 
- Velocity-based movement with custom gravity simulation
- Manual grounding detection via downward raycasts ([Line 642-650](src/game/entities/player/controller.ts#L642-L650))
- Jump mechanics using `verticalVelocity` accumulator
- Collision detection via multi-point raycast sweep ([Line 650+](src/game/entities/player/controller.ts#L650))

#### Companion AI ([Companion.ts](src/game/entities/companion/Companion.ts))
```typescript
// Line 255, 271
this.mesh.position.addInPlace(result.velocity.scale(dt));
```

**Pattern:**
- Steering behavior system ([steering.ts](src/game/entities/companion/steering.ts))
- Direct position manipulation, no physics
- Custom FSM (Follow, Sniff, Lead, Celebrate states)

### Raycasting for Ground Detection:
- [controller.ts Line 642](src/game/entities/player/controller.ts#L642): `scene.pickWithRay(ray, (m) => this.isWalkableMesh(m))`
- [samplers.ts Line 69](src/game/terrain/grass/terrain/samplers.ts#L69): Terrain height sampling

**No Physics Engine:** All movement is purely transform-based with manual collision resolution.

---

## 3. Materials System

**Status:** ⚠️ **STANDARD MATERIALS ONLY - NO PBR**

### Material Usage:

#### StandardMaterial Dominance:
Found **100+ instances** of `StandardMaterial` usage across the codebase:

**Examples:**
- [WoodlineWorld.ts](src/game/worlds/woodline/WoodlineWorld.ts#L71-L81):
```typescript
const groundMat = new StandardMaterial('groundMat', scene);
groundMat.diffuseColor = new Color3(0.25, 0.30, 0.18); // Forest floor green
groundMat.specularColor = new Color3(0, 0, 0); // No specular
```

- [DuskWorld.ts](src/game/worlds/dusk/DuskWorld.ts) - All props use StandardMaterial
- [PineWorld.ts](src/game/worlds/pine/PineWorld.ts) - Forest environment uses StandardMaterial
- [NightWorld.ts](src/game/worlds/night/NightWorld.ts) - 50+ StandardMaterial instances

#### Material Patterns:
1. **Color-based materials:** Solid colors via `diffuseColor`, no textures
2. **Emissive for glow:** `emissiveColor` for fireflies, flames, glowing objects
3. **Alpha blending:** Used for gates, fog walls ([WoodlineWorld.ts Line 610](src/game/worlds/woodline/WoodlineWorld.ts#L610))
4. **Material caching:** [MaterialCache.ts](src/game/worlds/pine/utils/MaterialCache.ts) prevents duplication

#### Texture Usage (Minimal):
- [BillboardCloudSystem.ts](src/game/systems/sky/BillboardCloudSystem.ts#L115-L136): Cloud textures
```typescript
const tex = new Texture(this.withBase(url), this.scene, false, true);
mat.emissiveTexture = tex;
mat.useAlphaFromDiffuseTexture = true;
```
- Particle textures ([particles.ts](src/game/systems/fx/particles.ts#L14))
- Sky panorama textures (PhotoDome)

### No PBR Materials:
- **Zero instances** of `PBRMaterial`, `PBRMetallicRoughness`, `PBRSpecularGlossiness`
- No IBL (Image-Based Lighting) or `environmentTexture`
- Art style is low-poly, color-based (no photorealism)

### Custom Material Plugin:
**GrassWindPlugin** ([GrassWindPlugin.ts](src/game/terrain/grass/GrassWindPlugin.ts))
```typescript
// Custom MaterialPluginBase for vertex-based wind animation
// Compatible with StandardMaterial + instancing
// GLSL shader injection for procedural grass movement
```
- Uses `MaterialPluginBase` API
- Injects custom vertex shader code via `CUSTOM_VERTEX_UPDATE_POSITION`
- Uniform-driven animation (time, wind direction, amplitude)

---

## 4. Shadows Configuration

**Status:** ❌ **NOT IMPLEMENTED**

### Findings:
- **Zero instances** of `ShadowGenerator`, `CascadedShadowGenerator`, or `shadowMap`
- Quality presets reference shadows ([qualityPresets.ts](src/game/config/qualityPresets.ts#L9)):
```typescript
shadows: boolean; // Property exists but never used
```

### Receiver Settings:
Multiple meshes configured with `receiveShadows = true` in loaders:
- [gltf.ts Line 52](src/game/assets/loaders/gltf.ts#L52)
- [fbx.ts Line 51](src/game/assets/loaders/fbx.ts#L51)

**However:** No shadow casters configured, so `receiveShadows` has no effect.

### Recommendation:
Shadow system prepared but never activated. Likely omitted for performance on mobile/iPad targets.

---

## 5. Global Illumination Usage

**Status:** ❌ **NOT IN USE**

### Findings:
- No references to GI techniques (light probes, reflection probes, baked lighting)
- No `environmentTexture` for IBL
- Lighting is direct only (HemisphericLight + DirectionalLight)

---

## 6. Animation System

**Status:** ✅ **FULLY IMPLEMENTED**

### AnimationGroup Usage:

#### Player Animations ([Player.ts](src/game/entities/player/Player.ts))
```typescript
// Line 21-22
private animations = new Map<string, AnimationGroup>();
private currentAnimation: AnimationGroup | null = null;

// Line 108
this.setupAnimations(result.animationGroups);

// Line 136-140 - Name-based animation mapping
if (name.match(/idle/i)) this.animations.set('idle', group);
if (name.match(/walk/i)) this.animations.set('walk', group);
if (name.match(/celebrate/i)) this.animations.set('celebrate', group);
```

**Pattern:**
- Loads animations from FBX/GLB via `SceneLoader.ImportMeshAsync`
- Heuristic name matching (`/idle/i`, `/walk/i`, `/celebrate/i`)
- State machine controls playback (idle, walk, celebrate)

#### Companion Animations ([Companion.ts](src/game/entities/companion/Companion.ts))
```typescript
// Line 47-48
private animations: Map<string, AnimationGroup> = new Map();
private currentAnimation: AnimationGroup | null = null;

// Line 144-176 - Animation setup + fallback logic
setupAnimations(animationGroups: AnimationGroup[]): void {
  // Maps animations, warns if none found
  // Falls back to first animation as 'idle'
}

// Line 362 - OnAnimationGroupEndObservable usage
celebrateAnim.onAnimationGroupEndObservable.addOnce(() => {
  this.playAnimation('idle', true);
});
```

### Manual Animations:

#### Babylon.Animation API ([wakeRadius.ts](src/game/systems/interactions/wakeRadius.ts#L72-L87))
```typescript
const animationScale = new Animation(
  'wakeScale',
  'scaling',
  60,
  Animation.ANIMATIONTYPE_VECTOR3,
  Animation.ANIMATIONLOOPMODE_CONSTANT
);
animationScale.setKeys(keys);
mesh.animations = [animationScale];
this.scene.beginAnimation(mesh, 0, 12, false);
```

**Pattern:**
- "Pop" animation when interactables wake up
- Keyframe-based scaling (0.85 → 1.0 over 0.2s)

### Animation Warnings:
Both Player and Companion have debug warnings if animations fail to load from FBX/GLB:
- [Player.ts Line 122-127](src/game/entities/player/Player.ts#L122-L127)
- [Companion.ts Line 145-151](src/game/entities/companion/Companion.ts#L145-L151)

**Suggests:** Instructions for Blender export settings (NLA Tracks, Include Animations)

---

## 7. Particle Systems

**Status:** ✅ **CPU PARTICLES IN USE**

### ParticleSystem Implementations:

#### Campfire Particles ([Campfire.ts](src/game/entities/props/Campfire.ts))
```typescript
// Line 75-111
this.particleSystem = new ParticleSystem('campfireParticles', 250, this.scene);
this.particleSystem.emitter = this.mesh.position.add(new Vector3(0, 0.5, 0));
this.particleSystem.minEmitBox = new Vector3(-0.3, 0, -0.3);
this.particleSystem.maxEmitBox = new Vector3(0.3, 0, 0.3);
this.particleSystem.emitRate = 50;

// Colors
this.particleSystem.color1 = new Color4(1.0, 0.4, 0.1, 1.0); // Orange
this.particleSystem.color2 = new Color4(1.0, 0.7, 0.2, 1.0); // Yellow-orange
this.particleSystem.colorDead = new Color4(0.5, 0.1, 0.0, 0.0); // Fade to dark red

// Physics
this.particleSystem.direction1 = new Vector3(-0.3, 1.5, -0.3);
this.particleSystem.direction2 = new Vector3(0.3, 2.5, 0.3);
this.particleSystem.gravity = new Vector3(0, -0.5, 0);
```

#### Confetti FX ([FxSystem.ts](src/game/systems/fx/FxSystem.ts))
```typescript
// Line 17-54
const particleSystem = new ParticleSystem('confetti', 250, this.scene);
particleSystem.targetStopDuration = 0.2; // Stop emitting after 0.2s
particleSystem.disposeOnStop = true; // Auto-cleanup
```

**Pattern:**
- Burst effect for task completion
- Auto-disposal after emission stops

#### Particle Factory ([particles.ts](src/game/systems/fx/particles.ts))
```typescript
export function createParticleSystem(
  scene: Scene,
  emitter: Vector3,
  capacity: number
): ParticleSystem {
  const particles = new ParticleSystem('particles', capacity, scene);
  particles.particleTexture = new Texture('textures/particle.png', scene);
  particles.blendMode = ParticleSystem.BLENDMODE_ADD;
  return particles;
}
```

### No GPU Particles:
- **Zero instances** of `GPUParticleSystem`
- All particles are CPU-based
- No WebGPU optimization

### Particle Count:
- Campfire: 250 particles
- Confetti: 250 particles
- Generic factory: Configurable capacity

---

## 8. Inspector / Debug Tools Integration

**Status:** ❌ **BABYLON INSPECTOR NOT USED**

### Findings:
- **Zero instances** of `Inspector`, `debugLayer`, or `scene.debugLayer`
- No imports from `@babylonjs/inspector`

### Custom Debug Tools:

#### DebugOverlay ([DebugOverlay.ts](src/game/debug/DebugOverlay.ts))
```typescript
// Custom HTML overlay showing:
// - FPS, draw calls, active meshes
// - Player position, velocity
// - Task progress
```

#### WorldEditor ([WorldEditor.ts](src/game/debug/WorldEditor.ts))
```typescript
// Custom in-game editor (DEV mode only):
// - Click to select meshes (Ctrl+Click)
// - Gizmo manipulation (Shift+Click)
// - Copy position/rotation to clipboard
// - Keyboard shortcuts (G=toggle grid, H=toggle commands)
```
- [Line 147-149](src/game/debug/WorldEditor.ts#L147-L149): Toggle visibility hotkeys

#### Other Debug Tools:
- [CompanionDebugHelper.ts](src/game/debug/CompanionDebugHelper.ts) - Companion FSM visualization
- [PlayerDebugHelper.ts](src/game/debug/PlayerDebugHelper.ts) - Player capsule visualization
- [SwitchDebugOverlay.tsx](src/game/debug/SwitchDebugOverlay.tsx) - Character switching UI
- [perfSnapshot.ts](src/game/debug/perfSnapshot.ts) - Performance profiling

**Rationale:** Custom tools provide game-specific context that Inspector doesn't offer.

---

## 9. GUI Approach

**Status:** ⚠️ **HTML OVERLAY (React) - NO BABYLON GUI**

### Findings:
- **Zero instances** of `AdvancedDynamicTexture`, `Button`, `TextBlock`, or `@babylonjs/gui`
- Search results show only React components:
  - `<button>` elements in React JSX (100+ matches)
  - UI screens: [TitleScreen.tsx](src/ui/screens/TitleScreen.tsx), [PauseMenu.tsx](src/ui/screens/PauseMenu.tsx), [InventoryPanel.tsx](src/ui/inventory/InventoryPanel.tsx)

### UI Architecture:

#### React-based Overlay:
```typescript
// GameHost.tsx - Renders React UI over canvas
<canvas ref={canvasRef} className="game-canvas" />
<HUD />
<InventoryHUD />
<PauseMenu />
<ToastOverlay />
```

#### Communication:
- Event bus connects game logic to React UI
- UI emits events like `'ui/callCompanion'`, `'ui/audio/unlock'`
- [GameApp.ts Line 93-136](src/game/GameApp.ts#L93-L136): Event subscriptions

### No 3D GUI:
- No mesh-based UI elements
- No `GUI3DManager`, `HolographicButton`, etc.

**Decision Rationale:** React provides better tooling and responsive design for game menus.

---

## 10. Instancing Strategy

**Status:** ✅ **STANDARD INSTANCING (createInstance)**

### Implementation:

#### Grass Instancing ([createGrassField.ts](src/game/terrain/grass/createGrassField.ts))
```typescript
// Line 186
const instance = templateMesh.createInstance(`grass_${pos.i}_${pos.j}`);

// Line 95 - Template mesh is hidden
templateMesh.setEnabled(false);

// Line 44 - Comment confirms approach
// - Standard instancing via createInstance (no thin instances)
```

#### Vegetation Instancing:
- [createTallGrass.ts Line 78](src/game/worlds/dusk/vegetation/createTallGrass.ts#L78): Grass blades
- [createWildflowers.ts Line 75](src/game/worlds/dusk/vegetation/createWildflowers.ts#L75): Flowers
- [createFireflies.ts Line 32](src/game/worlds/dusk/fx/createFireflies.ts#L32): Firefly instances

#### Fence Pickets ([fence.ts](src/game/worlds/backyard/props/fence.ts))
```typescript
// Line 55
const picket = picketTemplate.createInstance(`${name}_picket_${i}`);

// Line 100
picketTemplate.setEnabled(false); // Template is not rendered
```

### No Thin Instances:
- **Zero instances** of `thinInstanceAdd`, `thinInstanceSetBuffer`, or `ThinInstancesManager`
- No Solid Particle System (SPS)

### Optimization Pattern:
- Base mesh (`Mesh`) serves as template
- `createInstance()` creates lightweight copies
- Template hidden via `setEnabled(false)`
- Instances share geometry and material

**Performance:** Works well for current scale (100s of instances), but thin instances would offer better performance at 1000+ scale.

---

## 11. WebGPU Usage / Readiness

**Status:** ❌ **NOT WEBGPU READY**

### Findings:

#### GLSL-Only Shaders:
[GrassWindPlugin.ts Line 48-51](src/game/terrain/grass/GrassWindPlugin.ts#L48-L51):
```typescript
/**
 * Plugin is compatible with GLSL only (WebGPU WGSL support can be added in future phase)
 */
isCompatible(shaderLanguage: ShaderLanguage) {
  return shaderLanguage === ShaderLanguage.GLSL;
}
```

#### Shader Code:
[GrassWindPlugin.ts Line 102-122](src/game/terrain/grass/GrassWindPlugin.ts#L102-L122):
```typescript
getCustomCode(shaderType: string, shaderLanguage: ShaderLanguage) {
  if (shaderType !== 'vertex' || shaderLanguage !== ShaderLanguage.GLSL) return null;
  
  return {
    CUSTOM_VERTEX_UPDATE_POSITION: `
      #ifdef GRASSWIND
        // GLSL vertex shader code for wind animation
      #endif
    `,
  };
}
```

### WebGPU Engine Check:
- **No usage** of `engine.isWebGPU`, `WebGPUEngine`, or `createAsync`
- Engine initialized as standard WebGL: [GameApp.ts Line 77-81](src/game/GameApp.ts#L77-L81)
```typescript
this.engine = new Engine(canvas, true, {
  preserveDrawingBuffer: false,
  stencil: false,
  antialias: true,
});
```

### Implications:
- Project currently runs on WebGL only
- Custom shaders would need WGSL translation for WebGPU
- No GPU particle systems (would benefit from WebGPU compute)

---

## 12. Scene Optimization Features

**Status:** ✅ **SELECTIVE OPTIMIZATIONS**

### Implemented Optimizations:

#### 1. World Matrix Freezing
**Usage:** Extensive throughout worlds

[WoodlineWorld.ts Lines 331-342](src/game/worlds/woodline/WoodlineWorld.ts#L331-L342):
```typescript
// Freeze static environment meshes
ground.freezeWorldMatrix();
clearing.freezeWorldMatrix();
allTrees.forEach(t => {
  if (t instanceof AbstractMesh) t.freezeWorldMatrix();
});

// Freeze materials that never change
groundMat.freeze();
clearingMat.freeze();
```

**Other Instances:**
- [BackyardWorld.ts Lines 101-109](src/game/worlds/backyard/BackyardWorld.ts#L101-L109)
- [CreekWorld.ts Lines 265-269](src/game/worlds/creek/CreekWorld.ts#L265-L269)
- [createTallGrass.ts Line 97](src/game/worlds/dusk/vegetation/createTallGrass.ts#L97)

**Pattern:**
- Applied to static meshes (terrain, trees, props)
- Prevents unnecessary matrix recalculations
- Commented exclusions for dynamic objects (water, bridges)

#### 2. Distance-Based Culling
[CullingSystem.ts](src/game/systems/perf/culling.ts):
```typescript
export class CullingSystem {
  update(cameraPosition: Vector3, aggressiveCulling = false): void {
    const effectiveCullDistance = aggressiveCulling
      ? this.cullDistance * 0.7
      : this.cullDistance;
    // Disable meshes beyond cull distance
  }
}
```

#### 3. Back-Face Culling
- [createTallGrass.ts Line 31](src/game/worlds/dusk/vegetation/createTallGrass.ts#L31): `mat.backFaceCulling = false;` for grass
- [BillboardCloudSystem.ts Line 124](src/game/systems/sky/BillboardCloudSystem.ts#L124): `mat.backFaceCulling = false;` for clouds

### NOT Implemented:

#### No LOD (Level of Detail):
- **Zero instances** of `LOD`, `addLODLevel`, or distance-based mesh swapping
- No LOD tiers mentioned in grass system ([createGrassField.ts Line 45](src/game/terrain/grass/createGrassField.ts#L45))

#### No Octrees:
- **Zero instances** of `octree`, `createOrUpdateSubmeshesOctree`, or spatial partitioning
- Scene uses default frustum culling only

#### No Scene-Wide Optimizations:
- No `scene.autoClear = false`
- No `scene.autoClearDepthAndStencil`
- No render target optimizations

### Quality Presets:
[qualityPresets.ts](src/game/config/qualityPresets.ts):
```typescript
export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    maxDPR: 1,
    shadows: false,
    particles: false,
    antialiasing: false,
    postProcessing: false,
    maxLights: 2,
  },
  medium: { maxDPR: 1.5, shadows: true, particles: true, maxLights: 4 },
  high: { maxDPR: 2, shadows: true, particles: true, maxLights: 8 },
};
```

**Note:** Shadows and post-processing configured but not implemented.

---

## 13. Asset Loading Approach

**Status:** ✅ **SCENELOADER + ASSETCONTAINER**

### Loading Patterns:

#### SceneLoader.ImportMeshAsync (Direct Import)
[gltf.ts Lines 39-69](src/game/assets/loaders/gltf.ts#L39-L69):
```typescript
export async function loadGlb(
  scene: Scene,
  url: string,
  opts?: { name?: string; isPickable?: boolean; receiveShadows?: boolean }
): Promise<GltfLoadResult> {
  const result = await SceneLoader.ImportMeshAsync('', '', url, scene);
  
  // Create root transform node
  const root = new TransformNode(`${name}_root`, scene);
  
  // Parent all meshes to root
  result.meshes.forEach((mesh) => {
    if (mesh.parent === null) mesh.parent = root;
    if (mesh instanceof AbstractMesh) {
      mesh.isPickable = isPickable;
      mesh.receiveShadows = receiveShadows;
      meshes.push(mesh);
    }
  });
  
  return { root, meshes, animationGroups: result.animationGroups || [] };
}
```

**FBX Support:** [fbx.ts](src/game/assets/loaders/fbx.ts) - Identical pattern for FBX files

#### LoadAssetContainerAsync (Container-Based)
[loadContainer.ts](src/game/worlds/woodline/models/loadContainer.ts):
```typescript
import { loadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';

const container = await loadAssetContainerAsync(
  'assets/models/',
  'TreesBushes.glb',
  scene,
  (evt: ISceneLoaderProgressEvent) => {
    const progress = evt.loaded / evt.total;
    onProgress?.(evt);
  }
);
```

**Other Instances:**
- [BackyardWorld Line 98-174](src/game/worlds/backyard/models/loadContainer.ts)
- [CreekWorld Line 27](src/game/worlds/creek/models/loadContainer.ts)
- [PineWorld Line 23](src/game/worlds/pine/terrain/createGrass.ts#L23)

#### Legacy SceneLoader.ImportMesh (Callback-Based)
[WoodlineWorld.ts Line 98](src/game/worlds/woodline/WoodlineWorld.ts#L98):
```typescript
SceneLoader.ImportMesh('', 'assets/models/', 'TreesBushes.glb', scene, (meshes: AbstractMesh[]) => {
  // Callback-based loading (older pattern)
});
```

### Loader Imports:
```typescript
import '@babylonjs/loaders/glTF';  // GLB/GLTF support
import '@babylonjs/loaders';       // FBX support
```

### Asset Types:
- **GLB:** Primary format for models (player, companion, trees, props)
- **FBX:** Legacy support (some assets)
- **Textures:** PNG for UI, clouds, particles
- **Audio:** OGG format (Web Audio API)

### No AssetManager:
- **Zero instances** of `AssetsManager`, `addMeshTask`, `load()`, etc.
- All loading is direct via `SceneLoader` or async/await

---

## 14. Camera Types and Configurations

**Status:** ✅ **ARCROTATECAMERA (THIRD-PERSON RIG)**

### Implementation:

#### CameraRig System ([CameraRig.ts](src/game/systems/camera/CameraRig.ts))
```typescript
// Line 70
private camera: ArcRotateCamera;

// Line 179-187
this.camera = new ArcRotateCamera(
  'camera',
  0,                // alpha
  Math.PI / 3,      // beta (45 degrees)
  8,                // radius
  Vector3.Zero(),   // target
  scene
);
this.camera.attachControl(canvas, true);
```

### Camera Modes:
```typescript
// Line 137 - Camera presets
private readonly presets: Record<CameraMode, CameraSettings> = {
  FOLLOW: { radius: 8, beta: Math.PI / 3 },
  EXPLORE: { radius: 10, beta: Math.PI / 3 + 0.2 },
  CELEBRATE: { radius: 12, beta: Math.PI / 3 - 0.15 }
};
```

### Camera Features:

#### 1. Dynamic Framing
[CameraRig.ts Lines 307-397](src/game/systems/camera/CameraRig.ts#L307-L397):
- Player yaw tracking
- Smooth alpha/beta interpolation
- Auto-return to "behind player" position
- Celebrate mode with orbital rotation

#### 2. Spawn Alignment
[CameraRig.ts Lines 219-237](src/game/systems/camera/CameraRig.ts#L219-L237):
```typescript
/**
 * Snap camera to align with player's spawn forward direction
 */
snapToSpawnForward(spawnPos: Vector3, spawnForward: Vector3): void {
  const desiredAlpha = CameraRig.alphaFromToCameraDir(this._tmpA);
  this.camera.alpha = desiredAlpha; // Instant snap, no inertia
  this.behindAlpha = desiredAlpha;
}
```

#### 3. User Control Constraints
```typescript
// Line 190-193
this.camera.lowerRadiusLimit = this.minRadius;
this.camera.upperRadiusLimit = this.maxRadius;
this.camera.lowerBetaLimit = this.minBeta;
this.camera.upperBetaLimit = this.maxBeta;

// Line 197
this.camera.panningSensibility = 0; // Disable panning
```

### No Other Camera Types:
- **No FreeCamera**, **FollowCamera**, **UniversalCamera**
- Single ArcRotateCamera for entire game
- Mode switching via internal state machine

### Camera Input:
[CameraRig.ts Lines 407-416](src/game/systems/camera/CameraRig.ts#L407-L416):
```typescript
lockUserInputs(lock: boolean): void {
  if (lock) {
    this.camera.inputs.clear();
  } else {
    this.camera.inputs.addMouseWheel();
    this.camera.inputs.addPointers();
  }
}
```

**Pattern:** Inputs can be locked during cinematics or UI interactions.

---

## 15. Post-Processing Effects

**Status:** ❌ **CONFIGURED BUT DISABLED**

### Findings:

#### Quality Preset Configuration
[qualityPresets.ts Line 13, 42](src/game/config/qualityPresets.ts):
```typescript
export interface QualityPreset {
  postProcessing: boolean;
}

high: {
  postProcessing: true,  // Configured for high quality
}
```

#### No Pipeline Implementation:
- **Zero instances** of `DefaultRenderingPipeline`, `SSAO2RenderingPipeline`, `DepthOfFieldEffect`
- **No PostProcess** classes: `BlurPostProcess`, `BloomEffect`, `FxaaPostProcess`, etc.
- Search for "PostProcess" yielded only 7 matches—all in quality preset definitions

### Scene Effects Used:

#### Fog
Implemented across all worlds:
```typescript
scene.fogMode = Scene.FOGMODE_EXP2;
scene.fogDensity = 0.015;
scene.fogColor = new Color3(0.40, 0.34, 0.55);
```

#### Glow Layer
[DuskWorld.ts Lines 26, 134](src/game/worlds/dusk/DuskWorld.ts):
```typescript
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';

const glow = new GlowLayer('dusk_glow', scene);
glow.intensity = 0.4;
```
**Usage:** Firefly glow effect in Dusk world only

### Recommendation:
Post-processing intentionally omitted for performance. GlowLayer provides sufficient visual interest without expensive post-process passes.

---

## 16. Audio Engine Usage

**Status:** ✅ **CUSTOM WEB AUDIO API (NOT BABYLON SOUND)**

### Implementation:

#### Custom AudioSystem ([AudioSystem.ts](src/game/systems/audio/AudioSystem.ts))
```typescript
// Line 30-39
private context: AudioContext | null = null;
private masterGain: GainNode | null = null;
private sfxGain: GainNode | null = null;
private musicGain: GainNode | null = null;

constructor(config: Partial<AudioConfig> = {}) {
  this.config = { ...DEFAULT_CONFIG, ...config };
}
```

### Audio Graph:
```
AudioContext
  ├─ masterGain (master volume)
     ├─ sfxGain (sound effects bus)
     └─ musicGain (music/ambience bus)
```

### Audio Loading ([audio.ts](src/game/assets/loaders/audio.ts))
```typescript
// Line 39-46
async loadSound(key: string, url: string): Promise<void> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  this.sounds.set(key, audioBuffer);
}
```

### Playback Methods:

#### One-Shot SFX
[AudioSystem.ts Lines 166-188](src/game/systems/audio/AudioSystem.ts#L166-L188):
```typescript
playSfx(key: string, volume: number = 1.0): void {
  const buffer = this.loadedSounds.get(key);
  const source = this.context.createBufferSource();
  source.buffer = buffer;
  
  const gain = this.context.createGain();
  gain.gain.value = volume;
  
  source.connect(gain);
  gain.connect(this.sfxGain);
  source.start();
}
```

#### Looping Audio (Music/Ambience)
[AudioSystem.ts Lines 190-226](src/game/systems/audio/AudioSystem.ts#L190-L226):
```typescript
playLoop(key: string, fadeInMs: number = 0): LoopHandle {
  const source = this.context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  
  const gain = this.context.createGain();
  gain.connect(this.musicGain);
  source.connect(gain);
  source.start();
  
  return {
    stop: (fadeOutMs: number = 0) => { /* fade-out logic */ }
  };
}
```

### No Babylon Sound:
- **Zero instances** of `Sound`, `SoundTrack`, `SpatialSound`, or `@babylonjs/core/Audio`
- All audio via Web Audio API primitives

### Audio Content:
[sfx.ts](src/game/systems/audio/sfx.ts):
```typescript
export const SFX_KEYS = {
  PICKUP: 'sfx_pickup',
  UNLOCK: 'sfx_unlock',
  WHOOSH: 'sfx_whoosh',
  // ... 20+ sound effects
};

export const AMBIENT_KEYS = {
  BIRDS: 'amb_birds',
  CREEK: 'amb_creek',
  WIND: 'amb_wind',
  // ... ambient loops
};
```

### Audio Zones:
[zones.ts](src/game/systems/audio/zones.ts):
```typescript
export interface AudioZone {
  center: Vector3;
  radius: number;
  soundKey: string;
  maxVolume: number;
}

// Position-based volume calculation
// Closest zone wins (no true 3D spatialization)
```

---

## 17. Lighting System

**Status:** ✅ **STANDARD LIGHTS IN USE**

### Light Types Used:

#### 1. HemisphericLight (Ambient Fill)
[BootWorld.ts Lines 54-58](src/game/worlds/BootWorld.ts#L54-L58):
```typescript
const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.5;
hemiLight.diffuse = new Color3(0.9, 0.9, 1.0);
hemiLight.groundColor = new Color3(0.4, 0.3, 0.2);
hemiLight.specular = new Color3(0, 0, 0);
```

**Usage:**
- All worlds have hemispheric light
- Provides soft ambient illumination
- Sky color (diffuse) + ground reflection (groundColor)

#### 2. DirectionalLight (Sun/Moon)
[DuskWorld.ts Lines 85-89](src/game/worlds/dusk/DuskWorld.ts#L85-L89):
```typescript
const sun = new DirectionalLight('dusk_sun', DUSK.SUN_DIR, scene);
sun.intensity = DUSK.SUN_INTENSITY;
sun.diffuse = new Color3(1.0, 0.85, 0.6); // Warm golden hour
sun.specular = new Color3(0.3, 0.25, 0.15);
```

**Usage:**
- Key light for outdoor worlds
- Directional shadows (not enabled)
- Time-of-day simulation via direction + color

[NightWorld.ts Lines 82-87](src/game/worlds/night/NightWorld.ts#L82-L87):
```typescript
const moonlight = new DirectionalLight('night_moon', new Vector3(-0.4, -0.8, 0.3), scene);
moonlight.intensity = 0.3;
moonlight.diffuse = new Color3(0.6, 0.7, 0.9); // Cool blue moonlight
```

#### 3. PointLight (Local Sources)
[Campfire.ts Lines 114-121](src/game/entities/props/Campfire.ts#L114-L121):
```typescript
this.light = new PointLight(
  `${this.id}_light`,
  this.mesh.position.add(new Vector3(0, 1, 0)),
  this.scene
);
this.light.intensity = 2.5;
this.light.range = 10;
this.light.diffuse = new Color3(1.0, 0.5, 0.1); // Warm orange
```

**Other Instances:**
- Firefly lights ([createFireflies.ts Line 72](src/game/worlds/dusk/fx/createFireflies.ts#L72))
- Owl eyes ([NightWorld.ts Line 331](src/game/worlds/night/NightWorld.ts#L331))
- Woodline campfire ([WoodlineWorld.ts Line 487](src/game/worlds/woodline/WoodlineWorld.ts#L487))

### No SpotLight:
- **Zero instances** of `SpotLight` or cone-shaped lights
- No flashlights, searchlights, or stage lighting

### SkySystem Lighting:
[SkySystem.ts Lines 23-24, 238-246](src/game/systems/sky/SkySystem.ts):
```typescript
private sunLight: DirectionalLight | null = null;
private ambientLight: HemisphericLight | null = null;

// Created per world preset
this.sunLight = new DirectionalLight('sunLight', sun.direction, this.scene);
this.ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
```

**Pattern:** Sky system owns and manages global lights for consistency.

### Light Intensity Ranges:
- **Hemispheric:** 0.3-0.8 (ambient fill)
- **Directional:** 0.3-0.7 (key light)
- **Point:** 1.5-3.0 (local accents)

---

## 18. Sky System (PhotoDome)

**Status:** ✅ **PHOTODOME-BASED SKYBOX**

### Implementation:

#### SkySystem Architecture ([SkySystem.ts](src/game/systems/sky/SkySystem.ts))
```typescript
// Line 11
type SkyHandle = {
  dome: PhotoDome;
  worldId: WorldId;
  alpha: number;
};

// Line 16-17
private currentSky: SkyHandle | null = null;
private textureCache = new Map<string, Texture>();
```

#### PhotoDome Creation
[SkySystem.ts Lines 199-218](src/game/systems/sky/SkySystem.ts#L199-L218):
```typescript
private createDome(skyConfig: NonNullable<WorldLookPreset['sky']>): PhotoDome {
  const resolution = this.getDomeResolution();
  
  const dome = new PhotoDome(
    `sky_${worldId}`,
    this.withBase(skyConfig.url),
    {
      resolution,
      size: 1000,
      useDirectMapping: false,
    },
    this.scene
  );
  
  dome.mesh.renderingGroupId = 0; // Render first
  dome.mesh.infiniteDistance = true;
  
  return dome;
}
```

#### Sky Presets ([skyPresets.ts](src/game/systems/sky/skyPresets.ts))
```typescript
export const SKY_PRESETS: Record<WorldId, WorldLookPreset> = {
  backyard: {
    sky: {
      url: 'textures/sky_backyard_morning.jpg',
      rotationY: 0,
      exposure: 1.1,
    },
    fog: { mode: Scene.FOGMODE_EXP2, density: 0.008, color: new Color3(...) },
    sun: { direction: new Vector3(-0.5, -0.8, 0.3), intensity: 0.7 },
  },
  // ... 8+ world presets
};
```

### Features:

#### 1. Texture Preloading
[SkySystem.ts Lines 83-99](src/game/systems/sky/SkySystem.ts#L83-L99):
```typescript
async preload(worldId: WorldId): Promise<void> {
  const url = this.withBase(sky.url);
  if (this.textureCache.has(url)) return;
  
  const tex = new Texture(url, this.scene);
  await tex.whenAllReady();
  this.textureCache.set(url, tex);
}
```

#### 2. Crossfade Transitions
[SkySystem.ts Lines 123-172](src/game/systems/sky/SkySystem.ts#L123-L172):
```typescript
private async crossfade(worldId: WorldId, preset: WorldLookPreset, durationMs: number): Promise<void> {
  const oldDome = this.currentSky.dome;
  const newDome = this.createDome(preset.sky!);
  
  // Alpha fade old → 0, new → 1
  await this.animateAlpha(oldDome, newDome, durationMs);
  
  oldDome.dispose();
}
```

#### 3. Billboard Clouds
[BillboardCloudSystem.ts](src/game/systems/sky/BillboardCloudSystem.ts):
```typescript
// Procedural cloud placement on hemisphere
// Wind-driven movement
// Tint/brightness per world
export class BillboardCloudSystem {
  private billboards: CloudBillboard[] = [];
  // ... cloud mesh generation + animation
}
```

#### 4. Noise Overlay
[NoiseOverlay.ts](src/game/systems/sky/NoiseOverlay.ts):
```typescript
export function createNoiseOverlay(cfg: NoiseOverlayConfig, scene: Scene): NoiseOverlayHandle {
  const layer = new Layer('noise_overlay', withBase(cfg.url), scene);
  layer.isBackground = false;
  layer.alphaBlendingMode = Engine.ALPHA_ADD;
  return { layer, setAlpha: (a) => layer.alpha = a };
}
```

### Dev Tools:
[SkySystem.ts Lines 314-373](src/game/systems/sky/SkySystem.ts#L314-L373):
- Hotkey `K` toggles overlay
- Runtime rotation control
- Copy rotation value to clipboard
- Visual feedback for sky authoring

---

## Deprecated APIs / Patterns Found

### 1. Legacy SceneLoader Callbacks
[WoodlineWorld.ts Line 98](src/game/worlds/woodline/WoodlineWorld.ts#L98):
```typescript
SceneLoader.ImportMesh('', 'assets/models/', 'TreesBushes.glb', scene, (meshes: AbstractMesh[]) => {
  // Callback-based loading (older pattern)
});
```
**Issue:** Callback-based API is legacy. Modern code uses `ImportMeshAsync` with async/await.

**Recommendation:** Migrate to async/await pattern used in [gltf.ts](src/game/assets/loaders/gltf.ts) and [fbx.ts](src/game/assets/loaders/fbx.ts).

### 2. Deprecated Save Method
[SaveSystem.ts Line 357](src/game/systems/saves/SaveSystem.ts#L357):
```typescript
/**
 * Legacy save method (deprecated, use write instead)
 */
async save(profileName: string, data: any): Promise<void> {
  // ...
}
```
**Issue:** Marked as deprecated in comments but still present.

**Recommendation:** Remove or add @deprecated JSDoc tag to trigger IDE warnings.

### 3. No Use of Modern APIs
- No `@babylonjs/havok` (modern physics)
- No `scene.enablePhysics()` (modern physics API)
- No `MeshBuilder.CreateGroundFromHeightMap` with proper TypeScript types

---

## Custom Wrappers & Patterns

### 1. MaterialCache Pattern
[MaterialCache.ts](src/game/worlds/pine/utils/MaterialCache.ts):
```typescript
export class MaterialCache {
  private map = new Map<string, StandardMaterial>();
  
  get(key: string, build: () => StandardMaterial) {
    if (!this.map.has(key)) {
      this.map.set(key, build());
    }
    return this.map.get(key)!;
  }
}
```
**Purpose:** Prevents duplicate materials when instantiating props.

### 2. DisposableBag Pattern
[DisposableBag.ts](src/game/worlds/pine/utils/DisposableBag.ts):
```typescript
export class DisposableBag {
  private meshes: AbstractMesh[] = [];
  private materials: StandardMaterial[] = [];
  private textures: Texture[] = [];
  
  dispose() {
    this.meshes.forEach(m => m.dispose());
    this.materials.forEach(m => m.dispose());
    this.textures.forEach(t => t.dispose());
  }
}
```
**Purpose:** Centralized cleanup for world assets.

### 3. GrassWindPlugin (Custom MaterialPlugin)
[GrassWindPlugin.ts](src/game/terrain/grass/GrassWindPlugin.ts):
- Extends `MaterialPluginBase`
- Injects custom vertex shader code
- Uniforms for wind animation
- Compatible with instancing

**Quality:** Well-implemented, follows Babylon plugin architecture.

### 4. Safe Disposal Utilities
[dispose.ts](src/game/shared/dispose.ts):
```typescript
export function disposeMesh(mesh: Mesh | null | undefined): void {
  if (!mesh) return;
  mesh.dispose(false, true); // Dispose geometry + textures
}

export function disposeTexture(texture: Texture | null | undefined): void {
  if (!texture) return;
  texture.dispose();
}
```

---

## Performance Observations

### Optimizations Applied:
1. ✅ **World matrix freezing** on static meshes
2. ✅ **Material freezing** on unchanging materials
3. ✅ **Distance-based culling** via CullingSystem
4. ✅ **Standard instancing** for grass/vegetation
5. ✅ **Texture caching** in SkySystem
6. ✅ **Material caching** via MaterialCache
7. ✅ **Selective back-face culling** disabled for grass/clouds
8. ✅ **Quality presets** (low/medium/high) for device scaling

### Performance Bottlenecks Identified:
1. ❌ **No GPU particles** - All particles are CPU-based
2. ❌ **No thin instances** - Could benefit for 1000+ grass blades
3. ❌ **No LOD system** - Distant objects same detail as near
4. ❌ **No octrees** - Default frustum culling only
5. ⚠️ **Many StandardMaterials** - Could be consolidated
6. ⚠️ **Legacy ImportMesh callbacks** - Blocks event loop

### Recommendations:
1. **Migrate to thin instances** for grass fields (10x+ performance)
2. **Implement LOD** for trees/props (2-3 detail levels)
3. **Consolidate materials** - Use material variants instead of new instances
4. **Async/await everywhere** - Remove callback-based loading
5. **Consider GPU particles** for confetti/campfire (when WebGPU ready)

---

## File Counts & Code Organization

### Babylon.js Import Distribution:
- **Core package:** 146 import statements
- **Loaders package:** 13 import statements (glTF, FBX)
- **Materials package:** 1 import (registered but unused)
- **GUI package:** 0 imports

### Key File Locations:

#### Asset Loading:
- [src/game/assets/loaders/gltf.ts](src/game/assets/loaders/gltf.ts)
- [src/game/assets/loaders/fbx.ts](src/game/assets/loaders/fbx.ts)
- [src/game/assets/loaders/audio.ts](src/game/assets/loaders/audio.ts)
- [src/game/assets/loaders/textures.ts](src/game/assets/loaders/textures.ts)

#### Core Systems:
- [src/game/GameApp.ts](src/game/GameApp.ts) - Engine + scene orchestration
- [src/game/systems/camera/CameraRig.ts](src/game/systems/camera/CameraRig.ts) - ArcRotateCamera controller
- [src/game/systems/sky/SkySystem.ts](src/game/systems/sky/SkySystem.ts) - PhotoDome management
- [src/game/systems/audio/AudioSystem.ts](src/game/systems/audio/AudioSystem.ts) - Web Audio wrapper

#### Character Systems:
- [src/game/entities/player/Player.ts](src/game/entities/player/Player.ts)
- [src/game/entities/player/controller.ts](src/game/entities/player/controller.ts)
- [src/game/entities/companion/Companion.ts](src/game/entities/companion/Companion.ts)

#### Terrain/Environment:
- [src/game/terrain/grass/createGrassField.ts](src/game/terrain/grass/createGrassField.ts)
- [src/game/terrain/grass/GrassWindPlugin.ts](src/game/terrain/grass/GrassWindPlugin.ts)
- [src/game/worlds/*/](src/game/worlds/) - 8 playable worlds

---

## Summary & Recommendations

### Strengths:
1. **Clean architecture** - Well-organized systems and separation of concerns
2. **Custom tools** - Robust debug/editor tools tailored to game needs
3. **Performance-conscious** - Strategic use of freezing and culling
4. **Modern async patterns** - Mostly async/await (except legacy areas)
5. **Custom shaders** - GrassWindPlugin is well-implemented

### Areas for Improvement:

#### High Priority:
1. **Migrate legacy ImportMesh callbacks** to async/await
2. **Implement thin instances** for vegetation (10x performance gain)
3. **Add LOD system** for trees and props (2-3 detail levels)
4. **Consolidate materials** - Reduce unique StandardMaterial count

#### Medium Priority:
5. **WebGPU readiness** - Translate GLSL shaders to WGSL
6. **GPU particles** - Move particle systems to GPU (WebGPU compute)
7. **Shadows system** - Enable shadow generators (quality presets ready)
8. **Post-processing** - Add bloom/FXAA for high-quality preset

#### Low Priority:
9. **Octree spatial partitioning** - For very large scenes
10. **PBR materials** - If art direction shifts to photorealism
11. **Babylon GUI** - If 3D UI elements needed
12. **Physics engine** - If gameplay requires rigid body dynamics

### Critical Warnings:
- **No deprecated APIs detected** in Babylon.js imports
- **GLSL-only shaders** will block WebGPU adoption
- **No shadow system** despite quality presets expecting it
- **Callback-based loading** in WoodlineWorld needs migration

---

## Appendix: Technology Stack

```json
{
  "@babylonjs/core": "^7.0.0",
  "@babylonjs/loaders": "^7.0.0",
  "@babylonjs/materials": "^7.54.3",
  "react": "^18.3.1",
  "typescript": "^5.7.0",
  "vite": "^7.3.0"
}
```

**Engine:** Standard WebGL Engine (not WebGPU)  
**Platform Target:** Web (desktop + iPad)  
**UI Framework:** React 18 + HTML overlay  
**Build Tool:** Vite 7  

---

**End of Audit Report**
