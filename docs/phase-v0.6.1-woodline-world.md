# Phase v0.6.1 — Woodline World (Greybox) + Campfire Checkpoint + Remove BootWorld Fallback

**Status**: ✅ COMPLETE  
**Date**: 2025-12-27

---

## Goal

Build the second playable Area World: **WOODLINE**.

Wire Woodline tasks (boy/girl) to real interactables and implement the campfire checkpoint with role-specific fire-lighting methods. Remove BootWorld fallback so Backyard → Woodline transition uses real worlds only.

Key Achievement: **Two-area demo is now fully functional** with complete progression flow from Backyard through Woodline.

---

## Files Added

### 1. `src/game/worlds/woodline/WoodlineWorld.ts`
**Purpose**: Second playable area - deeper forest with twilight ambiance  
**Responsibilities**:
- Dusk/twilight lighting (dimmer hemi + directional)
- Cozy fog atmosphere
- Forest floor with clearing around campfire
- Primitive tree scenery (6 cylinder+cone trees)
- Player spawn at (0, 0.9, 15) - front of clearing
- Companion spawn at (3, 0.4, 17) - front-left of player

**Interactables** (greybox primitives):
- `flint_pickup` (boy task) - Gray stone box at (-8, 0, 5)
- `campfire` (both roles) - Stone ring + flame at (0, 0, -5) - **center of clearing**
- `fieldguide_pickup` (girl task) - Brown book box at (8, 0, 5)
- `bowdrill_station` (girl task) - Wood box at (5, 0, -8)

**Campfire "Lit" State** (key feature):
- Stone ring (torus) visible always
- Flame mesh (cone) starts hidden
- Point light starts at intensity 0
- `setFireLit(true)` shows flame + increases light intensity to 1.5
- Gentle flame flicker animation (sine/cosine scale variation)

**Fire Lighting Logic**:
- **Boy path**: Interacts directly with `campfire` → lights fire
- **Girl path**: Interacts with `bowdrill_station` → lights campfire indirectly
- **Both paths visually identical result**: Flame appears, light illuminates clearing

**Features**:
- Clearing disc (8-unit radius) provides visual focus
- Trees positioned for depth without blocking visibility
- Pickup interactables hide after use
- Campfire + bowdrill remain enabled (task system controls interaction)

---

## Files Modified

### 2. `src/game/GameApp.ts`
**Changes**:

#### Imports
- Added `createWoodlineWorld` from `@game/worlds/woodline/WoodlineWorld`

#### World Loading (start method)
- **Extended area-based world factory**:
  ```typescript
  if (this.startParams.areaId === 'backyard') {
    world = createBackyardWorld(scene, bus, roleId);
  } else if (this.startParams.areaId === 'woodline') {
    world = createWoodlineWorld(scene, bus, roleId);
  } else {
    // BootWorld only for debug/dev
    world = createBootWorld(scene, bus, roleId);
  }
  ```
- Woodline now loads WoodlineWorld (no more fallback)
- BootWorld only used for unknown/debug areas

#### ProgressionSystem devBootFallback
- **Changed**:
  ```typescript
  const useDevBootFallback = import.meta.env.DEV && !['backyard', 'woodline'].includes(this.startParams.areaId);
  ```
- Disables campfire_v1 fallback for **both** Backyard and Woodline
- Real tasks now run for both playable areas
- Fallback only applies to future/unknown areas in DEV mode

#### Type Flexibility
- Changed `campfire` type from specific `Campfire` class to `any`
- Allows different campfire implementations per world
- WoodlineWorld returns `CampfireInteractable`, BootWorld returns `Campfire` class

---

## How It Works

### Woodline World Atmosphere
1. **Twilight Sky**: Darker blue-gray clearColor (0.4, 0.5, 0.7)
2. **Soft Fog**: Slightly denser than Backyard (0.025 vs 0.015)
3. **Dimmer Lighting**: 
   - Hemi intensity 0.4 (vs Backyard 0.7)
   - Directional intensity 0.5 (vs Backyard 0.9)
4. **Cozy Atmosphere**: Not horror-dark, just evening/dusk feeling
5. **Primitive Trees**: 6 positions around clearing for forest depth

### Campfire Checkpoint Mechanics

**Boy's Fire Method (Direct)**:
```
flint_pickup → gains flint
campfire (requires flint + steel_balls) → lights fire
```

**Girl's Fire Method (Bowdrill)**:
```
fieldguide_pickup → gains field_guide
bowdrill_station (requires multitool + string) → lights campfire
```

**Shared Result**:
- Flame mesh appears (emissive orange cone)
- Point light illuminates clearing (intensity 1.5, range 10)
- Gentle flicker animation
- Visual confirmation: "I did it!"

### Progression Flow (End-to-End)

1. **Backyard Start**
   - Boy/Girl spawn, complete respective tasks
   - Woodline unlocked in save data

2. **Gate Transition**
   - Interact with backyard_gate
   - GameApp checks unlock status
   - sessionFacade.setArea('woodline')
   - GameHost remounts with WoodlineWorld

3. **Woodline Tasks**
   - Boy: flint → campfire
   - Girl: fieldguide → bowdrill
   - Fire lights (shared checkpoint)

4. **Area Completion**
   - ProgressionSystem marks woodline complete
   - Inventory saved
   - No next area unlocked (woodline is end for now)

---

## Testing Steps

### A) Boy Role - Full Journey

1. **Backyard**:
   - Title → Profiles → Boy → New Game
   - BackyardWorld loads (morning, white fence)
   - Walk to slingshot_pickup (brown box, left side)
   - Interact → gains slingshot + steel_balls
   - Walk to backyard_target (red cylinder, left side)
   - Interact → completes first_shots
   - Confetti + success sound
   - Woodline unlocked

2. **Gate Transition**:
   - Walk to wooden gate (back-middle)
   - Interact → loads WoodlineWorld
   - Screen transitions (dusk lighting, trees visible)

3. **Woodline**:
   - WoodlineWorld loads (twilight, darker ambiance)
   - Walk to flint_pickup (gray box, left of clearing)
   - Interact → gains flint + box disappears
   - Walk to campfire (stone ring, center)
   - Interact → **fire lights up** (flame visible, orange glow)
   - Confetti + success sound
   - Woodline complete

### B) Girl Role - Full Journey

1. **Backyard**:
   - Title → Profiles → Girl → New Game
   - BackyardWorld loads (pink player capsule)
   - Walk to multitool_pickup (gray box, right side)
   - Interact → gains multitool + string
   - Walk to carve_station (wood workbench, right side)
   - Interact → completes carve_token
   - Woodline unlocked

2. **Gate Transition**:
   - Walk to gate → loads WoodlineWorld

3. **Woodline**:
   - Walk to fieldguide_pickup (brown box, right of clearing)
   - Interact → gains field_guide
   - Walk to bowdrill_station (wood box, right-back)
   - Interact → **campfire lights up** (girl didn't touch campfire directly!)
   - Flame appears at campfire position
   - Woodline complete

### C) Continue System Verification

1. **Boy's Save**:
   - Complete Boy's Woodline
   - Return to Profiles → Boy → Continue
   - Should see: Backyard ✓, Woodline ✓
   - Can replay either area

2. **Girl's Save**:
   - Complete Girl's Woodline separately
   - Return to Profiles → Girl → Continue
   - Should see: Backyard ✓, Woodline ✓
   - Independent from Boy's progress

3. **Cross-Role Gating**:
   - If only Boy completed Woodline, Girl's continue should NOT show Woodline unless she completed Backyard
   - Each role has independent progression

---

## Known Limitations

1. **Greybox Aesthetics**: All interactables still primitive shapes
   - Campfire has stone ring + flame cone (acceptable checkpoint visual)
   - Other props need 3D models in polish phase

2. **No Woodline Ambient Audio**: Still using forest ambient from AudioSystem
   - Add Woodline-specific track (crickets, night sounds) in Phase v0.6.2

3. **No Area Title Display**: User doesn't see "Backyard" or "Woodline" on screen
   - Add area title UI in Phase v0.6.2

4. **No Chapter Complete Celebration**: Woodline completion lacks special fanfare
   - Add celebration modal/sequence in Phase v0.6.2

5. **BootWorld Still Exists**: Kept for debug/dev purposes
   - Not accessible via normal play
   - Could add dev menu to access it

---

## Key Decisions

### 1. **Dual Fire-Lighting Paths**
- Boy uses flint (direct, traditional)
- Girl uses bowdrill (indirect, skill-based)
- Both achieve same visual result (campfire lit)
- Teaches multiple problem-solving approaches

### 2. **Twilight Not Night**
- Darker than Backyard but still navigable
- Cozy forest evening feel, not scary darkness
- Appropriate for toddler age group
- Point light from fire provides focal illumination

### 3. **Campfire as Shared Checkpoint**
- Both roles interact with same campfire object
- Girl's bowdrill lights it remotely (elegant indirect solution)
- Provides clear visual success marker
- Natural gathering point / area focal point

### 4. **BootWorld Relegated to Debug**
- No longer in normal play flow
- Kept for testing new features in isolation
- Could be removed entirely or kept as "sandbox mode"

### 5. **Primitive Trees for Depth**
- Simple cylinder + cone shapes
- 6 trees positioned for framing without obstruction
- Enough to suggest "deeper forest" vs Backyard
- Easy to replace with real models later

---

## What's Next

### Phase v0.6.2 — Presentation + Comfort

**Goal**: Polish the two-area demo with UI feedback and celebration

**Tasks**:
1. **Toast Display in HUD**
   - Implement visual ui/toast component
   - Shows gate blocking message: "Keep exploring to go deeper."
   - Shows chapter complete message: "Well done!"

2. **Area Title Display**
   - Show "Backyard" on entry (fade in/out)
   - Show "Woodline" on transition
   - Optional: Area icon/badge

3. **Chapter Complete Celebration**
   - Woodline completion triggers special sequence
   - Confetti burst (already have FxSystem)
   - Success modal: "You made a campfire!"
   - Optional: Character does victory animation

4. **Audio Polish**
   - Woodline ambient track (crickets, gentle night sounds)
   - Gate transition sound effect
   - Campfire ignition sound effect

5. **QoL Improvements**
   - Inventory icons in HUD (currently hidden)
   - Task progress indicator
   - Mini-map or compass (stretch goal)

### Phase v0.7.0 — Content Expansion (Future)

- Build additional areas (Beach, Mountain)
- Add more dual-role task chains
- Introduce companion skill progression
- Create real 3D models for all interactables

---

## Acceptance Criteria

✅ `npm run verify` passes (0 errors, 182 pre-existing warnings)  
✅ WoodlineWorld loads when `areaId='woodline'`  
✅ Woodline tasks complete for both roles using real interactables  
✅ Campfire visually lights from either campfire or bowdrill_station interaction  
✅ No BootWorld fallback for Backyard/Woodline  
✅ Boy completes full journey: Backyard → Woodline → fire lit  
✅ Girl completes full journey: Backyard → Woodline → fire lit (via bowdrill)  
✅ Save system tracks completion independently per role  
✅ Summary doc created  

---

## Summary

Phase v0.6.1 completes the two-area demo foundation. Players can now experience the full intended progression loop:

1. **Choose character** (Boy/Girl with visual differentiation)
2. **Explore Backyard** (learn controls, complete first tasks)
3. **Discover gate** (unlock via completion, soft blocking if rushed)
4. **Transition to Woodline** (seamless world change, atmosphere shift)
5. **Complete fire challenge** (role-specific methods, shared goal)
6. **Celebrate success** (visual confirmation, progress saved)

All core systems now work end-to-end with real worlds and interactables. BootWorld is successfully removed from the play flow, relegated to debug/dev use only. The game feels cohesive and intentional rather than prototype-y.

Next phase will focus on **presentation polish** - making the two-area experience feel complete with proper UI feedback, celebrations, and audio. After that, the system is ready for **content expansion** with additional areas and task chains.

The dual-role progression system successfully demonstrates that the same world can accommodate different approaches to problem-solving, supporting the game's educational goal of showing multiple valid solution paths to toddlers.
