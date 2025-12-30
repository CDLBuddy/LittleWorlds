# Phase 12 Creek World - Mandatory System Sweep Findings

**Date:** 2024
**Purpose:** Pre-implementation discovery to understand existing systems before building Creek world

---

## 1. Task Completion Flow

### Event Chain
```
1. Player enters proximity (< 3.0 units) to interactable
   ↓
2. InteractionSystem.update()
   - Checks if interactable.id matches taskSystem.getCurrentTargetId()
   - Accumulates dwellTime (500ms threshold)
   - Emits 'game/prompt' with promptIcon from current TaskStep
   ↓
3. On 500ms dwell complete
   - InteractionSystem calls target.interact() (world-specific logic)
   - InteractionSystem calls taskSystem.completeCurrentStep()
   - Emits 'game/interact' for SFX
   ↓
4. TaskSystem.completeCurrentStep()
   - Grants items: step.grantsItems → inventory.add(itemId)
   - Consumes items: step.consumesItems → inventory.delete(itemId)
   - Emits toast notification for granted items
   - Increments currentStepIndex
   - Emits 'game/task' (complete: true/false)
   ↓
5. GameApp event handler
   - If task complete, calls progressionSystem.handleTaskEvent()
   - Spawns confetti, plays success SFX, triggers celebrate camera
   ↓
6. ProgressionSystem.handleTaskEvent()
   - Marks task complete via saveFacade.markTaskComplete()
   - Increments currentTaskIndex
   - If more tasks remain, loads next task
   - If all tasks done, calls completeArea()
```

### Critical Files
- [InteractionSystem.ts](../src/game/systems/interactions/InteractionSystem.ts#L127-L155) - Handles proximity + dwell → interact + completeCurrentStep
- [TaskSystem.ts](../src/game/systems/tasks/TaskSystem.ts#L70-L118) - Item grant/consumption, step advancement
- [ProgressionSystem.ts](../src/game/systems/progression/ProgressionSystem.ts#L74-L96) - Task → area completion chain
- [GameApp.ts](../src/game/GameApp.ts#L108-L135) - Task complete event handler (confetti, SFX, camera)

### Key Insights
- **Separation of concerns:** `interact()` handles world-specific visuals/state, `completeCurrentStep()` handles task progression
- **Item grant/consumption is atomic:** All items in `grantsItems` array are added before toast notification
- **Inventory persistence:** Items remain in TaskSystem.inventory across task completion
- **No race conditions:** TaskSystem emits inventory updates after consumption, AutosaveSystem saves on task complete

---

## 2. World Transitions

### Mechanism (Documented in Phase 11)
```
1. Gate interactable emits:
   eventBus.emit({ type: 'game/areaRequest', areaId: 'creek' })
   ↓
2. GameApp listens for 'game/areaRequest'
   ↓
3. GameApp.transitionToArea(newAreaId)
   - Disposes current world (dispose() method)
   - Calls appropriate createXWorld() factory
   - Registers new interactables with InteractionSystem
   - Initializes new TaskSystem/ProgressionSystem
```

### Implementation Pattern
**Gate creation** (see [WoodlineWorld.ts#L550-L573](../src/game/worlds/woodline/WoodlineWorld.ts#L550-L573)):
```typescript
const gate: Interactable = {
  id: INTERACTABLE_ID.WOODLINE_CREEK_GATE,
  mesh: gateMesh,
  alwaysActive: true, // CRITICAL: Gates must bypass task system
  interact: () => {
    eventBus.emit({ type: 'game/areaRequest', areaId: 'creek' });
  },
  dispose: () => { /* cleanup */ }
};
```

### Key Insights
- **alwaysActive property:** Required for gates to bypass task target filtering
- **Smart unlock logic:** Can use worldFlags or area completion to conditionally enable gates
- **Visual feedback:** Gates use emissive materials to signal interactivity

---

## 3. Inventory Checks & Item Management

### TaskSystem Inventory API (Set-Based)
**Location:** [TaskSystem.ts#L14-L145](../src/game/systems/tasks/TaskSystem.ts#L14-L145)

```typescript
class TaskSystem {
  private inventory = new Set<string>(); // ItemId set
  
  addItem(itemId: string): void {
    this.inventory.add(itemId);
    this.broadcastInventory(); // Emits 'game/inventoryUpdate'
  }
  
  canInteract(targetId: string): boolean {
    const step = this.currentTask.steps[this.currentStepIndex];
    if (step.targetId !== targetId) return false;
    
    // Check all required items are in inventory
    if (step.requiresItems) {
      for (const itemId of step.requiresItems) {
        if (!this.inventory.has(itemId)) return false;
      }
    }
    return true;
  }
  
  completeCurrentStep(): void {
    const step = this.currentTask.steps[this.currentStepIndex];
    
    // Grant items
    if (step.grantsItems) {
      for (const itemId of step.grantsItems) {
        this.addItem(itemId);
      }
      // Auto-toast with formatted names (e.g. "You found: Clean Water!")
    }
    
    // Consume items
    if (step.consumesItems) {
      for (const itemId of step.consumesItems) {
        this.inventory.delete(itemId);
      }
      this.broadcastInventory();
    }
  }
}
```

### TaskStep Schema
**Location:** [tasks.ts#L12-L21](../src/game/content/tasks.ts#L12-L21)

```typescript
interface TaskStep {
  targetId: string; // MUST match Interactable.id
  promptIcon: PromptIcon; // hand, axe, log, fire, etc.
  requiresItems?: string[]; // ItemIds - ALL must be in inventory
  grantsItems?: string[]; // ItemIds - ALL added on completion
  consumesItems?: string[]; // ItemIds - ALL removed on completion
}
```

### Creek World Inventory Requirements (from README)

**Girl Filter Station:**
- Requires: `field_guide`, `string` (if these exist as items)
- Grants: `clean_water` (count: 3, per README spec)
- Need to add `clean_water` to [items.ts](../src/game/content/items.ts):
  ```typescript
  clean_water: {
    id: 'clean_water',
    name: 'Clean Water',
    icon: '💧',
    description: 'Filtered water from the creek',
    stackable: true,
    maxStack: 3, // Per README spec
  }
  ```

**Boy Slingshot Bridge:**
- Requires: `slingshot` (if exists as item)
- Does NOT grant items (visual-only mechanic)
- Uses worldFlags to persist hit count and bridge state

### Key Insights
- **Set-based inventory:** Simple presence checks, no count tracking in TaskSystem
- **Automatic toast notifications:** TaskSystem formats item names and emits toasts
- **InteractionSystem enforcement:** `canInteract()` prevents interaction before requirements met
- **No item objects:** Inventory uses string IDs, display data comes from [items.ts](../src/game/content/items.ts) ItemDef

---

## 4. Stepping Stones Walkable Solution

### PlayerController Raycast Constraint
**Location:** [controller.ts#L56](../src/game/entities/player/controller.ts#L56)

```typescript
// In PlayerController.update()
const hit = scene.pickWithRay(ray, (mesh) => {
  return mesh.name === 'ground'; // HARDCODED CHECK
});
```

**Constraint:** Movement clicks ONLY register on meshes named `'ground'`

### Solution Options

#### Option A: Name all stones 'ground' (SIMPLEST)
```typescript
// In CreekWorld.ts
const stones = createSteppingStones(scene);
stones.forEach(mesh => {
  mesh.name = 'ground'; // Makes all stones clickable
});
```

**Pros:**
- No controller modification needed
- Works immediately with existing system
- Consistent with current architecture

**Cons:**
- Cannot distinguish between bank ground and stones for different behaviors
- Harder to implement splash/retry mechanic (need trigger volumes instead of click detection)

#### Option B: Extend controller with metadata check
```typescript
// In controller.ts#L56
const hit = scene.pickWithRay(ray, (mesh) => {
  return mesh.name === 'ground' || mesh.metadata?.walkable === true;
});

// In CreekWorld.ts
stone.metadata = { walkable: true };
```

**Pros:**
- More flexible for future walkable surfaces (bridges, platforms)
- Can distinguish stone clicks from ground clicks
- Better for complex stepping stone mechanics

**Cons:**
- Requires controller modification
- Potential for bugs if metadata not set properly

### Recommended Solution: **Option A + Trigger Volumes**
1. Name stepping stones `'ground'` for movement
2. Create invisible water trigger volume (box collider) around stepping stone area
3. On player position update, check if player.position is inside water trigger AND not on a stone
4. If true → splash effect, teleport to last safe position (entry bank)

**Implementation sketch:**
```typescript
// Water failure detection (in CreekWorld update callback)
const playerOnStone = stones.some(stone => 
  Vector3.Distance(player.position, stone.position) < STONE_RADIUS
);
const playerInWater = waterTrigger.contains(player.position);

if (playerInWater && !playerOnStone) {
  // Splash effect, teleport to (0,0,15)
  eventBus.emit({ type: 'game/interact', targetId: 'creek_water_splash' });
  player.position.copyFrom(lastSafePosition);
}
```

### Key Insights
- **Hard constraint:** PlayerController will NOT change in Creek implementation
- **Stepping stones must be named 'ground'** for movement to work
- **Splash mechanic uses position checking**, not mesh click events
- **Last safe position tracking** needed for retry mechanic

---

## 5. worldFlags Persistence System (Phase 11 Addition)

### API (from Phase 11)
**Location:** [saveFacade.ts#L101-L133](../src/game/systems/saves/saveFacade.ts#L101-L133)

```typescript
// Get flag (with type inference)
const hitCount = saveFacade.getWorldFlag<number>('creek', 'slingshotHitCount');
// Returns: number | undefined

// Set flag (atomic save)
saveFacade.setWorldFlag('creek', 'slingshotHitCount', 2);

// Clear all flags for area (useful for dev reset)
saveFacade.clearWorldFlags('creek');
```

### Creek World Usage Examples

**Slingshot bridge hit counter:**
```typescript
// In slingshot interactable.interact()
const hitCount = saveFacade.getWorldFlag<number>('creek', 'slingshotHitCount') ?? 0;
const newCount = hitCount + 1;
saveFacade.setWorldFlag('creek', 'slingshotHitCount', newCount);

if (newCount >= 3) {
  // Spawn bridge, disable branch
  saveFacade.setWorldFlag('creek', 'bridgeBuilt', true);
}
```

**Linger moment persistence:**
```typescript
// In Deep Pool dwell trigger
if (dwellTime >= 15000 && !alreadyLinged) {
  saveFacade.setWorldFlag('creek', 'deepPoolLinger', true);
  eventBus.emit({ type: 'ui/toast', level: 'info', message: 'Still Water' });
}
```

**Restore state on world load:**
```typescript
// In createCreekWorld()
const bridgeBuilt = saveFacade.getWorldFlag<boolean>('creek', 'bridgeBuilt') ?? false;
if (bridgeBuilt) {
  // Hide branch, show bridge log immediately
  branch.setEnabled(false);
  bridge.setEnabled(true);
}
```

### Key Insights
- **Defensive initialization:** getWorldFlag returns undefined if flag doesn't exist
- **Atomic writes:** setWorldFlag saves immediately (no manual save() call needed)
- **Type safety:** Generic parameter for type inference
- **Area-scoped:** Flags are nested under area ID to avoid collisions

---

## 6. Creek README Vision Summary

**Layout:**
- 100×140 corridor (north-south)
- Creek runs down center
- Player spawns at south end (0,0,15) facing north
- 8 key locations with specific coordinates

**Core Mechanics:**
1. **Stepping Stones** (0,0,0): 5 entry stones, 1.5 unit spacing, wobble/failure/retry
2. **Filter Station** (-8,0,0): Girl - requires field_guide + string → grants clean_water ×3
3. **Slingshot Bridge** (5,0,-10): Boy - 3 hits → branch falls → bridge forms

**Linger Moments:**
- Deep Pool (-10,0,-15): 15s dwell → worldFlag + toast "Still Water"
- Willow Rest (10,0,5): 10s dwell → worldFlag + toast "Under the Willow"

**Vistas:**
- South (0,0,60): Woodline treeline + conditional campfire smoke
- North (0,0,-60): Rocky channel + pine silhouettes + fog gradient

**Atmosphere:**
- Mid-to-late afternoon lighting
- Cool blues, sun-warmed stones
- Water caustics on creek bed
- Creek babble loop + splash sounds

---

## 7. Implementation Readiness Checklist

### Systems Understood ✅
- [x] Task completion flow (interact → completeStep → progression)
- [x] World transitions (game/areaRequest → GameApp.transitionToArea)
- [x] Inventory grant/consumption (TaskSystem.completeCurrentStep)
- [x] Stepping stones walkable constraint (mesh.name === 'ground')
- [x] worldFlags persistence (getWorldFlag/setWorldFlag)

### Content Gaps Identified 🔧
- [ ] Creek interactable IDs not added to interactableIds.ts
- [ ] Creek tasks not defined in tasks.ts
- [ ] clean_water item not added to items.ts
- [ ] Current CreekWorld.ts stub has wrong dimensions (80×80 vs 100×140)

### Design Decisions Made ✅
- **Stepping stones:** Name all stones 'ground' + water trigger volume for splash detection
- **Filter station:** Use requiresItems for field_guide + string (if items exist)
- **Slingshot bridge:** Track hit count with worldFlags, show/hide meshes based on state
- **Linger moments:** Use per-frame dwell accumulation + worldFlags to prevent repeat
- **Vistas:** Conditional visuals based on getWorldFlag('woodline', 'campfireLit')

---

## Summary for Continuation

The existing systems are **robust and well-architected**. Creek world implementation can proceed with confidence following these patterns:

1. **Task Steps:** Define in tasks.ts with proper targetId/requiresItems/grantsItems
2. **Interactables:** Create with alwaysActive for gates, emit interaction/complete for task progression
3. **Inventory:** Use ItemDef in items.ts, TaskSystem handles all grant/consume logic automatically
4. **Stepping Stones:** Name 'ground' for movement, use position-based water trigger for splash
5. **Persistence:** worldFlags for slingshot hits, linger moments, bridge state
6. **Visuals:** Restore state on world load using worldFlags checks

**No new systems needed.** All mechanics can be implemented with existing TaskSystem, worldFlags, and InteractionSystem infrastructure.

---

**Next Step:** Proceed to Phase 12 Step 1 - Add Creek content IDs and tasks
