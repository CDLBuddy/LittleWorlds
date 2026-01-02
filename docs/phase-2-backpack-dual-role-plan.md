# Phase 2: Backpack Book + Dual Role + Shared Collections
**Date:** January 2, 2026  
**Status:** In Progress

---

## Ground Rules

- ✅ Do not break existing saves (bump save version + migrate)
- ✅ Do not hardcode per-area UI lists (use registries)
- ✅ Do not mix Tools with Finds/Memories in data structures
- ✅ Event bus remains typed (no any payloads)
- ✅ Keep TaskSystem as "current tools owner" (make it role-aware + swappable)

---

## Deliverables Checklist

- [ ] Circular bag icon opens notebook inventory UI
- [ ] Tabs: Tools (working), Collectables (stub), Memories (stub)
- [ ] Switching boy/girl updates Tools tab instantly
- [ ] SaveData stores role inventories + shared collections
- [ ] Legacy InventoryDisplay removed from HUD

---

## Phase 2.1 — Event + Role Switching Foundation

### 2.1.1 Update events.ts
- [ ] Add `ui/switchCharacter` event
- [ ] Update `game/inventoryUpdate` to include `roleId`
- [ ] Add `game/characterSwitch` event

### 2.1.2 TaskSystem: role-aware
- [ ] Add `private currentRole: 'boy' | 'girl'`
- [ ] Add `getCurrentRole()` method
- [ ] Add `setInventory(items)` method
- [ ] Add `switchCharacter(roleId, items)` method
- [ ] Update `broadcastInventory()` to include roleId

### 2.1.3 Create CharacterSwitchSystem
- [ ] New file: `CharacterSwitchSystem.ts`
- [ ] Orchestrates save/load/switch
- [ ] Handles `ui/switchCharacter` events
- [ ] Safe rapid-switch lock

### 2.1.4 GameApp integration
- [ ] Wire CharacterSwitchSystem
- [ ] Restore lastSelectedRole on start
- [ ] Load correct inventory for starting role

### 2.1.5 SaveFacade helpers
- [ ] Add `getLastSelectedRole()`
- [ ] Add `setLastSelectedRole(roleId)`
- [ ] Add shared state accessors (future-proof)

### 2.1.6 Migrations
- [ ] Bump save version to v4
- [ ] Ensure `lastSelectedRole` exists
- [ ] Add `shared` container with collections structure

---

## Phase 2.2 — Backpack Book UI

### 2.2.1 Create UI folder structure
```
src/ui/inventory/
  InventoryHUD.tsx
  InventoryPanel.tsx
  tabs/
    ToolsTab.tsx
    CollectablesTab.tsx
    MemoriesTab.tsx
  components/
    BagButton.tsx
    TabsBar.tsx
    ItemGrid.tsx
    ItemCard.tsx
  inventory.module.css
```

### 2.2.2 InventoryHUD
- [ ] Circular bag button
- [ ] Click to toggle panel
- [ ] Keyboard: 'I' to toggle, 'Escape' to close
- [ ] Subscribe to character switch events
- [ ] Badge shows item count

### 2.2.3 InventoryPanel
- [ ] Notebook frame design
- [ ] Tab system: Tools / Collectables / Memories
- [ ] Role indicator (boy/girl)
- [ ] Close button

### 2.2.4 ToolsTab
- [ ] Display items from registry
- [ ] Icon + name + description cards
- [ ] Shows current role's inventory

### 2.2.5 CollectablesTab + MemoriesTab
- [ ] Stub UI with "Coming soon"
- [ ] Show "Shared between twins" subtitle
- [ ] Consistent layout for future content

### 2.2.6 HUD integration
- [ ] Remove old InventoryDisplay
- [ ] Mount new InventoryHUD
- [ ] Remove InventoryBubbles

---

## Phase 2.3 — Twin Switch UI

### 2.3.1 Switch button in InventoryPanel
- [ ] Add switch button in header
- [ ] Emits `ui/switchCharacter` event
- [ ] Visual feedback (boy/girl icons)

---

## Phase 2.4 — Collections Content Rails

### 2.4.1 Create collections registry folders
```
src/game/content/collections/
  types.ts
  template.ts
  areas/
    backyard.ts
    woodline.ts
    creekside.ts
    pine_trails.ts
    firefly_dusk.ts
    night_stars.ts
    beachfront.ts
  index.ts
  validate.ts
```

### 2.4.2 AreaTemplate + validate()
- [ ] Define AreaTemplate type (10 finds, trophy, postcard)
- [ ] Implement all area templates
- [ ] Validation: 10 finds, 2 per hiding type, unique IDs
- [ ] Call validateCollections() in DEV mode

---

## Phase 2.5 — Cleanup

### 2.5.1 Remove legacy files
- [ ] Delete `InventoryBubbles.tsx`
- [ ] Delete `inventory.ts` (OOP class)
- [ ] Clean up unused UI state

### 2.5.2 Implement giveitem cheat
- [ ] Add `giveitem <itemId>` command
- [ ] Calls `taskSystem.addItem()`
- [ ] Triggers autosave

---

## Testing Checklist

- [ ] Start as boy, collect slingshot → shows in inventory
- [ ] Save contains boy inventory
- [ ] Switch to girl → inventory updates instantly
- [ ] Save lastSelectedRole updated
- [ ] Reload → starts as girl
- [ ] Rapid switch boy→girl→boy → no duplication/loss
- [ ] `ui/getInventory` returns `{ roleId, items }`

---

## Implementation Order

1. Events + TaskSystem changes
2. CharacterSwitchSystem orchestrator
3. SaveFacade + migrations
4. New Inventory UI components
5. HUD integration
6. Collections structure (stub)
7. Testing + cleanup

---

**End of Plan**
