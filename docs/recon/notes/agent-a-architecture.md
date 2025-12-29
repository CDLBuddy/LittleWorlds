# Agent A: Architecture & Game Loop Reconnaissance

**Investigation Date:** December 28, 2025  
**Mission:** Map the architecture and game flow of Little Worlds

---

## 1. Entry Points

### 1.1 Application Bootstrap
**Path:** [src/main.tsx](../../../src/main.tsx) → [src/App.tsx](../../../src/App.tsx) → [src/router/routes.tsx](../../../src/router/routes.tsx)

```tsx
// main.tsx: Standard React 18 entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// App.tsx: Wraps routing
<BrowserRouter>
  <AppRoutes />
</BrowserRouter>

// routes.tsx: Defines app screens
<Routes>
  <Route path="/" element={<TitleScreen />} />
  <Route path="/profiles" element={<ProfileSelect />} />
  <Route path="/game" element={<GameHost running={true} />} />
  <Route path="/settings" element={<SettingsScreen />} />
</Routes>
```

**Key Observation:** Clean separation between React UI layer and Babylon.js game engine. The `/game` route is the entry point to the actual game runtime.

### 1.2 Game Engine Entry
**Path:** [src/game/GameHost.tsx](../../../src/game/GameHost.tsx) (React bridge) → [src/game/GameApp.ts](../../../src/game/GameApp.ts) (Babylon.js orchestrator)

**GameHost responsibilities:**
- Canvas lifecycle management (creates/destroys canvas on mount/unmount)
- Session parameter extraction (roleId, areaId from Zustand store)
- GameApp instantiation and lifecycle
- HUD overlay rendering
- **Remount trigger:** Changes to `roleId`, `areaId`, or `slotId` force a complete remount

```tsx
// GameHost.tsx L23-38
useEffect(() => {
  const session = useGameSession.getState();
  let actualRoleId: RoleId = session.roleId || 'boy';
  const actualAreaId: AreaId = session.areaId || 'backyard';
  
  // Fallback: load from saveFacade if session empty
  if (!session.roleId) {
    const save = saveFacade.loadMain();
    actualRoleId = save.lastSelectedRole || 'boy';
  }
  
  const game = new GameApp(canvasRef.current, eventBus, { 
    roleId: actualRoleId, 
    areaId: actualAreaId 
  });
  game.start();
  
  return () => { game.stop(); }; // Cleanup on unmount
}, [running, onReady, roleId, areaId, slotId]); // Remount triggers
```

**GameApp responsibilities:**
- Babylon.js Engine and Scene initialization
- World loading (BackyardWorld, WoodlineWorld, or BootWorld fallback)
- System instantiation (see Systems Map below)
- Main game loop (update + render)
- Event bus subscription for UI↔Game communication

---

## 2. Boot Sequence

### 2.1 GameApp.start() Flow
**Source:** [src/game/GameApp.ts#L206-L368](../../../src/game/GameApp.ts)

```
1. AudioSystem init (WebAudio with iOS unlock)
2. Load audio assets (fetch + decode all manifest entries)
3. World selection based on startParams.areaId:
   - 'backyard' → createBackyardWorld()
   - 'woodline' → createWoodlineWorld()
   - else → createBootWorld() (dev fallback)
4. Store world references (player, companion, interactables, dispose func)
5. CameraRig init (ArcRotateCamera with mode system)
6. FxSystem init (particle effects)
7. PlayerController init + entity binding
8. TaskSystem init + load saved inventory
9. InteractionSystem init + register interactables
10. ProgressionSystem init (loads area tasks from AREAS data)
11. ProgressionSystem.start() (starts first task)
12. WakeRadiusSystem init (proximity LOD)
13. Register interactables as wakeables (start asleep)
14. DebugOverlay + helpers (dev only)
15. Start ambient audio loop
16. engine.runRenderLoop() → update(dt) + scene.render()
17. Emit 'game/ready' event
```

**Critical dependencies:**
- Must load audio before ambient loop starts
- TaskSystem must exist before InteractionSystem
- ProgressionSystem must exist before starting tasks
- Interactables must be registered before wake radius activation

### 2.2 World Creation
**Example:** [src/game/worlds/backyard/BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts)

All worlds follow this pattern:
```typescript
function createXWorld(scene, eventBus, roleId): {
  player: TransformNode;
  playerEntity: Player;
  companion: Companion;
  interactables: Interactable[];
  dispose: () => void;
  registerDynamic?: (callback) => void; // Optional dynamic registration
}
```

**BackyardWorld specifics:**
- SkyMaterial with sunrise settings (inclination: 0.03, azimuth: 0.25)
- Ground plane + grass tiling (Summergrass.glb, 6x6 grid with exclusion zones)
- House.glb at (0, 0, 32)
- TreesBushes.glb instances (4 positions)
- Role-specific interactables:
  - Boy: `slingshot_pickup`, `backyard_target`
  - Girl: `multitool_pickup`, `carve_station`
- Gate interactable (areaId: 'woodline', alwaysActive: true)

**BootWorld (legacy/debug):**
- [src/game/worlds/BootWorld.ts](../../../src/game/worlds/BootWorld.ts)
- Simple primitives: ground plane, lights, fog
- Hardcoded task interactables: axe, logPile, campfire
- Used for dev testing or when areaId doesn't match backyard/woodline

---

## 3. World Management

### 3.1 WorldManager (Underutilized)
**Source:** [src/game/worlds/WorldManager.ts](../../../src/game/worlds/WorldManager.ts)

**Status:** Defined but NOT actively used by GameApp.

```typescript
export class WorldManager {
  async loadWorld(world: World): Promise<void>
  getCurrentWorld(): World | null
  dispose(): void
}
```

**Current world switching approach:**
- Area transitions trigger `sessionFacade.setArea(newAreaId)`
- This updates Zustand store `useGameSession`
- GameHost's `useEffect` dependency array includes `areaId`
- Change triggers full GameHost remount → GameApp stop() + new GameApp start()
- **No hot-swapping or transition animations**

**Coupling issue:** World selection logic hardcoded in GameApp.start() (L232-240):
```typescript
if (this.startParams.areaId === 'backyard') {
  world = createBackyardWorld(scene, bus, roleId);
} else if (this.startParams.areaId === 'woodline') {
  world = createWoodlineWorld(scene, bus, roleId);
} else {
  world = createBootWorld(scene, bus, roleId); // Fallback
}
```

**Magic strings:** `'backyard'`, `'woodline'` hardcoded (not registry-based).

---

## 4. Systems Architecture

### 4.1 System Initialization Order
**Source:** [src/game/GameApp.ts#L206-L340](../../../src/game/GameApp.ts)

| Order | System | Constructor Deps | Purpose |
|-------|--------|------------------|---------|
| 1 | **AudioSystem** | None | WebAudio management, buses (master/music/sfx), loop tracking |
| 2 | **CameraRig** | Scene, Canvas | ArcRotateCamera with 3 modes: FOLLOW, LEAD, CELEBRATE |
| 3 | **FxSystem** | Scene | Particle effects (confetti, fireflies) |
| 4 | **PlayerController** | Scene, TransformNode | Touch-to-move with velocity-based physics |
| 5 | **TaskSystem** | EventBus | Task chain management, inventory tracking |
| 6 | **InteractionSystem** | TaskSystem, EventBus | Proximity prompts, dwell-to-interact |
| 7 | **ProgressionSystem** | TaskSystem, RoleId, AreaId | Area→Tasks→Unlock flow |
| 8 | **WakeRadiusSystem** | Scene, EventBus | Hysteresis-based LOD (wake/sleep interactables) |
| 9 | **DebugOverlay** (dev) | None | FPS, position, wake state display |

### 4.2 System Details

#### AudioSystem
**Source:** [src/game/systems/audio/AudioSystem.ts](../../../src/game/systems/audio/AudioSystem.ts)

- **Buses:** master → music/sfx (GainNode hierarchy)
- **iOS unlock:** Listens for first user gesture (touch/click)
- **Loop management:** Map<symbol, {source, gain}> for active loops
- **Loading:** Fetch + decodeAudioData, cached in bufferCache
- **Code smell:** `(window as any).webkitAudioContext` (L49)

#### CameraRig
**Source:** [src/game/systems/camera/CameraRig.ts](../../../src/game/systems/camera/CameraRig.ts)

- **Modes:** FOLLOW (radius: 11), LEAD (radius: 17), CELEBRATE (radius: 9)
- **Smoothing:** Lerp target position, smooth radius transition
- **CELEBRATE auto-return:** After 1s, switches back to FOLLOW
- **User control:** Beta/alpha (vertical/horizontal rotation) via mouse, system controls radius

#### TaskSystem
**Source:** [src/game/systems/tasks/TaskSystem.ts](../../../src/game/systems/tasks/TaskSystem.ts)

- **State:** currentTask, currentStepIndex, inventory (Set<string>)
- **Data-driven:** Tasks from [src/game/content/tasks.ts](../../../src/game/content/tasks.ts)
- **Step logic:**
  - `requiresItems` → check before allow interaction
  - `grantsItems` → add to inventory on completion
  - `consumesItems` → remove from inventory on completion
- **Event emission:** `game/task` with stepIndex, complete flag
- **No automatic progression:** Relies on ProgressionSystem to start next task

#### InteractionSystem
**Source:** [src/game/systems/interactions/InteractionSystem.ts](../../../src/game/systems/interactions/InteractionSystem.ts)

- **Proximity radius:** 3.0 units (hardcoded)
- **Dwell duration:** 500ms (DWELL_DURATION const)
- **Auto-interact:** On dwell complete, calls `interactable.interact()` + `taskSystem.completeCurrentStep()`
- **Cooldown:** 1s after interaction to prevent rapid re-triggering
- **alwaysActive flag:** Allows non-task interactions (e.g., gates)
- **Event emission:** `game/prompt`, `game/dwell`, `game/dwellClear`, `game/interact`

#### ProgressionSystem
**Source:** [src/game/systems/progression/ProgressionSystem.ts](../../../src/game/systems/progression/ProgressionSystem.ts)

- **Initialization:** Load taskIds from AREAS[areaId].tasksByRole[roleId]
- **Boot fallback:** If devBootFallback=true && areaId='backyard', use `campfire_v1` task
- **start():** Loads first task into TaskSystem
- **handleTaskEvent(taskId, complete):**
  - Mark task complete via saveFacade
  - Advance currentTaskIndex
  - If all tasks done → completeArea() (unlock next, save inventory)
  - Else → load next task
- **Coupling:** Tightly bound to TaskSystem (calls startTask directly)

#### WakeRadiusSystem
**Source:** [src/game/systems/interactions/wakeRadius.ts](../../../src/game/systems/interactions/wakeRadius.ts)

- **Hysteresis:** R_IN=6, R_OUT=8 (normal), TASK_R_IN=14 (current task target)
- **Wake animation:** Scale 0.85→1.0 over 0.2s
- **Task-aware:** Current task target never sleeps, stays awake at larger radius
- **Wakeable interface:** {id, mesh, asleep, wake(), sleep()}

---

## 5. Event Flow

### 5.1 Event Bus Architecture
**Source:** [src/game/shared/events.ts](../../../src/game/shared/events.ts)

**Type:** Simple publish-subscribe with TypeScript discriminated union.

```typescript
export type AppEvent = UiToGame | GameToUi;

class EventBus {
  private handlers = new Set<EventHandler>();
  on(handler: EventHandler): () => void // Returns unsubscribe
  emit(event: AppEvent): void
  clear(): void
}

export const eventBus = new EventBus(); // Singleton
```

### 5.2 Event Types

#### UI → Game Events
| Event | Payload | Subscribers | Purpose |
|-------|---------|-------------|---------|
| `ui/play` | - | (unused) | Reserved for future |
| `ui/pause` | - | (unused) | Reserved for future |
| `ui/resume` | - | (unused) | Reserved for future |
| `ui/setQuality` | preset | (unused) | Reserved for perf tuning |
| `ui/callCompanion` | - | GameApp | Trigger companion lead behavior |
| `ui/toggleHelp` | - | (unused) | Reserved for future |
| `ui/audio/unlock` | - | GameApp→AudioSystem | iOS audio unlock on first touch |
| `ui/audio/volume` | bus, value | GameApp→AudioSystem | Volume slider changes |
| `ui/restart` | - | GameApp | Reset task/progression, player position |
| `ui/toast` | level, message | UI (via useUiStore) | Show info/warning/error toast |

#### Game → UI Events
| Event | Payload | Subscribers | Purpose |
|-------|---------|-------------|---------|
| `game/ready` | - | GameHost | Signal game boot complete |
| `game/fps` | fps | (unused) | Reserved for perf display |
| `game/prompt` | id, icon, worldPos | UI (via HUD) | Show proximity prompt |
| `game/promptClear` | id? | UI | Hide prompt(s) |
| `game/task` | taskId, stepIndex, complete? | UI | Update task progress |
| `game/taskComplete` | taskId, position | UI | Show completion effect |
| `game/companion/state` | state, targetId? | UI + GameApp | Companion FSM state changes |
| `game/audio/locked` | locked | (unused) | Reserved for audio state |
| `game/interact` | targetId | GameApp | Trigger interaction SFX |
| `game/dwell` | id, progress | UI | Dwell progress 0..1 |
| `game/dwellClear` | id | UI | Clear dwell indicator |
| `game/areaRequest` | areaId | GameApp | Gate interaction (area transition) |

### 5.3 Event Flow Example: Task Completion

```
1. Player walks near axe
   → WakeRadiusSystem.update() → wakeable.wake() → mesh.setEnabled(true)

2. Player stays near (dwell)
   → InteractionSystem.update() → emit('game/prompt', { icon: 'hand' })
   → InteractionSystem.update() → emit('game/dwell', { progress: 0.5 })

3. Dwell complete (500ms)
   → InteractionSystem → interactable.interact()
   → InteractionSystem → taskSystem.completeCurrentStep()
   → TaskSystem → emit('game/task', { complete: false }) // Next step
   → TaskSystem → grantsItems: ['axe'] added to inventory

4. If final step
   → TaskSystem → emit('game/task', { complete: true })
   → GameApp event handler → progressionSystem.handleTaskEvent()
   → ProgressionSystem → saveFacade.markTaskComplete()
   → ProgressionSystem → taskSystem.startTask(nextTask)
   → GameApp → fxSystem.spawnConfetti()
   → GameApp → audioSystem.playSfx(SUCCESS)
   → GameApp → cameraRig.setMode('CELEBRATE')
   → GameApp → emit('game/taskComplete', { position })
```

**Observation:** Deep coupling between InteractionSystem, TaskSystem, and ProgressionSystem. No middleware or command pattern.

---

## 6. State Management

### 6.1 UI State (Zustand)
**Source:** [src/ui/state/useUiStore.ts](../../../src/ui/state/useUiStore.ts)

**Store:** useUiStore (React hook)

**State:**
- `isPaused: boolean`
- `showHUD: boolean`
- `currentHint: string | null`
- `inventoryItems: string[]` (duplicate of TaskSystem inventory!)
- `activePrompts: Map<string, ActivePrompt>` (max 3)
- `companionState: CompanionState | null`
- `showCompletionModal: boolean`

**Actions:** setPaused, setShowHUD, addPrompt, setDwellProgress, etc.

**Usage:** HUD components (PromptOverlay, TaskWidget) subscribe to this store.

### 6.2 Game Session State (Zustand)
**Source:** [src/game/session/useGameSession.ts](../../../src/game/session/useGameSession.ts)

**Store:** useGameSession (React hook)

**State:**
- `slotId: string` (default: 'main')
- `roleId: RoleId | null` (boy/girl)
- `areaId: AreaId | null` (backyard/woodline)

**Actions:** setRole, setArea, setSlot, resetSession

**Critical:** Changes to roleId/areaId trigger GameHost remount (full game restart).

**Non-React access:** [src/game/session/sessionFacade.ts](../../../src/game/session/sessionFacade.ts) wraps `useGameSession.getState()` for game code.

### 6.3 Save State (localStorage)
**Source:** [src/game/systems/saves/saveFacade.ts](../../../src/game/systems/saves/saveFacade.ts) → [src/game/systems/saves/SaveSystem.ts](../../../src/game/systems/saves/SaveSystem.ts)

**Facade API:**
- `loadMain()` → fetch from localStorage
- `writeMain(save)` → write to localStorage
- `getUnlockedAreas(roleId)` → string[]
- `markAreaComplete(roleId, areaId, nextAreaId)` → unlock next + save
- `markTaskComplete(roleId, taskId)` → add to completedTasks
- `setInventory(roleId, items)` / `getInventory(roleId)`

**SaveData structure:**
```typescript
{
  version: number;
  lastSelectedRole: RoleId;
  roles: {
    boy: {
      unlockedAreas: AreaId[];
      completedAreas: AreaId[];
      completedTasks: string[];
      lastAreaId: AreaId;
      inventory: string[];
    },
    girl: { /* same */ }
  }
}
```

**Migration:** [src/game/systems/saves/migrations.ts](../../../src/game/systems/saves/migrations.ts) handles version upgrades.

### 6.4 State Duplication Issue
**Coupling problem:** Inventory exists in 3 places:
1. TaskSystem.inventory (Set<string>) - runtime truth
2. SaveData.roles[roleId].inventory (string[]) - persisted truth
3. useUiStore.inventoryItems (string[]) - UI display

**No single source of truth.** ProgressionSystem syncs TaskSystem→Save, but UI sync is manual.

---

## 7. Areas + Tasks Flow

### 7.1 Data-Driven Content
**Source:** [src/game/content/areas.ts](../../../src/game/content/areas.ts), [src/game/content/tasks.ts](../../../src/game/content/tasks.ts)

**AREAS registry:**
```typescript
export const AREAS: Record<AreaId, AreaDef> = {
  backyard: {
    id: 'backyard',
    name: 'Backyard',
    worldKey: 'BACKYARD', // Not used (worlds are direct function imports)
    next: 'woodline',
    tasksByRole: {
      boy: ['boy_backyard_find_slingshot', 'boy_backyard_first_shots'],
      girl: ['girl_backyard_find_multitool', 'girl_backyard_carve_token'],
    },
  },
  woodline: { /* ... */ },
};
```

**TASKS_BY_ID registry:**
```typescript
export const TASKS_BY_ID: Record<string, Task> = {
  boy_backyard_find_slingshot: { /* ... */ },
  // ...
};
```

**Task structure:**
```typescript
interface Task {
  id: string;
  name: string;
  steps: TaskStep[];
}

interface TaskStep {
  id: string;
  targetId: string; // Interactable ID
  promptIcon: PromptIcon;
  requiresItems?: string[];
  grantsItems?: string[];
  consumesItems?: string[];
}
```

### 7.2 Progression Flow

```
1. ProgressionSystem.constructor(roleId, areaId)
   → Lookup AREAS[areaId].tasksByRole[roleId]
   → Filter out missing tasks (dev safety)
   → Store taskIds array

2. ProgressionSystem.start()
   → Load first task: taskSystem.startTask(TASKS_BY_ID[taskIds[0]])

3. TaskSystem.startTask(task)
   → Set currentTask, currentStepIndex=0
   → Emit 'game/task' event

4. InteractionSystem sees prompt
   → Player walks to targetId
   → Dwell complete → completeCurrentStep()

5. TaskSystem.completeCurrentStep()
   → Apply grantsItems/consumesItems
   → Increment stepIndex
   → If stepIndex >= steps.length → emit complete=true

6. GameApp event handler
   → progressionSystem.handleTaskEvent(taskId, true)

7. ProgressionSystem.handleTaskEvent()
   → saveFacade.markTaskComplete()
   → currentTaskIndex++
   → If currentTaskIndex < taskIds.length → load next task
   → Else → completeArea()

8. ProgressionSystem.completeArea()
   → saveFacade.markAreaComplete(areaId, nextAreaId)
   → saveFacade.setInventory(roleId, taskSystem.getInventory())
```

**Coupling chain:** ProgressionSystem → TaskSystem → InteractionSystem → Interactables (world-defined).

**Magic string risk:** Task IDs in areas.ts must match task definitions in tasks.ts. No compile-time check.

---

## 8. Coupling Analysis

### 8.1 Tight Coupling Issues

#### GameApp as God Object
**Source:** [src/game/GameApp.ts](../../../src/game/GameApp.ts)

**Problem:** GameApp directly instantiates, stores, and manages 10+ systems and entities as private fields. No dependency injection or system registry.

**Private fields:**
```typescript
private playerController: PlayerController | null = null;
private wakeRadiusSystem: WakeRadiusSystem | null = null;
private taskSystem: TaskSystem | null = null;
private interactionSystem: InteractionSystem | null = null;
private audioSystem: AudioSystem | null = null;
private cameraRig: CameraRig | null = null;
private fxSystem: FxSystem | null = null;
private progressionSystem: ProgressionSystem | null = null;
private companion: Companion | null = null;
// ... and more
```

**Impact:** Cannot easily add/remove systems, test systems in isolation, or reorder initialization.

#### ProgressionSystem → TaskSystem Hard Dependency
**Source:** [src/game/systems/progression/ProgressionSystem.ts#L108](../../../src/game/systems/progression/ProgressionSystem.ts)

```typescript
this.taskSystem.startTask(task); // Direct method call, no interface
```

**Problem:** ProgressionSystem knows about TaskSystem's internal API. Cannot swap task implementations.

#### InteractionSystem → TaskSystem Coupling
**Source:** [src/game/systems/interactions/InteractionSystem.ts#L101](../../../src/game/systems/interactions/InteractionSystem.ts)

```typescript
const step = this.taskSystem.getCurrentStep();
if (!this.taskSystem.canInteract(targetId)) return;
this.taskSystem.completeCurrentStep();
```

**Problem:** InteractionSystem directly calls TaskSystem methods. No command pattern or event-based decoupling.

#### World Selection Hardcoded
**Source:** [src/game/GameApp.ts#L232-L240](../../../src/game/GameApp.ts)

```typescript
if (this.startParams.areaId === 'backyard') {
  world = createBackyardWorld(scene, bus, roleId);
} else if (this.startParams.areaId === 'woodline') {
  world = createWoodlineWorld(scene, bus, roleId);
}
```

**Problem:** Magic string checks. No registry-based world loading. AREAS.worldKey unused.

#### Event Bus as God Interface
**Source:** All systems

**Problem:** eventBus accepts `AppEvent` union (20+ event types). No scoped channels or typed dispatch. Any system can emit any event.

**Risk:** Accidental cross-system coupling, event name collisions, no compile-time safety for event handlers.

### 8.2 Circular Dependencies (Potential)

**Not found:** Modules use careful import ordering and facade patterns to avoid actual circular imports.

**Near-miss:**
- GameApp imports systems
- Systems import eventBus (singleton)
- GameApp also imports eventBus
- **Safe because:** eventBus is a module singleton, not a class import cycle.

### 8.3 Unclear Ownership

#### Interactables
**Created by:** Worlds (BackyardWorld, BootWorld)  
**Registered to:** InteractionSystem, WakeRadiusSystem  
**Queried by:** TaskSystem (getCurrentTargetId), GameApp (onCompanionCall)  
**Disposed by:** World dispose() function

**Problem:** No single system "owns" interactables. Interactable lifecycle spread across 4 places.

#### Inventory
**Runtime state:** TaskSystem.inventory (Set)  
**Persisted state:** SaveSystem  
**UI state:** useUiStore.inventoryItems  
**Sync points:** ProgressionSystem.completeArea(), GameApp.start()

**Problem:** Three sources of truth. No reactive sync.

---

## 9. Search Results: Code Smells

### 9.1 TODO/FIXME/HACK/STUB (20 matches)

**High-priority TODOs:**

| File | Line | Issue |
|------|------|-------|
| [BackyardWorld.ts](../../../src/game/worlds/backyard/BackyardWorld.ts) | 571, 602, 633 | `// TODO: Add to AppEvent type` (interaction/complete event) |
| [BeachWorld.ts](../../../src/game/worlds/beach/BeachWorld.ts) | 14, 19 | `// TODO: Load beach assets` (stub world) |
| [ForestWorld.ts](../../../src/game/worlds/forest/ForestWorld.ts) | 14, 19 | `// TODO: Load forest assets` (stub world) |
| [FxSystem.ts](../../../src/game/systems/fx/FxSystem.ts) | 68, 80 | `// TODO: Create particle system / firefly system` |
| [InputSystem.ts](../../../src/game/systems/input/InputSystem.ts) | 27, 39 | `// TODO: Setup/remove listeners` (stub system) |
| [cheats.ts](../../../src/game/debug/cheats.ts) | 43, 51, 59, 67 | `// TODO: Implement teleport/task/spawn/item cheats` |
| [NPC.ts](../../../src/game/entities/npc/NPC.ts) | 6 | `// TODO: Implement NPCs` |
| [Tent.ts](../../../src/game/entities/props/Tent.ts) | 15 | `// TODO: Trigger tent interior, rest, save` |

**Observation:** 
- Beach/Forest worlds are placeholders
- FxSystem incomplete (missing particle implementations)
- InputSystem is a stub (PlayerController uses direct pointer events)
- Cheats system partially implemented

### 9.2 Type Safety Issues (7 matches)

| File | Line | Code | Reason |
|------|------|------|--------|
| [AudioSystem.ts](../../../src/game/systems/audio/AudioSystem.ts) | 49 | `(window as any).webkitAudioContext` | Safari/iOS AudioContext polyfill |
| [CompanionDebugHelper.ts](../../../src/game/debug/CompanionDebugHelper.ts) | 31 | `(this.companion as any).modelRoot` | Accessing private field |
| [PlayerDebugHelper.ts](../../../src/game/debug/PlayerDebugHelper.ts) | 33 | `(this.player as any).mesh` | Accessing private field |
| [qualityPresets.ts](../../../src/game/config/qualityPresets.ts) | 49 | `(performance as any).memory?.jsHeapSizeLimit` | Chrome-only memory API |
| [deviceHeuristics.ts](../../../src/game/config/deviceHeuristics.ts) | 36, 38 | `(gl as any).getExtension('WEBGL_debug_renderer_info')` | Non-standard WebGL extension |
| [audio.ts (loader)](../../../src/game/assets/loaders/audio.ts) | 11 | `(window as any).webkitAudioContext` | Duplicate Safari polyfill |

**Observation:** Most `as any` casts are for browser API polyfills or intentional private access in debug code. Not architectural issues.

### 9.3 Magic Strings (20+ matches)

**AreaId strings:**
- 'backyard', 'woodline' used in 14+ locations
- Defined as TypeScript union: `type AreaId = 'backyard' | 'woodline'`
- Hardcoded in: GameApp, ProgressionSystem, SaveSystem, migrations
- **Risk:** Low (TypeScript enforces string literal type)

**World keys:**
- 'BACKYARD', 'WOODLINE' in areas.ts
- **Unused:** worldKey field not used by GameApp
- **Risk:** Medium (dead field, misleading)

**System name strings:**
- Event types use string literals: 'game/task', 'ui/callCompanion', etc.
- **Risk:** Low (TypeScript discriminated union enforces type)

**Interactable IDs:**
- 'axe_001', 'logpile_001', 'slingshot_pickup', 'backyard_target', etc.
- Defined in worlds, referenced in tasks.ts
- **Risk:** High (no compile-time check that IDs match)

---

## 10. Recommendations

### 10.1 Architectural Improvements

1. **Introduce System Registry**
   - Replace GameApp's private system fields with a typed registry: `Map<SystemType, System>`
   - Define System interface with `init()`, `update(dt)`, `dispose()`
   - Allow dynamic system addition/removal

2. **Decouple Systems via Commands**
   - Replace direct method calls (e.g., `taskSystem.completeCurrentStep()`) with command pattern
   - Example: `commandBus.dispatch(new CompleteTaskStepCommand(taskId))`
   - Benefits: Testability, undo/redo, replay

3. **World Registry**
   - Replace hardcoded world selection with registry: `WorldRegistry.get(areaId)`
   - Use AREAS.worldKey properly or remove it
   - Enable hot-swapping worlds without GameApp restart

4. **Unify Inventory State**
   - Make TaskSystem.inventory the single source of truth
   - Use reactive state sync to SaveSystem and useUiStore
   - Consider Zustand store for inventory with GameApp subscription

5. **Event Bus Improvements**
   - Split into typed channels: `GameEvents`, `UiEvents`, `SystemEvents`
   - Add middleware for logging, validation, replay
   - Consider RxJS observables for filtering and backpressure

### 10.2 Code Quality

1. **Eliminate TODOs in Critical Paths**
   - Complete FxSystem particle implementations (needed for polish)
   - Remove stub InputSystem (already replaced by PlayerController)

2. **Validate Interactable IDs**
   - Add build-time check: all task targetIds must exist in worlds
   - Generate TypeScript const enum from manifest

3. **Reduce `as any` Casts**
   - Create proper type definitions for webkitAudioContext, performance.memory
   - Add type guards for debug helper private access

### 10.3 Refactoring Priorities

**High priority:**
- [ ] World registry system (eliminates magic string checks)
- [ ] Inventory state unification (fixes sync bugs)
- [ ] Interactable ID validation (prevents runtime errors)

**Medium priority:**
- [ ] System registry pattern (improves testability)
- [ ] Command pattern for system interactions (decouples)
- [ ] Event bus channels (improves type safety)

**Low priority:**
- [ ] WorldManager integration (future feature)
- [ ] Complete stub systems (InputSystem already has alternative)
- [ ] Cheat system completion (dev-only)

---

## 11. Summary

### Architecture Strengths
- Clean separation between React UI and Babylon.js engine
- Type-safe event bus with discriminated unions
- Data-driven content (AREAS, TASKS)
- Facade pattern isolates save/session complexity
- Predictable boot sequence

### Architecture Weaknesses
- GameApp is a god object (10+ direct system dependencies)
- No dependency injection or system lifecycle interfaces
- Tight coupling between ProgressionSystem ↔ TaskSystem ↔ InteractionSystem
- Inventory state duplicated in 3 places
- World selection hardcoded, registry unused
- Interactable ownership unclear

### Critical Risks
1. **Interactable ID mismatches:** Task targetIds not validated against world interactables
2. **Inventory desync:** Three sources of truth, manual sync on area complete
3. **World switch cost:** Full GameApp remount loses runtime state (could support hot-swap)

**End of reconnaissance.**
