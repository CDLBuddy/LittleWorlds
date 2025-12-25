# Phase v0.2 — Companion Guidance + Icon Prompts + First Task Chain

**Date**: December 25, 2025  
**Branch**: `feat/companion-guidance-v0-2`  
**Base**: `feat/playable-slice-v0-1`  
**Status**: Partial Implementation (Phase 1-2 Complete)

---

## Goal / Scope

Transform the playable slice into a **kid-guided experience** with:
- 🐾 Companion pet (dog/cat) that follows and leads player
- 🎯 Icon-only HUD prompts (no text - toddler-friendly)
- 📋 First task chain: Find Axe → Chop Log → Build Fire
- 🎮 Auto-interact on proximity dwell (500ms)
- ✅ Keep `npm run verify` green throughout

---

## Implementation Status

### ✅ Phase 0 — Setup (COMPLETE)
- Created branch: `feat/companion-guidance-v0-2`
- Baseline green: `npm run verify` passes
- docs/ folder created

### ✅ Phase 1 — Event Bus Expansion (COMPLETE)

**Files Modified**:
- `src/game/shared/events.ts`

**Changes**:
```typescript
// New types added
export type PromptIcon = 'hand' | 'axe' | 'log' | 'fire' | 'tent' | 'fish' | 'paw';
export type CompanionState = 'FollowPlayer' | 'LeadToTarget' | 'InvestigateTarget' | 'Celebrate';

// New UiToGame events
| { type: 'ui/callCompanion' }
| { type: 'ui/toggleHelp' }

// New GameToUi events
| { type: 'game/prompt'; id: string; icon: PromptIcon; worldPos?: { x: number; y: number; z: number } }
| { type: 'game/promptClear'; id: string }
| { type: 'game/companion/state'; state: CompanionState; targetId?: string }
```

**Verification**: ✅ `npm run typecheck` passes

### ✅ Phase 2 — HUD Icon-Only Prompts (COMPLETE)

**Files Modified**:
- `src/ui/state/useUiStore.ts` — Added prompt store
- `src/ui/hud/HUD.tsx` — Event bus subscription
- `src/ui/hud/widgets/HintPulse.tsx` — Icon rendering with pulse animation
- `src/ui/hud/widgets/CompanionCallButton.tsx` — Event emission
- `src/game/GameHost.tsx` — HUD integration

**Key Features**:
1. **Prompt Store** (`useUiStore`):
   - Stores active prompts as `Map<string, ActivePrompt>`
   - Keeps only last 3 prompts to avoid clutter
   - Tracks companion state for debug/HUD

2. **Event Subscription** (HUD.tsx):
   ```typescript
   useEffect(() => {
     const unsub = eventBus.on((event) => {
       if (event.type === 'game/prompt') {
         addPrompt({ id: event.id, icon: event.icon, worldPos: event.worldPos });
       } else if (event.type === 'game/promptClear') {
         removePrompt(event.id);
       } else if (event.type === 'game/companion/state') {
         setCompanionState(event.state);
       }
     });
     return unsub;
   }, []);
   ```

3. **Icon Rendering** (HintPulse.tsx):
   - Large emoji icons (4rem) with pulse animation
   - Icon mapping: ✋ hand, 🪓 axe, 🪵 log, 🔥 fire, ⛺ tent, 🐟 fish, 🐾 paw
   - CSS keyframe animation (scale 1.0 → 1.2 → 1.0)
   - No text labels (toddler-friendly)

4. **Call Button** (CompanionCallButton.tsx):
   - Fixed position (bottom-right)
   - Emits `{ type: 'ui/callCompanion' }` on click
   - Large touch target (2rem font, 15px padding)

**Verification**: ✅ `npm run verify` passes (0 errors, 65 warnings)

---

## Files Changed (By Folder)

### `/src/game/shared/`
- `events.ts` — Added PromptIcon, CompanionState types, new events

### `/src/ui/state/`
- `useUiStore.ts` — Added activePrompts Map, companionState, add/remove prompt actions

### `/src/ui/hud/`
- `HUD.tsx` — Event bus subscription, prompt rendering layout
- `widgets/HintPulse.tsx` — Icon-only display with pulse animation
- `widgets/CompanionCallButton.tsx` — Event emission on click

### `/src/game/`
- `GameHost.tsx` — Integrated HUD component

---

## Remaining Work (Phase 3-7)

### ⏭️ Phase 3 — Companion MVP (TODO)
**Files to Modify**:
- `src/game/entities/companion/Companion.ts`
- `src/game/entities/companion/fsm.ts`
- `src/game/entities/companion/steering.ts`
- `src/game/worlds/BootWorld.ts`
- `src/game/GameApp.ts`

**Tasks**:
1. Implement FSM states (Follow/Lead/Investigate/Celebrate)
2. Add simple steering behavior (seek with arrival radius)
3. Spawn companion mesh in BootWorld (sphere placeholder with cute color)
4. Wire ui/callCompanion event to trigger LeadToTarget state
5. Tick companion in GameApp update loop
6. Emit companion/state events for HUD

### ⏭️ Phase 4 — Task Chain v0 (TODO)
**Files to Modify**:
- `src/game/content/tasks.ts` — Define task steps
- `src/game/systems/tasks/TaskSystem.ts` — Track active task, provide current target
- `src/game/systems/tasks/taskGraph.ts` — Task dependencies
- `src/game/entities/props/Axe.ts` — Make interactable
- `src/game/entities/props/LogPile.ts` — Make interactable
- `src/game/entities/props/Campfire.ts` — Make interactable
- `src/game/systems/interactions/InteractionSystem.ts` — Auto-interact on proximity dwell
- `src/game/worlds/BootWorld.ts` — Spawn Axe, LogPile, Campfire

**Task Definition**:
```typescript
{
  taskId: 'campfire_v1',
  steps: [
    { id: 'find_axe', icon: 'axe', targetId: 'axe_001' },
    { id: 'chop_log', icon: 'log', targetId: 'log_pile_001' },
    { id: 'build_fire', icon: 'fire', targetId: 'campfire_001' },
  ]
}
```

**Auto-Interact Logic**:
- When player within `interactRadius` for `>500ms` → call `onInteract()`
- Emit `game/prompt` with 'hand' icon when in range
- Emit `game/promptClear` when leaving range
- On complete: emit `game/task` with status 'done'

### ⏭️ Phase 5 — Wake Radius Integration (TODO)
**Files to Modify**:
- `src/game/systems/interactions/wakeRadius.ts`

**Changes**:
- Always keep current task target wakeable (override distance checks)
- When companion leads, temporarily wake target at larger radius (cinematic reveal)
- Maintain hysteresis to avoid flicker

### ⏭️ Phase 6 — Documentation (IN PROGRESS)
**This file!** Complete after implementation.

### ⏭️ Phase 7 — Sanity Test (TODO)
Manual test checklist in dev server.

---

## How to Test (Current State)

### Test Phase 1-2 (Icon Prompts + HUD)

```bash
npm run dev
# Navigate to http://localhost:3000/
# Click "Play" button
```

**Expected Behavior**:
1. Game loads with BootWorld scene
2. HUD renders with "🐾 Call" button (bottom-right)
3. Currently no prompts show (need to wire game events in Phase 4)
4. Clicking "Call" button emits event (no visible effect yet)

**To Manually Test Prompts** (dev console):
```javascript
// In browser console
eventBus.emit({ type: 'game/prompt', id: 'test', icon: 'axe' });
// Should see 🪓 icon pulsing at top-center

eventBus.emit({ type: 'game/promptClear', id: 'test' });
// Icon should disappear
```

---

## Known Issues / TODOs

### Current Limitations:
1. **No companion spawned yet** — Need Phase 3 implementation
2. **No task system** — Need Phase 4 implementation
3. **Prompts not wired to gameplay** — Will connect in Phase 4
4. **No auto-interact** — Need proximity dwell timer in Phase 4
5. **Wake radius not guidance-aware** — Need Phase 5 integration

### Technical Debt:
- [ ] HUD layout needs responsive design for mobile
- [ ] Prompt icons could use better sprite sheet instead of emoji
- [ ] Companion mesh needs actual model (currently just placeholder)
- [ ] Task system needs persistence (save/load)
- [ ] Audio cues for prompts/interactions
- [ ] Haptic feedback for iPad

---

## Verification Output

### Latest Build (Phase 2 Complete):
```bash
npm run verify
```

**Results**:
- ✅ **ESLint**: 0 errors, 65 warnings (acceptable for stub code)
- ✅ **TypeScript**: Type check passes
- ✅ **Build**: Success in ~7.8s
- ✅ **Manifest**: Generated successfully

**Bundle Size**:
- `index.html`: 0.67 kB
- `index-*.js`: 9.13 kB (3.65 kB gzipped)
- `react-vendor-*.js`: 159.29 kB (52.29 kB gzipped)
- `babylon-*.js`: 5,071.90 kB (1,121.67 kB gzipped)

---

## Next Steps

### Immediate (Phase 3):
1. Implement Companion FSM with Follow/Lead/Investigate/Celebrate states
2. Add steering behavior (seek target with arrival radius)
3. Spawn companion in BootWorld
4. Wire ui/callCompanion → companion.transitionTo('LeadToTarget')
5. Test companion follows player and leads to target

### Then (Phase 4):
1. Define task chain in content/tasks.ts
2. Implement TaskSystem to track progress
3. Create interactable props (Axe, LogPile, Campfire)
4. Add auto-interact on proximity dwell
5. Wire task completion → next step → new prompt

### Finally (Phase 5-7):
1. Integrate wake radius with task targets
2. Complete this documentation
3. Full manual test pass

---

## Architecture Notes

### Event Flow (Prompts):
```
GameApp → eventBus.emit({ type: 'game/prompt', id, icon })
  ↓
HUD.tsx → useEffect subscription
  ↓
useUiStore.addPrompt()
  ↓
HUD renders HintPulse for each active prompt
  ↓
HintPulse shows pulsing icon (no text)
```

### Event Flow (Companion Call):
```
User clicks "🐾 Call" button
  ↓
CompanionCallButton → eventBus.emit({ type: 'ui/callCompanion' })
  ↓
GameApp receives event (Phase 3)
  ↓
Companion.transitionTo('LeadToTarget')
  ↓
Companion steers toward TaskSystem.getCurrentTargetId()
  ↓
On arrival → transitionTo('InvestigateTarget')
  ↓
Emit game/prompt with 'paw' icon
```

### State Machine (Companion):
```
FollowPlayer (default)
  ├─→ LeadToTarget (on ui/callCompanion or player stuck)
  │     └─→ InvestigateTarget (on arrival at target)
  │           └─→ FollowPlayer (after 2s)
  └─→ Celebrate (on task complete)
        └─→ FollowPlayer (after animation)
```

---

## Credits

**Implementation**: AI Assistant + User Collaboration  
**Date**: December 25, 2025  
**Framework**: Babylon.js 7.54.3, React 18.3.1, Vite 7.3.0, TypeScript 5.7.0  
**Target**: iPad-friendly, toddler-readable gameplay

---

## Appendix: Code Snippets

### Icon Mapping (HintPulse.tsx)
```typescript
const iconEmoji: Record<PromptIcon, string> = {
  hand: '✋',
  axe: '🪓',
  log: '🪵',
  fire: '🔥',
  tent: '⛺',
  fish: '🐟',
  paw: '🐾',
};
```

### Pulse Animation (CSS)
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
```

### Event Bus Subscription Pattern
```typescript
useEffect(() => {
  const unsub = eventBus.on((event) => {
    // Handle events
  });
  return unsub; // Cleanup on unmount
}, []);
```

---

**End of Phase v0.2 Documentation** (Partial - Phases 3-7 to be completed)
