# Inventory System Mapping - Phase 1

**Date:** January 2, 2026  
**Author:** Comprehensive Codebase Sweep  
**Purpose:** Complete mapping of the inventory system architecture, data flow, and component relationships

---

## Executive Summary

The inventory system in Little Worlds is a **set-based, ID-driven architecture** that manages items across gameplay sessions. It's tightly integrated with the task system, save/load persistence, and UI display components. The system uses string-based item IDs (not full objects) for lightweight inventory management, with display data sourced from a centralized item registry.

**Key Characteristics:**
- **Simple set-based storage** (no quantity tracking in core system)
- **String IDs only** in inventory (display data from `items.ts`)
- **Automatic item grants/consumption** driven by task definitions
- **Real-time UI updates** via event bus
- **Role-based persistence** (separate inventories for boy/girl)
- **Autosave integration** for progress safety

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                 │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ InventoryDisplay │  │ InventoryBubbles│  │  HUD (mount)   │ │
│  │   (top-right)    │  │   (deprecated)  │  │                │ │
│  └────────┬─────────┘  └─────────────────┘  └────────┬───────┘ │
│           │ listens to                                │         │
│           │ game/inventoryUpdate                      │         │
└───────────┼───────────────────────────────────────────┼─────────┘
            │                                           │
            │                                           │
┌───────────▼───────────────────────────────────────────▼─────────┐
│                       EVENT BUS (events.ts)                      │
│  ui/getInventory  →  game/inventoryUpdate                        │
│  (request)            (broadcast: string[])                      │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      GAME LOGIC LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              TaskSystem (core inventory owner)             │  │
│  │  - inventory: Set<string>  (item IDs)                      │  │
│  │  - addItem(itemId: string)                                 │  │
│  │  - getInventory(): string[]                                │  │
│  │  - completeCurrentStep() → auto grant/consume items        │  │
│  │  - broadcastInventory() → emits game/inventoryUpdate       │  │
│  └────────────────────────────────────────────────────────────┘  │
│           ▲                           │                            │
│           │ reads inventory           │ save on complete          │
│  ┌────────┴─────────┐     ┌──────────▼──────────────┐           │
│  │ InteractionSystem │     │  ProgressionSystem      │           │
│  │ (proximity check) │     │  (area completion)      │           │
│  └──────────────────┘     └─────────────┬───────────┘           │
│                                          │                         │
│                           ┌──────────────▼──────────────┐         │
│                           │   AutosaveSystem            │         │
│                           │   (periodic saves)          │         │
│                           └─────────────┬───────────────┘         │
└─────────────────────────────────────────┼─────────────────────────┘
                                          │
┌─────────────────────────────────────────▼─────────────────────────┐
│                     PERSISTENCE LAYER                              │
│  ┌────────────┐   ┌──────────────┐   ┌─────────────────────────┐ │
│  │ SaveFacade │──▶│  SaveSystem  │──▶│  localStorage           │ │
│  │ (high-level│   │  (low-level) │   │  ("littleworlds_save_") │ │
│  │  API)      │   │              │   │                         │ │
│  └────────────┘   └──────────────┘   └─────────────────────────┘ │
│  - setInventory(roleId, items)                                    │
│  - getInventory(roleId): string[]                                 │
│  - syncInventory() (for autosave)                                 │
└───────────────────────────────────────────────────────────────────┘
                                          ▲
┌─────────────────────────────────────────┴─────────────────────────┐
│                      CONTENT/DATA LAYER                            │
│  ┌──────────────┐   ┌────────────────────────────────────────┐   │
│  │  items.ts    │   │          tasks.ts                      │   │
│  │  (registry)  │   │  - grantsItems?: ItemId[]              │   │
│  │              │   │  - consumesItems?: ItemId[]            │   │
│  │  ITEMS: {    │   │  - requiresItems?: ItemId[]            │   │
│  │    axe: {...}│   │  (data-driven item management)         │   │
│  │    log: {...}│   └────────────────────────────────────────┘   │
│  │  }           │                                                 │
│  └──────────────┘                                                 │
└───────────────────────────────────────────────────────────────────┘
```

---

## File-by-File Breakdown

### 🎯 CORE SYSTEMS

#### 1. **TaskSystem.ts** - Primary Inventory Owner
**Path:** [src/game/systems/tasks/TaskSystem.ts](../src/game/systems/tasks/TaskSystem.ts)

**Purpose:** Central authority for inventory state during gameplay. Owns the inventory Set, handles item grants/consumption based on task definitions, and broadcasts updates to UI.

**Key Properties:**
- `private inventory = new Set<string>()` - Active inventory (item IDs only)
- `private eventBus: EventBus` - Communication channel

**Key Methods:**
```typescript
addItem(itemId: string): void
  - Adds item to inventory Set
  - Calls broadcastInventory() to update UI

getInventory(): string[]
  - Returns Array.from(inventory) for persistence

completeCurrentStep(): void
  - Auto-grants items from step.grantsItems
  - Auto-consumes items from step.consumesItems
  - Emits toast notifications for item gains
  - Calls broadcastInventory() after consumption

canInteract(targetId: string): boolean
  - Checks if step.requiresItems are all in inventory
  - Returns false if any required item is missing

broadcastInventory(): void (private)
  - Converts Set to array
  - Emits 'game/inventoryUpdate' event with items

formatItemName(itemId: string): string (private)
  - Converts item IDs to display names (slingshot → Slingshot)
```

**Imports:**
- `Task` from `@game/content/tasks`
- `AppEvent` from `@game/shared/events`

**Exports:**
- `TaskSystem` class

**Interactions:**
- **Reads:** Task definitions (from content/tasks.ts)
- **Writes to:** Event bus (inventory updates, task events)
- **Called by:** GameApp (initialization), InteractionSystem (can interact checks), ProgressionSystem (get inventory for save)

---

#### 2. **InteractionSystem.ts** - Proximity & Interaction Handler
**Path:** [src/game/systems/interactions/InteractionSystem.ts](../src/game/systems/interactions/InteractionSystem.ts)

**Purpose:** Manages player-interactable proximity checks, dwell timers, and triggers interactions. Checks task requirements (including inventory) before allowing interaction.

**Key Methods:**
```typescript
registerInteractable(interactable: Interactable): void
  - Registers world objects as interactable

update(playerPos: Vector3, dt: number): void
  - Checks proximity to interactables
  - Accumulates dwell time
  - Triggers interaction when dwell completes

handleInteraction(): void (private)
  - Checks taskSystem.canInteract() (inventory requirements)
  - Triggers interactable.interact() on dwell complete
```

**Imports:**
- `TaskSystem` from `../tasks/TaskSystem`
- `GameToUi` from `@game/shared/events`

**Exports:**
- `InteractionSystem` class

**Interactions:**
- **Reads:** TaskSystem.canInteract() (checks inventory requirements)
- **Writes to:** Event bus (prompts, dwell progress)
- **Called by:** GameApp (update loop)

---

#### 3. **ProgressionSystem.ts** - Area Completion & Persistence
**Path:** [src/game/systems/progression/ProgressionSystem.ts](../src/game/systems/progression/ProgressionSystem.ts)

**Purpose:** Manages task chains within areas. On area completion, saves inventory state to persistent storage.

**Key Methods:**
```typescript
handleTaskEvent(taskId: string, complete: boolean): void
  - Handles task completion
  - Advances to next task or completes area

completeArea(): void (private)
  - Marks area complete in save system
  - Saves current inventory state
  - Emits toast for area unlock
```

**Imports:**
- `TaskSystem` from `../tasks/TaskSystem`
- `saveFacade` from `../saves/saveFacade`
- `eventBus` from `@game/shared/events`

**Exports:**
- `ProgressionSystem` class

**Interactions:**
- **Reads:** TaskSystem.getInventory() (for persistence)
- **Writes to:** SaveFacade (saves inventory on area complete)
- **Called by:** GameApp (task completion handler)

---

#### 4. **AutosaveSystem.ts** - Periodic Inventory Persistence
**Path:** [src/game/systems/autosave/AutosaveSystem.ts](../src/game/systems/autosave/AutosaveSystem.ts)

**Purpose:** Prevents data loss by automatically saving inventory and progress at key moments (task complete, pause, 60s intervals).

**Key Properties:**
- `private intervalHandle: NodeJS.Timeout | null` - 60s save timer
- `private debounceTimer: NodeJS.Timeout | null` - 500ms debounce

**Key Methods:**
```typescript
start(): void
  - Subscribes to game/task complete, ui/pause events
  - Starts 60s interval timer

triggerSave(reason: string): void (private)
  - Debounces save requests (500ms)

performSave(reason: string): void (private)
  - Reads TaskSystem.getInventory()
  - Calls saveFacade.syncInventory()
  - Calls saveFacade.syncLastArea()
```

**Imports:**
- `TaskSystem` from `../tasks/TaskSystem`
- `saveFacade` from `../saves/saveFacade`

**Exports:**
- `AutosaveSystem` class

**Interactions:**
- **Reads:** TaskSystem.getInventory()
- **Writes to:** SaveFacade.syncInventory()
- **Called by:** GameApp (lifecycle management)

---

### 💾 PERSISTENCE LAYER

#### 5. **SaveSystem.ts** - Low-Level Storage
**Path:** [src/game/systems/saves/SaveSystem.ts](../src/game/systems/saves/SaveSystem.ts)

**Purpose:** Low-level save/load interface to localStorage with versioning and migrations.

**Key Types:**
```typescript
interface RoleProgress {
  unlockedAreas: string[];
  completedAreas: string[];
  completedTasks: string[];
  inventory: string[];          // ← Inventory storage per role
  lastAreaId: string;
}

interface SaveData {
  version: number;
  timestamp: number;
  slotId: string;
  roles: Record<'boy' | 'girl', RoleProgress>;
  lastSelectedRole: 'boy' | 'girl' | null;
  worldFlags?: Record<string, Record<string, any>>;
}
```

**Key Methods:**
```typescript
loadSlot(slotId: string): SaveData | null
  - Loads from localStorage
  - Applies migrations if needed

write(slotId: string, data: SaveData): boolean
  - Writes to localStorage with versioning
```

**Imports:**
- `migrateSaveData` from `./migrations`

**Exports:**
- `SaveSystem` class
- `SaveData` interface
- `RoleProgress` interface

**Interactions:**
- **Reads/Writes:** localStorage (`"littleworlds_save_" + slotId`)
- **Used by:** SaveFacade (wrapper API)

---

#### 6. **saveFacade.ts** - High-Level Save API
**Path:** [src/game/systems/saves/saveFacade.ts](../src/game/systems/saves/saveFacade.ts)

**Purpose:** High-level API for save operations. Provides convenient methods for inventory management.

**Key Methods:**
```typescript
setInventory(roleId: 'boy' | 'girl', inventory: string[]): SaveData
  - Sets inventory for a role
  - Writes to storage immediately

getInventory(roleId: 'boy' | 'girl'): string[]
  - Retrieves inventory for a role

syncInventory(roleId: 'boy' | 'girl', inventory: string[]): SaveData
  - Updates inventory without full area completion
  - Used by AutosaveSystem

loadMain(): SaveData
  - Loads main save slot

writeMain(save: SaveData): boolean
  - Writes to main save slot
```

**Imports:**
- `SaveSystem` from `./SaveSystem`
- `AreaId` from `@game/content/areas`

**Exports:**
- `saveFacade` singleton instance

**Interactions:**
- **Wraps:** SaveSystem (low-level storage)
- **Used by:** GameApp, ProgressionSystem, AutosaveSystem

---

#### 7. **migrations.ts** - Save Version Migrations
**Path:** [src/game/systems/saves/migrations.ts](../src/game/systems/saves/migrations.ts)

**Purpose:** Handles save data migrations across versions. Ensures inventory field exists in all role progress objects.

**Key Migrations:**
- **v1 → v2:** Introduces dual-role progression + inventory per role
- **v2 → v3:** Unlocks all areas (dev convenience)

**Exports:**
- `migrateSaveData(data, targetVersion)` function

**Interactions:**
- **Called by:** SaveSystem during load

---

### 🎨 UI LAYER

#### 8. **InventoryDisplay.tsx** - Visual Inventory Widget
**Path:** [src/ui/hud/widgets/InventoryDisplay.tsx](../src/ui/hud/widgets/InventoryDisplay.tsx)

**Purpose:** Top-right collapsible bag icon with item list. Primary inventory UI component.

**Key State:**
```typescript
const [items, setItems] = useState<string[]>([])
const [isExpanded, setIsExpanded] = useState(false)
```

**Key Behavior:**
- **On mount:** Emits `ui/getInventory` to request current state
- **Listens to:** `game/inventoryUpdate` events
- **Renders:**
  - Collapsed: Bag icon with count badge
  - Expanded: List of items with formatted names

**Imports:**
- `eventBus, AppEvent` from `@game/shared/events`

**Exports:**
- `InventoryDisplay` component (default export)

**Interactions:**
- **Requests:** Emits `ui/getInventory` on mount
- **Receives:** `game/inventoryUpdate` events from TaskSystem
- **Renders:** Item list with formatItemName() helper

---

#### 9. **InventoryBubbles.tsx** - Legacy Component (Deprecated)
**Path:** [src/ui/hud/widgets/InventoryBubbles.tsx](../src/ui/hud/widgets/InventoryBubbles.tsx)

**Purpose:** Simple item bubble display (likely deprecated, not actively used).

**Props:**
```typescript
interface InventoryBubblesProps {
  items?: string[];
}
```

**Status:** 🚨 **Deprecated** - Not receiving events, replaced by InventoryDisplay

**Imports:** None

**Exports:**
- `InventoryBubbles` component (default export)

---

#### 10. **HUD.tsx** - HUD Component Orchestrator
**Path:** [src/ui/hud/HUD.tsx](../src/ui/hud/HUD.tsx)

**Purpose:** Mounts all HUD components including inventory displays. Subscribes to game events.

**Key Structure:**
```tsx
<div className="hud">
  {/* Prompts - top center */}
  {/* Inventory Display - top right */}
  <InventoryDisplay />
  
  {/* Bottom UI */}
  <InventoryBubbles /> {/* Legacy, not functional */}
  <CompanionCallButton />
  
  <ToastOverlay />
</div>
```

**Imports:**
- `InventoryDisplay` from `./widgets/InventoryDisplay`
- `InventoryBubbles` from `./widgets/InventoryBubbles`
- `eventBus` from `@game/shared/events`

**Exports:**
- `HUD` component (default export)

**Interactions:**
- **Mounts:** InventoryDisplay (active), InventoryBubbles (inactive)
- **Subscribes:** Game events for toasts, prompts, companion state

---

### 🔌 EVENT BUS & COMMUNICATION

#### 11. **events.ts** - Typed Event Bus
**Path:** [src/game/shared/events.ts](../src/game/shared/events.ts)

**Purpose:** Defines all events for UI ↔ Game communication. Type-safe event system.

**Inventory-Related Events:**
```typescript
// UI → Game
type UiToGame =
  | { type: 'ui/getInventory' }  // Request current inventory
  | ...

// Game → UI
type GameToUi =
  | { type: 'game/inventoryUpdate'; items: string[] }  // Send current inventory
  | { type: 'ui/toast'; level: 'info' | 'warning' | 'error'; message: string }
  | ...
```

**Exports:**
- `AppEvent` type (union of UiToGame and GameToUi)
- `eventBus` singleton

**Interactions:**
- **Used by:** All systems and UI components
- **Pattern:** Request/response for inventory sync

---

#### 12. **useUiStore.ts** - UI State Management (Legacy)
**Path:** [src/ui/state/useUiStore.ts](../src/ui/state/useUiStore.ts)

**Purpose:** Zustand store for UI state. Contains legacy inventory state (not actively used).

**Inventory State (Legacy):**
```typescript
interface UiState {
  inventoryItems: string[];           // ← Legacy, not used
  addInventoryItem: (item: string) => void;   // ← Legacy
  removeInventoryItem: (item: string) => void; // ← Legacy
}
```

**Status:** 🚨 **Legacy** - Modern inventory uses event bus pattern, not Zustand store

**Imports:**
- `zustand` for state management

**Exports:**
- `useUiStore` hook

---

### 📦 CONTENT/DATA LAYER

#### 13. **items.ts** - Item Registry
**Path:** [src/game/content/items.ts](../src/game/content/items.ts)

**Purpose:** Centralized item definitions with metadata. Display data source for inventory UI.

**Key Type:**
```typescript
export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  stackable: boolean;
  maxStack?: number;
}
```

**Registry:**
```typescript
export const ITEMS: Record<string, ItemDef> = {
  axe: { id: 'axe', name: 'Axe', icon: 'ui/icon_axe.png', ... },
  slingshot: { id: 'slingshot', name: 'Slingshot', ... },
  clean_water: { id: 'clean_water', name: 'Clean Water', icon: '💧', ... },
  // ... 12+ items total
}
```

**Exports:**
- `ItemDef` interface
- `ITEMS` registry
- `ItemId` type (keyof typeof ITEMS)
- `ALL_ITEM_IDS` array

**Interactions:**
- **Used by:** Task definitions (requiresItems, grantsItems, consumesItems)
- **Referenced by:** InventoryDisplay (for rendering item names)
- **Not imported by:** TaskSystem (uses IDs only, no item objects)

---

#### 14. **tasks.ts** - Task Definitions (Item Management Data)
**Path:** [src/game/content/tasks.ts](../src/game/content/tasks.ts)

**Purpose:** Defines task chains with item grants, consumption, and requirements.

**Key Types:**
```typescript
export interface TaskStep {
  id: string;
  targetId: InteractableId;
  promptIcon: 'hand' | 'axe' | 'log' | ...;
  requiresItems?: ItemId[];    // Must have all to interact
  grantsItems?: ItemId[];      // Given on step complete
  consumesItems?: ItemId[];    // Removed on step complete
}

export interface Task {
  id: string;
  name: string;
  steps: TaskStep[];
}
```

**Example Task:**
```typescript
export const campfire_v1: Task = {
  id: 'campfire_v1',
  name: 'Build a Campfire',
  steps: [
    {
      id: 'pickup_axe',
      targetId: INTERACTABLE_ID.AXE,
      promptIcon: 'hand',
      grantsItems: ['axe'],  // ← Grants axe
    },
    {
      id: 'chop_log',
      targetId: INTERACTABLE_ID.LOGPILE,
      promptIcon: 'axe',
      requiresItems: ['axe'],  // ← Requires axe
      grantsItems: ['log'],
    },
    {
      id: 'light_fire',
      targetId: INTERACTABLE_ID.CAMPFIRE,
      promptIcon: 'fire',
      requiresItems: ['log'],  // ← Requires log
    },
  ],
}
```

**Exports:**
- `Task`, `TaskStep` interfaces
- Task definitions (campfire_v1, boy_backyard_find_slingshot, etc.)
- `TASKS_BY_ID` registry

**Interactions:**
- **Used by:** TaskSystem (drives item grants/consumption)
- **Used by:** ProgressionSystem (task chains)

---

#### 15. **areas.ts** - Area/World Registry
**Path:** [src/game/content/areas.ts](../src/game/content/areas.ts)

**Purpose:** Defines area progression and task assignments per role.

**Key Type:**
```typescript
export interface AreaDef {
  id: AreaId;
  name: string;
  worldKey: string;
  next?: AreaId;
  tasksByRole: {
    boy: string[];   // Task IDs
    girl: string[];  // Task IDs
  };
}
```

**Exports:**
- `AreaId` type
- `RoleId` type
- `AREAS` registry

**Interactions:**
- **Used by:** ProgressionSystem (task chains per area/role)
- **Used by:** SaveSystem (area unlock/completion)

---

### 🎮 GAME ORCHESTRATION

#### 16. **GameApp.ts** - Game Lifecycle Manager
**Path:** [src/game/GameApp.ts](../src/game/GameApp.ts)

**Purpose:** Orchestrates game initialization, system lifecycle, and inventory sync across area transitions.

**Inventory-Related Code:**
```typescript
// On area transition (gate interaction):
private onAreaRequest(areaId: string) {
  // Save inventory before transitioning
  const inventory = this.taskSystem?.getInventory() || [];
  saveFacade.setInventory(this.startParams.roleId, inventory);
  // ... transition to new area
}

// On world load:
async start() {
  // Create TaskSystem
  this.taskSystem = new TaskSystem(this.bus);
  
  // Load saved inventory for this role
  const savedInventory = saveFacade.getInventory(this.startParams.roleId);
  savedInventory.forEach(item => this.taskSystem!.addItem(item));
  
  // Create ProgressionSystem, AutosaveSystem, etc.
}
```

**Imports:**
- `TaskSystem`, `ProgressionSystem`, `AutosaveSystem`
- `saveFacade` from `@game/systems/saves/saveFacade`

**Exports:**
- `GameApp` class

**Interactions:**
- **Initializes:** TaskSystem, ProgressionSystem, AutosaveSystem
- **Syncs:** Inventory on area transitions
- **Loads:** Saved inventory on game start

---

### 🛠️ LEGACY/UNUSED FILES

#### 17. **inventory.ts** - Legacy Player Inventory Class
**Path:** [src/game/entities/player/inventory.ts](../src/game/entities/player/inventory.ts)

**Purpose:** Original OOP-based inventory system with full item objects.

**Status:** 🚨 **NOT USED** - Replaced by TaskSystem's Set-based approach

**Key Code:**
```typescript
export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
}

export class Inventory {
  private items: InventoryItem[] = [];
  private maxSlots = 4;
  
  addItem(item: InventoryItem): boolean { ... }
  removeItem(itemId: string): boolean { ... }
  hasItem(itemId: string): boolean { ... }
  getItems(): InventoryItem[] { ... }
}
```

**Why Unused:**
- TaskSystem uses lightweight `Set<string>` instead
- No need for full item objects in inventory (data lives in items.ts)
- Simpler architecture with data-driven approach

---

#### 18. **cheats.ts** - Debug Cheat System
**Path:** [src/game/debug/cheats.ts](../src/game/debug/cheats.ts)

**Purpose:** Debug cheats including `giveitem` command.

**Inventory Cheat:**
```typescript
{
  name: 'givitem',
  description: 'Give an item to inventory',
  execute: (itemId: string) => {
    console.log(`Giving item: ${itemId}`);
    // TODO: Implement give item
  },
}
```

**Status:** 🚧 **Incomplete** - Cheat defined but not implemented

---

## Connection Map & Data Flow

### Primary Data Flow (Simplified)

```
1. TASK DEFINITION (tasks.ts)
   └─> grantsItems: ['axe'] or consumesItems: ['log']

2. TASK COMPLETION
   └─> TaskSystem.completeCurrentStep()
       ├─> Adds items to inventory Set
       ├─> Removes consumed items from Set
       └─> broadcastInventory()

3. EVENT BUS BROADCAST
   └─> { type: 'game/inventoryUpdate', items: ['axe', 'log'] }

4. UI UPDATE
   └─> InventoryDisplay.tsx receives event
       └─> setState(items) → re-renders

5. PERSISTENCE (triggered by multiple sources)
   ├─> AutosaveSystem (60s interval, task complete, pause)
   ├─> ProgressionSystem (area complete)
   └─> GameApp (area transition)
       └─> saveFacade.setInventory(roleId, items)
           └─> SaveSystem.write()
               └─> localStorage["littleworlds_save_main"]

6. LOAD ON START
   └─> GameApp.start()
       └─> saveFacade.getInventory(roleId)
           └─> savedInventory.forEach(item => taskSystem.addItem(item))
```

### Interaction Flow (Player Interaction)

```
Player walks near interactable
  └─> InteractionSystem.update(playerPos, dt)
      └─> Checks proximity (< 3.0 units)
          └─> Checks TaskSystem.canInteract(targetId)
              ├─> step.requiresItems? → check inventory.has(itemId)
              └─> Returns true if all items present
                  └─> Accumulates dwell time
                      └─> On dwell complete (500ms)
                          └─> interactable.interact()
                              └─> TaskSystem.completeCurrentStep()
                                  └─> (Back to Primary Flow #2)
```

### Request/Response Pattern

```
InventoryDisplay.tsx (on mount)
  └─> Emits: { type: 'ui/getInventory' }
      └─> TaskSystem (event listener)
          └─> broadcastInventory()
              └─> Emits: { type: 'game/inventoryUpdate', items: [...] }
                  └─> InventoryDisplay receives and updates state
```

---

## Summary of Key Findings

### ✅ Active Components
1. **TaskSystem** - Core inventory owner (Set-based)
2. **InventoryDisplay.tsx** - Primary UI widget (top-right bag)
3. **SaveFacade + SaveSystem** - Persistence layer
4. **AutosaveSystem** - Periodic inventory saves
5. **ProgressionSystem** - Area completion saves
6. **items.ts** - Item registry (display data)
7. **tasks.ts** - Data-driven item management

### 🚨 Legacy/Deprecated Components
1. **inventory.ts** (player/inventory.ts) - Not used, replaced by TaskSystem
2. **InventoryBubbles.tsx** - Not functional, replaced by InventoryDisplay
3. **useUiStore.ts** inventory state - Not used, replaced by event bus pattern

### 🎯 Core Architecture Decisions
1. **Set-based inventory** - Simple presence checks, no quantity tracking
2. **String IDs only** - No full item objects in inventory
3. **Data-driven** - All item grants/consumption from task definitions
4. **Event bus pattern** - UI syncs via game/inventoryUpdate events
5. **Role-based persistence** - Separate inventories for boy/girl
6. **Autosave integration** - 60s intervals + key moments

### 📊 System Statistics
- **Active Files:** 16 core files
- **Legacy Files:** 3 unused/deprecated
- **Item Definitions:** 12+ items in registry
- **Inventory Events:** 2 (ui/getInventory, game/inventoryUpdate)
- **Save Locations:** localStorage (per role)
- **Autosave Frequency:** 60s in production, 15s in dev

---

## Next Steps & Recommendations

### Phase 2: Potential Enhancements
1. **Cleanup legacy code** - Remove unused inventory.ts and InventoryBubbles
2. **Implement quantity tracking** - If needed for stackable items
3. **Complete cheat system** - Implement `giveitem` debug command
4. **Item icons** - Display icons in InventoryDisplay (currently text only)
5. **Inventory limits** - Implement max capacity (currently unlimited)
6. **Item tooltips** - Show item descriptions on hover

### Phase 3: Testing & Validation
1. **Verify persistence** - Test inventory across area transitions
2. **Test autosave** - Confirm 60s interval saves work correctly
3. **Test role separation** - Verify boy/girl inventories are independent
4. **Test consumption** - Verify items are removed correctly
5. **Test requirements** - Verify interactions blocked without required items

---

## Appendix: File Reference Table

| File | Category | Status | LOC | Key Exports |
|------|----------|--------|-----|-------------|
| TaskSystem.ts | Core | ✅ Active | 164 | TaskSystem class |
| InteractionSystem.ts | Core | ✅ Active | 183 | InteractionSystem class |
| ProgressionSystem.ts | Core | ✅ Active | 170 | ProgressionSystem class |
| AutosaveSystem.ts | Core | ✅ Active | 131 | AutosaveSystem class |
| SaveSystem.ts | Persistence | ✅ Active | 152 | SaveSystem, SaveData |
| saveFacade.ts | Persistence | ✅ Active | 184 | saveFacade singleton |
| migrations.ts | Persistence | ✅ Active | 105 | migrateSaveData() |
| InventoryDisplay.tsx | UI | ✅ Active | 216 | InventoryDisplay component |
| HUD.tsx | UI | ✅ Active | 82 | HUD component |
| events.ts | Events | ✅ Active | 72 | AppEvent, eventBus |
| items.ts | Content | ✅ Active | 115 | ITEMS, ItemDef, ItemId |
| tasks.ts | Content | ✅ Active | 240 | Task, TaskStep, task defs |
| areas.ts | Content | ✅ Active | 111 | AREAS, AreaDef, AreaId |
| GameApp.ts | Orchestration | ✅ Active | 645 | GameApp class |
| inventory.ts | Legacy | 🚨 Unused | 43 | Inventory class (OOP) |
| InventoryBubbles.tsx | Legacy | 🚨 Unused | 15 | InventoryBubbles component |
| useUiStore.ts | Legacy | 🚨 Partial | 87 | useUiStore hook |
| cheats.ts | Debug | 🚧 Incomplete | 73 | CheatSystem class |

---

**End of Inventory System Mapping - Phase 1**
