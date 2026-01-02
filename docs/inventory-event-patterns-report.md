# Inventory System - Event Patterns & Character Integration Report
**Date:** January 2, 2026  
**Phase:** Pre-Phase 2 Analysis

---

## Executive Summary

This report provides a detailed analysis of the inventory system's event-driven architecture, focusing on the communication patterns between UI components, game systems, and save persistence. The inventory system uses a **publish-subscribe event bus pattern** with **dual-role character support**, allowing the boy and girl characters to maintain separate inventories that persist across sessions.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         EVENT BUS                                │
│                   (Central Communication Hub)                    │
└─────────────────────────────────────────────────────────────────┘
           ▲                    ▲                    ▲
           │                    │                    │
    [UI REQUEST]         [GAME EVENTS]         [SAVE SYNC]
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  InventoryDisplay│  │   TaskSystem     │  │   SaveFacade     │
│  (React UI)      │  │  (Game Logic)    │  │  (Persistence)   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## File Analysis

### 1. **events.ts** - Event Bus & Type Definitions
**Location:** `src/game/shared/events.ts`

#### Purpose
Central event bus implementation providing typed, type-safe communication between UI and game systems.

#### Key Components

**Event Types:**
```typescript
// UI → Game events
type UiToGame = 
  | { type: 'ui/getInventory' }  // ← Request current inventory

// Game → UI events  
type GameToUi = 
  | { type: 'game/inventoryUpdate'; items: string[] }  // ← Send inventory to UI
```

**EventBus Class:**
```typescript
class EventBus {
  private handlers = new Set<EventHandler>();
  
  on(handler): unsubscribe  // Subscribe to events
  emit(event): void          // Publish events
  clear(): void              // Clear all handlers
}

export const eventBus = new EventBus();  // Singleton instance
```

#### Communication Pattern
- **Pub-Sub Architecture**: Publishers emit events without knowing who consumes them
- **Type-Safe**: TypeScript union types ensure compile-time validation
- **Decoupled**: UI and game systems don't directly reference each other
- **Unsubscribe Pattern**: `on()` returns cleanup function for React useEffect

#### Character Integration
Event bus is **character-agnostic** - it doesn't track which character's inventory is active. That responsibility belongs to TaskSystem and SaveFacade.

---

### 2. **InventoryDisplay.tsx** - UI Presentation Layer
**Location:** `src/ui/hud/widgets/InventoryDisplay.tsx`

#### Purpose
React component displaying the player's inventory in real-time. Shows a collapsible bag icon with item count badge.

#### Event Flow

**1. Mounting (Component Initialization):**
```typescript
useEffect(() => {
  // REQUEST: Ask game for current inventory
  eventBus.emit({ type: 'ui/getInventory' });
  
  // SUBSCRIBE: Listen for inventory updates
  const unsub = eventBus.on((evt) => {
    if (evt.type === 'game/inventoryUpdate') {
      setItems(evt.items);  // Update local React state
    }
  });
  
  return unsub;  // Cleanup on unmount
}, []);
```

**2. Receiving Updates:**
- TaskSystem emits `game/inventoryUpdate` whenever items change
- Component updates React state → triggers re-render
- Badge count updates automatically

#### Key Features
- **Collapsed State**: Shows bag icon + item count badge
- **Expanded State**: Shows full item list with formatted names
- **Format Helper**: Converts `snake_case` → `Title Case`
  - Example: `steel_balls` → `Steel Balls`

#### Character Integration
**Current State:** Character-blind - displays whatever inventory TaskSystem broadcasts.

**Phase 2 Consideration:** Will need to distinguish boy vs girl inventory when switching characters. Options:
1. TaskSystem switches inventory sets internally (current plan)
2. UI receives `roleId` in event and filters display
3. SaveFacade restores correct inventory on character switch

---

### 3. **HUD.tsx** - Event Orchestration Layer
**Location:** `src/ui/hud/HUD.tsx`

#### Purpose
Root HUD component coordinating all HUD widgets (prompts, companion, inventory, toasts).

#### Event Subscriptions

```typescript
useEffect(() => {
  const unsub = eventBus.on((event) => {
    if (event.type === 'game/prompt') {
      addPrompt(event);  // Add interaction prompt
    } else if (event.type === 'game/promptClear') {
      removePrompt(event.id);
    } else if (event.type === 'game/companion/state') {
      setCompanionState(event.state);
    } else if (event.type === 'game/taskComplete') {
      pushToast('info', '🎉 Task Complete!');  // Show completion feedback
    } else if (event.type === 'ui/toast') {
      pushToast(event.level, event.message);
    }
    // Note: Does NOT handle inventory events directly
  });
  
  return unsub;
}, []);
```

#### Inventory Role
HUD **renders** InventoryDisplay but **does not handle** inventory events. InventoryDisplay manages its own event subscriptions independently.

#### Character Integration
**Current State:** No direct character awareness. Companion state might reflect active character but inventory is delegated to child component.

---

### 4. **TaskSystem.ts** - Inventory Owner & Game Logic
**Location:** `src/game/systems/tasks/TaskSystem.ts`

#### Purpose
Core game system managing task progression and inventory state. **Owns the single source of truth** for inventory during gameplay.

#### Inventory Storage

```typescript
export class TaskSystem {
  private inventory = new Set<string>();  // ← Single inventory (item IDs only)
  
  addItem(itemId: string): void {
    this.inventory.add(itemId);
    this.broadcastInventory();  // Notify UI
  }
  
  getInventory(): string[] {
    return Array.from(this.inventory);
  }
  
  private broadcastInventory(): void {
    const items = Array.from(this.inventory);
    this.eventBus.emit({ type: 'game/inventoryUpdate', items });
  }
}
```

#### Event Handling

**1. UI Requests:**
```typescript
constructor(private eventBus: EventBus) {
  this.eventBusSub = this.eventBus.on((evt) => {
    if (evt.type === 'ui/getInventory') {
      this.broadcastInventory();  // Send current inventory to UI
    }
  });
}
```

**2. Task Step Completion:**
```typescript
completeCurrentStep(): void {
  const step = this.currentTask.steps[this.currentStepIndex];
  
  // GRANT items (data-driven from task definition)
  if (step.grantsItems) {
    for (const itemId of step.grantsItems) {
      this.addItem(itemId);  // ← Triggers broadcastInventory()
    }
    
    // Emit toast notification
    const message = `You found: ${itemNames.join(' + ')}!`;
    this.eventBus.emit({
      type: 'ui/toast',
      level: 'info',
      message,
    });
  }
  
  // CONSUME items (data-driven from task definition)
  if (step.consumesItems) {
    for (const itemId of step.consumesItems) {
      this.inventory.delete(itemId);
    }
    this.broadcastInventory();  // Update UI after consuming
  }
  
  // Progress task
  this.currentStepIndex++;
}
```

#### Character Integration

**Current Architecture:**
- **Single Inventory**: TaskSystem maintains ONE `Set<string>` representing the active character's inventory
- **Character Switch Responsibility**: When switching boy ↔ girl, another system (likely ProgressionSystem) must:
  1. Call `getInventory()` to extract current inventory
  2. Save via SaveFacade
  3. Load new character's inventory via SaveFacade
  4. Restore into TaskSystem

**Critical Gap:** TaskSystem doesn't know which character it's tracking. It just stores "the current inventory."

**Phase 2 Requirements:**
1. Add `currentRole: 'boy' | 'girl'` to TaskSystem
2. Implement `switchCharacter(roleId)` method
3. Coordinate with SaveFacade for persistence

---

### 5. **SaveSystem.ts** - Low-Level Persistence
**Location:** `src/game/systems/saves/SaveSystem.ts`

#### Purpose
Low-level save/load operations to localStorage. Handles versioning and migrations.

#### Data Structure

```typescript
interface RoleProgress {
  unlockedAreas: string[];
  completedAreas: string[];
  completedTasks: string[];
  inventory: string[];        // ← Per-role persistent inventory
  lastAreaId: string;
}

interface SaveData {
  version: number;
  timestamp: number;
  slotId: string;
  roles: Record<'boy' | 'girl', RoleProgress>;  // ← Dual-role support
  lastSelectedRole: 'boy' | 'girl' | null;
  worldFlags?: Record<string, Record<string, any>>;
}
```

#### Key Methods

```typescript
loadOrCreate(slotId): SaveData
write(slotId, data): boolean
createDefaultRoleProgress(): RoleProgress
```

#### Character Integration

**Strong Support:**
- Dual-role architecture baked into save format
- Each character has separate:
  - `inventory[]`
  - `completedTasks[]`
  - `lastAreaId`
  - `unlockedAreas[]`

**Character Switching:**
```typescript
// Save current character's progress
save.roles['boy'].inventory = taskSystem.getInventory();

// Switch to other character
save.lastSelectedRole = 'girl';

// Load new character's progress
taskSystem.inventory = new Set(save.roles['girl'].inventory);
```

---

### 6. **saveFacade.ts** - High-Level Persistence API
**Location:** `src/game/systems/saves/saveFacade.ts`

#### Purpose
High-level facade providing convenient save operations. Wraps SaveSystem with business logic.

#### Inventory Methods

```typescript
class SaveFacade {
  // Get inventory for specific role
  getInventory(roleId: 'boy' | 'girl'): string[] {
    const save = this.loadMain();
    return save.roles[roleId].inventory;
  }
  
  // Set inventory for specific role
  setInventory(roleId: 'boy' | 'girl', inventory: string[]): SaveData {
    const save = this.loadMain();
    save.roles[roleId].inventory = inventory;
    this.writeMain(save);
    return save;
  }
  
  // Sync inventory without full area completion (for autosave)
  syncInventory(roleId: 'boy' | 'girl', inventory: string[]): SaveData {
    const save = this.loadMain();
    save.roles[roleId].inventory = inventory;
    this.writeMain(save);
    return save;
  }
}

export const saveFacade = new SaveFacade();  // Singleton
```

#### Character Integration

**Perfect Alignment:**
- All methods accept `roleId: 'boy' | 'girl'` parameter
- Supports independent inventories per character
- `syncInventory()` designed for periodic autosave without side effects

**Usage Pattern for Character Switch:**
```typescript
// Save current character
saveFacade.syncInventory('boy', taskSystem.getInventory());

// Load new character
const newInventory = saveFacade.getInventory('girl');
// ← Need method to inject into TaskSystem
```

---

### 7. **migrations.ts** - Save Version Compatibility
**Location:** `src/game/systems/saves/migrations.ts`

#### Purpose
Migrate old save formats to current version. Ensures backward compatibility.

#### Migration Pipeline

```typescript
export const migrations: Record<number, Migration> = {
  1: (data) => ({ ...data, version: 1, worldId: data.worldId || 'forest' }),
  
  2: (data) => {
    // Migrate to dual-role format
    return {
      version: 2,
      roles: {
        boy: { inventory: data.inventory || [], ... },
        girl: { inventory: [], ... },  // Start fresh
      },
    };
  },
  
  3: (data) => {
    // Unlock all areas
    return { ...data, version: 3, roles: { ... } };
  },
};
```

#### Character Integration
Migration v2 introduced dual-role support. Older saves (v1) have single inventory, which v2 assigns to boy's inventory and starts girl with empty inventory.

---

## Event Flow Diagrams

### Scenario 1: Initial Load (UI Mounting)

```
┌─────────────────┐
│ InventoryDisplay│ Component mounts
│   useEffect()   │
└────────┬────────┘
         │
         │ 1. emit('ui/getInventory')
         ▼
┌─────────────────┐
│    EventBus     │
└────────┬────────┘
         │
         │ 2. Broadcast to all listeners
         ▼
┌─────────────────┐
│   TaskSystem    │ Listening: eventBus.on()
│  .inventory =   │
│ Set(['axe'])    │
└────────┬────────┘
         │
         │ 3. emit('game/inventoryUpdate', items: ['axe'])
         ▼
┌─────────────────┐
│    EventBus     │
└────────┬────────┘
         │
         │ 4. Broadcast to UI
         ▼
┌─────────────────┐
│ InventoryDisplay│ Listening: eventBus.on()
│ setItems(['axe'])
└─────────────────┘
         │
         │ 5. React re-render
         ▼
    [UI UPDATED: Shows "1" badge]
```

---

### Scenario 2: Task Completion (Item Granted)

```
┌─────────────────┐
│ InteractionSys  │ Player interacts with target
└────────┬────────┘
         │
         │ 1. taskSystem.completeCurrentStep()
         ▼
┌─────────────────┐
│   TaskSystem    │ Check step definition:
│                 │ grantsItems: ['slingshot', 'steel_balls']
└────────┬────────┘
         │
         │ 2. addItem('slingshot')
         │    addItem('steel_balls')
         │    inventory.add() for each
         ▼
┌─────────────────┐
│   TaskSystem    │
│ .inventory =    │
│ Set(['axe',     │
│  'slingshot',   │
│  'steel_balls'])│
└────────┬────────┘
         │
         │ 3. broadcastInventory()
         │    emit('game/inventoryUpdate', items: [...])
         ▼
┌─────────────────┐
│    EventBus     │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│ InventoryDisplay│  │   AutosaveSystem│
│ setItems([...]) │  │ Trigger save    │
└─────────────────┘  └────────┬────────┘
         │                     │
         │                     │ 4. saveFacade.syncInventory('boy', [...])
         │                     ▼
         │            ┌─────────────────┐
         │            │   SaveFacade    │
         │            │  Write to       │
         │            │  localStorage   │
         │            └─────────────────┘
         │
         │ 5. React re-render
         ▼
    [UI UPDATED: Shows "3" badge with new items]
```

---

### Scenario 3: Item Consumption (Crafting/Usage)

```
┌─────────────────┐
│   TaskSystem    │ Step requires:
│                 │ consumesItems: ['steel_balls']
└────────┬────────┘
         │
         │ 1. completeCurrentStep()
         │    Check step.consumesItems
         ▼
┌─────────────────┐
│   TaskSystem    │
│  inventory      │
│  .delete(       │
│   'steel_balls')│
└────────┬────────┘
         │
         │ 2. broadcastInventory()
         │    emit('game/inventoryUpdate', items: ['axe', 'slingshot'])
         ▼
┌─────────────────┐
│    EventBus     │
└────────┬────────┘
         │
         │ 3. Notify UI
         ▼
┌─────────────────┐
│ InventoryDisplay│
│ setItems([      │
│  'axe',         │
│  'slingshot'    │
│ ])              │
└─────────────────┘
         │
         │ 4. React re-render
         ▼
    [UI UPDATED: Shows "2" badge, steel_balls removed]
```

---

### Scenario 4: Character Switch (Future Phase 2)

```
┌─────────────────┐
│ ProgressionSys  │ User switches boy → girl
│  OR             │
│ RoleSelector UI │
└────────┬────────┘
         │
         │ 1. Save current character
         │    inventory = taskSystem.getInventory()
         ▼
┌─────────────────┐
│   SaveFacade    │
│ syncInventory(  │
│  'boy',         │
│  ['axe', ...]   │
│ )               │
└────────┬────────┘
         │
         │ 2. Write to localStorage
         │    roles.boy.inventory = [...]
         ▼
┌─────────────────┐
│  SaveSystem     │
│ localStorage    │
│ .setItem(...)   │
└─────────────────┘
         │
         │ 3. Load new character
         │    newInventory = saveFacade.getInventory('girl')
         ▼
┌─────────────────┐
│   SaveFacade    │
│ return          │
│  roles.girl     │
│  .inventory     │
└────────┬────────┘
         │
         │ 4. Inject into TaskSystem
         │    [NEEDS IMPLEMENTATION]
         │    taskSystem.setInventory(newInventory)
         ▼
┌─────────────────┐
│   TaskSystem    │
│  inventory =    │
│  new Set(       │
│   newInventory  │
│  )              │
└────────┬────────┘
         │
         │ 5. Broadcast to UI
         │    broadcastInventory()
         ▼
┌─────────────────┐
│    EventBus     │
└────────┬────────┘
         │
         │ 6. Update UI
         ▼
┌─────────────────┐
│ InventoryDisplay│
│ setItems(girl's │
│  inventory)     │
└─────────────────┘
```

---

## Critical Gaps for Phase 2

### 1. **TaskSystem Missing Character Awareness**

**Problem:**
```typescript
export class TaskSystem {
  private inventory = new Set<string>();  // ← Which character?
}
```

**Solution:**
```typescript
export class TaskSystem {
  private currentRole: 'boy' | 'girl' = 'boy';
  private inventory = new Set<string>();
  
  setCurrentRole(roleId: 'boy' | 'girl'): void {
    this.currentRole = roleId;
  }
  
  getCurrentRole(): 'boy' | 'girl' {
    return this.currentRole;
  }
  
  switchCharacter(roleId: 'boy' | 'girl', newInventory: string[]): void {
    this.currentRole = roleId;
    this.inventory = new Set(newInventory);
    this.broadcastInventory();  // Update UI immediately
  }
}
```

---

### 2. **No Inventory Setter in TaskSystem**

**Problem:**
- SaveFacade can retrieve saved inventory
- But no public method to inject it into TaskSystem

**Current Workaround:**
```typescript
// Direct access (breaks encapsulation)
taskSystem['inventory'] = new Set(savedInventory);
```

**Solution:**
Add public setter:
```typescript
setInventory(items: string[]): void {
  this.inventory = new Set(items);
  this.broadcastInventory();
}
```

---

### 3. **Character Switch Coordination**

**Problem:**
No centralized orchestrator for character switching.

**Proposed Flow:**
```typescript
// In ProgressionSystem or new CharacterManager
async switchCharacter(newRoleId: 'boy' | 'girl'): Promise<void> {
  // 1. Save current character state
  const currentRole = taskSystem.getCurrentRole();
  const currentInventory = taskSystem.getInventory();
  saveFacade.syncInventory(currentRole, currentInventory);
  
  // 2. Load new character state
  const newInventory = saveFacade.getInventory(newRoleId);
  
  // 3. Switch TaskSystem
  taskSystem.switchCharacter(newRoleId, newInventory);
  
  // 4. Update lastSelectedRole
  saveFacade.setLastSelectedRole(newRoleId);
  
  // 5. Emit event for other systems
  eventBus.emit({ type: 'game/characterSwitch', roleId: newRoleId });
}
```

---

### 4. **UI Character Indicator**

**Problem:**
InventoryDisplay doesn't show which character's inventory is displayed.

**Solution Options:**

**Option A:** Add icon to InventoryDisplay header
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  {currentRole === 'boy' ? '👦' : '👧'}
  <span>INVENTORY</span>
</div>
```

**Option B:** Event-driven role state
```typescript
const [currentRole, setCurrentRole] = useState<'boy' | 'girl'>('boy');

useEffect(() => {
  const unsub = eventBus.on((evt) => {
    if (evt.type === 'game/characterSwitch') {
      setCurrentRole(evt.roleId);
    }
  });
  return unsub;
}, []);
```

---

## Event Patterns Summary

### Pattern 1: Request-Response
```
UI: emit('ui/getInventory')
   → TaskSystem: on('ui/getInventory')
   → TaskSystem: emit('game/inventoryUpdate', items)
   → UI: on('game/inventoryUpdate') → setItems()
```

**Use Case:** Initial load, UI mount

---

### Pattern 2: Push Notification
```
TaskSystem: addItem()
   → TaskSystem: broadcastInventory()
   → TaskSystem: emit('game/inventoryUpdate', items)
   → UI: on('game/inventoryUpdate') → setItems()
```

**Use Case:** Item granted, item consumed

---

### Pattern 3: Side-Effect Broadcast
```
TaskSystem: completeCurrentStep()
   → TaskSystem: emit('ui/toast', message)
   → HUD: on('ui/toast') → pushToast()
```

**Use Case:** User feedback, notifications

---

### Pattern 4: State Synchronization (Autosave)
```
TaskSystem: addItem()
   → TaskSystem: emit('game/inventoryUpdate', items)
   → AutosaveSystem: on('game/inventoryUpdate')
   → AutosaveSystem: saveFacade.syncInventory(roleId, items)
   → SaveFacade: write to localStorage
```

**Use Case:** Periodic autosave, crash recovery

---

## Character Integration Matrix

| Component | Boy Support | Girl Support | Switch Support | Notes |
|-----------|------------|--------------|----------------|-------|
| **EventBus** | ✅ Implicit | ✅ Implicit | N/A | Character-agnostic transport |
| **InventoryDisplay** | ✅ Current | ✅ Current | ❌ Missing | Displays active inventory only |
| **HUD** | ✅ Current | ✅ Current | ✅ Passes through | Delegates to children |
| **TaskSystem** | ✅ Current | ✅ Current | ⚠️ Partial | Lacks role tracking |
| **SaveSystem** | ✅ Full | ✅ Full | ✅ Full | Dual-role baked in |
| **SaveFacade** | ✅ Full | ✅ Full | ✅ Full | Role-aware API |
| **migrations** | ✅ Full | ✅ Full | ✅ Full | v2 migration handles dual-role |

**Legend:**
- ✅ Full support
- ⚠️ Partial support
- ❌ Not implemented

---

## Recommendations for Phase 2

### High Priority

1. **Add `currentRole` to TaskSystem**
   - Track which character's inventory is active
   - Enable role-aware save operations

2. **Implement `switchCharacter()` in TaskSystem**
   - Replace inventory Set atomically
   - Broadcast to UI immediately
   - Prevent race conditions

3. **Add `setInventory()` public method**
   - Allow SaveFacade to restore inventory
   - Maintain encapsulation

4. **Create Character Switch Orchestrator**
   - Coordinate TaskSystem + SaveFacade + EventBus
   - Emit `game/characterSwitch` event
   - Update UI indicators

---

### Medium Priority

5. **Add Character Indicator to InventoryDisplay**
   - Show boy/girl icon in header
   - Subscribe to `game/characterSwitch` event

6. **Validate Inventory Sync on Switch**
   - Unit tests for boy → girl transition
   - Ensure no item loss/duplication

7. **Event Type Extension**
   - Add `game/characterSwitch` to events.ts
   - Type-safe role switching

---

### Low Priority

8. **Inventory Diff Events** (Future optimization)
   - Instead of sending full inventory, send deltas
   - `{ type: 'game/itemAdded', item: 'axe' }`
   - `{ type: 'game/itemRemoved', item: 'steel_balls' }`

9. **Inventory Limits** (Game design decision)
   - Max inventory size per character
   - Overflow handling

10. **Item Metadata** (Rich display)
    - Icons per item type
    - Descriptions
    - Rarity/quality tiers

---

## Code Examples for Phase 2

### Example 1: Enhanced TaskSystem

```typescript
export class TaskSystem {
  private currentRole: 'boy' | 'girl' = 'boy';
  private inventory = new Set<string>();
  
  constructor(private eventBus: EventBus) {
    this.eventBusSub = this.eventBus.on((evt) => {
      if (evt.type === 'ui/getInventory') {
        this.broadcastInventory();
      }
    });
  }
  
  // NEW: Get current role
  getCurrentRole(): 'boy' | 'girl' {
    return this.currentRole;
  }
  
  // NEW: Set inventory (for restore from save)
  setInventory(items: string[]): void {
    this.inventory = new Set(items);
    this.broadcastInventory();
  }
  
  // NEW: Switch character
  switchCharacter(roleId: 'boy' | 'girl', newInventory: string[]): void {
    this.currentRole = roleId;
    this.inventory = new Set(newInventory);
    this.broadcastInventory();
    console.log(`[TaskSystem] Switched to ${roleId} with ${newInventory.length} items`);
  }
  
  // EXISTING: Add item (now role-aware)
  addItem(itemId: string): void {
    this.inventory.add(itemId);
    this.broadcastInventory();
    console.log(`[TaskSystem] ${this.currentRole} gained item: ${itemId}`);
  }
}
```

---

### Example 2: Character Switch Function

```typescript
// In ProgressionSystem or new CharacterManager

async switchToCharacter(newRoleId: 'boy' | 'girl'): Promise<void> {
  // 1. Save current character progress
  const currentRole = this.taskSystem.getCurrentRole();
  const currentInventory = this.taskSystem.getInventory();
  
  console.log(`[CharacterManager] Saving ${currentRole} inventory:`, currentInventory);
  saveFacade.syncInventory(currentRole, currentInventory);
  
  // 2. Load new character progress
  const newInventory = saveFacade.getInventory(newRoleId);
  console.log(`[CharacterManager] Loading ${newRoleId} inventory:`, newInventory);
  
  // 3. Switch TaskSystem
  this.taskSystem.switchCharacter(newRoleId, newInventory);
  
  // 4. Update save metadata
  saveFacade.setLastSelectedRole(newRoleId);
  
  // 5. Broadcast switch event
  eventBus.emit({
    type: 'game/characterSwitch',
    roleId: newRoleId,
  });
  
  // 6. Show feedback
  eventBus.emit({
    type: 'ui/toast',
    level: 'info',
    message: `Now playing as ${newRoleId === 'boy' ? 'Boy' : 'Girl'}`,
  });
}
```

---

### Example 3: Enhanced Events

```typescript
// Add to events.ts

export type GameToUi =
  | { type: 'game/inventoryUpdate'; items: string[]; roleId: 'boy' | 'girl' }  // ← Add roleId
  | { type: 'game/characterSwitch'; roleId: 'boy' | 'girl' }  // ← New event
  // ... existing events
```

---

### Example 4: UI Character Indicator

```tsx
// Enhanced InventoryDisplay.tsx

export function InventoryDisplay() {
  const [items, setItems] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<'boy' | 'girl'>('boy');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    eventBus.emit({ type: 'ui/getInventory' });

    const unsub = eventBus.on((evt: AppEvent) => {
      if (evt.type === 'game/inventoryUpdate') {
        setItems(evt.items);
        if (evt.roleId) {
          setCurrentRole(evt.roleId);  // Update role if provided
        }
      } else if (evt.type === 'game/characterSwitch') {
        setCurrentRole(evt.roleId);
      }
    });

    return unsub;
  }, []);

  // ... rest of component
  
  // In header:
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '18px' }}>
      {currentRole === 'boy' ? '👦' : '👧'}
    </span>
    <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '16px' }}>
      INVENTORY
    </span>
  </div>
}
```

---

## Testing Scenarios for Phase 2

### Scenario 1: Boy Collects Items, Switch to Girl
1. Start as boy, collect axe + slingshot
2. Switch to girl
3. Verify:
   - Girl starts with empty inventory (or saved state)
   - Boy's inventory persisted to save
   - UI updates to show girl's inventory
   - No items lost

### Scenario 2: Girl Completes Task, Switch to Boy
1. Start as girl, complete task (gain knife + rope)
2. Switch to boy
3. Verify:
   - Boy loads his saved inventory
   - Girl's new items persisted
   - Next switch back to girl restores knife + rope

### Scenario 3: Rapid Switch Stress Test
1. Switch boy → girl → boy rapidly
2. Verify:
   - No race conditions
   - No item duplication
   - Correct inventory loads each time

### Scenario 4: Save/Load Across Sessions
1. Play as boy, collect items
2. Switch to girl, collect different items
3. Reload page
4. Verify:
   - lastSelectedRole restored
   - Both inventories preserved
   - Correct character active

---

## Conclusion

The inventory system is built on a robust event-driven architecture with strong dual-role persistence support. The main gaps for Phase 2 are:

1. **TaskSystem lacks role tracking** - easily fixed with `currentRole` field
2. **No public inventory setter** - add `setInventory()` method
3. **Missing character switch orchestration** - implement coordinator function
4. **UI doesn't show active character** - add role indicator to InventoryDisplay

All pieces are in place; Phase 2 will primarily **wire existing components together** rather than build new infrastructure.

---

## Next Steps

1. Review this report
2. Provide Phase 2 script with:
   - TaskSystem enhancements
   - Character switch function
   - Event type extensions
   - UI updates
3. Implement changes
4. Test switching scenarios
5. Deploy with autosave integration

---

**End of Report**
