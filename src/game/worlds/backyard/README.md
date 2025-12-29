# 🏡 Backyard World

## Overview

The **Backyard** is the warm, inviting beginning of your journey—a safe haven bathed in golden morning light where curiosity awakens and adventure begins. This is where both twins first pick up their core tools and learn the fundamentals of exploration, gentle problem-solving, and the rhythm of their unique skills.

---

## 🌅 Atmosphere & Time of Day

**Time:** Early morning / Sunrise  
**Mood:** Warm, safe, inviting, therapeutic awakening  
**Color Palette:** Golden yellows, warm whites, soft greens  
**Lighting:** Low-angle sun creating dramatic golden hour, minimal fog for clear visibility

### Audio Landscape
- **Primary:** Gentle morning bird chirps, distant suburban ambience
- **Layers:** Soft breeze through grass, occasional distant car, morning stillness
- **Mood:** Peaceful, hopeful, the promise of a new day

---

## 🎯 Core Design Philosophy

The Backyard serves as the **tutorial that doesn't feel like a tutorial**. It introduces:
- Tool acquisition (slingshot, multitool)
- Role-specific interactions
- The "pickup → use" gameplay loop
- Soft exploration without pressure
- The first glimpse of the wider world (vista to Woodline through the backgate)

**Key Principle:** *Everything here is familiar, nothing is threatening.*

---

## 🗺️ Layout & Points of Interest

### Play Area
- **Size:** 80×80 units
- **Boundaries:** White picket fence on all sides (childhood nostalgia)
- **Central Space:** Open grass for free exploration
- **Focal Points:** Positioned to guide natural discovery flow

### Key Locations

#### **1. The Back Gate** *(0, 0, -30)*
- **Function:** Transition to Woodline
- **Visual:** Wooden gate with warm glow when unlocked
- **Vista Feature:** Through the fence slats, player can glimpse shadowy trees, morning mist, and the faint trail leading into Woodline
- **Audio Bleed:** Faint forest rustling grows as player approaches

#### **2. Slingshot (Boy Tool)** *(-10, 0.5, 10)*
- **Current:** 3D model of classic Y-shaped slingshot on grass
- **Context:** Left near a tree, casually placed
- **Feel:** "Found treasure" not "quest marker"

#### **3. Multitool (Girl Tool)** *(10, 0, 10)*
- **Current:** Gray placeholder box (needs model)
- **Planned:** Small folding knife or Swiss Army-style tool
- **Context:** Resting on a tree stump or garden edge

#### **4. Target Practice Area** *(-15, 0, -5)*
- **Current:** Red cylinder target
- **Context:** Boy's first skill challenge
- **Feedback:** Satisfying "thunk" sound, visual hit markers

#### **5. Carving Station** *(15, 0, -5)*
- **Current:** Wood-colored workbench placeholder
- **Planned:** Weathered stump with carved initials, tool marks
- **Context:** Girl's first crafting moment
- **Output:** Carved token (first keepsake/memory item)

#### **6. Tire Swing** *(22, 0, -8)*
- **Current:** Static rope + tire on tree
- **Future Potential:** Interactive swing physics, "linger moment" spot
- **Memory:** Could trigger audio vignette about carefree afternoons

#### **7. Sandbox** *(-7.5, 0.15, 5.5)*
- **Current:** 3×3 wooden border with sand texture
- **Future Potential:** Hidden collectibles beneath sand surface
- **Toy Soldier Hook:** Could be first discovery location

#### **8. Garden Plot** *(-15, 0.1, -18)*
- **Current:** 4×2 dirt rectangle
- **Future Potential:** Identify plants (Girl skill), find worms for fishing later
- **Connection:** Teaches observation before deeper wilderness

---

## 🎮 Gameplay Features

### Currently Implemented

#### **Boy Role Tasks**
1. **Find Slingshot** - Natural discovery, no hand-holding
2. **First Shots** - Hit the target, feel the impact
3. **Gate Unlocks** - Completion opens path to Woodline

#### **Girl Role Tasks**
1. **Find Multitool** - Parallel discovery flow
2. **Carve Token** - Create first memory/keepsake item
3. **Gate Unlocks** - Same progression milestone

#### **Companion (Dog)**
- Spawns near player at (3, 0, 22)
- Follows naturally without being invasive
- No complex AI yet, establishes presence

### Planned Features

#### **🪖 Toy Soldier Collectibles (Optional Quest)**
- **Count:** 10 toy soldiers hidden throughout Backyard
- **Locations:** Under sandbox edges, behind fence posts, in grass near trees, tucked by garden
- **Discovery:** Gentle audio cue (tiny "ping") when nearby
- **Reward System:**
  - Find 3 → Companion learns "Fetch" (retrieves distant items)
  - Find 7 → Unlock memory vignette: "Toy Battle Memories"
  - Find 10 → Toy drum appears at campfire, cosmetic soldier marches in circle
- **UI:** Row of 10 silhouettes in Memory Book that fill in as found
- **Tone:** Nostalgic, playful, zero pressure

#### **🎒 Bag Inventory Introduction**
- Simple icon in corner (kid backpack aesthetic)
- Shows: Tools, Finds, Memories tabs
- No overwhelming lists—just what matters
- Items appear with subtle "clink" or "rustle" sound

#### **🔍 "Linger Mode" Introduction**
- Tire swing: Sit and watch sunrise for 30 seconds → unlock "Morning Peace" audio layer
- Garden plot: Crouch and observe → first field guide entry
- Teaches that stillness has rewards

---

## 🌲 Vista System: First Glimpse of Woodline

### The Goal
Standing at the backgate, the player should **feel** that Woodline exists beyond the fence—not as a loading screen destination, but as a *real place waiting*.

### Technical Implementation
- **Distant Proxy Geometry:**
  - 5-7 silhouetted tree trunks (low-poly, no collision)
  - Fog layer starting at fence line
  - Single "mystery trail" mesh curving into mist
  - No NPCs, no details—just shapes and atmosphere

### Visual Details
- **Morning Light:** Backlighting from Woodline side creates dramatic tree silhouettes
- **Parallax Shift:** As player moves left/right near gate, distant trees shift slightly
- **Upgrade Over Time:** Early game shows vague trees; after Woodline unlocked, vista updates to show clearer trail, lantern glow hint

### Audio Bleed
- **At House (front):** Pure morning birds, suburban quiet
- **Mid-yard:** Birds + faint forest rustling
- **Near Gate (back):** Forest ambience grows stronger, bird calls change to woodland species
- **Seamless Blend:** No jarring audio cuts, just gradual layering

---

## 🎵 Audio Design

### Ambient Layers
1. **Base:** Gentle morning suburban quiet
2. **Nature:** Soft breeze through grass
3. **Wildlife:** Songbirds (cardinal, robin), distant crow
4. **Human Touch:** Occasional distant lawnmower, neighbor's wind chime
5. **Mystery:** Faint forest whisper near backgate

### Interactive Sounds
- **Slingshot:** Rubber band stretch, stone release, target *thunk*
- **Multitool:** Metal snap open, blade *shink*
- **Carving:** Knife on wood (clean cuts vs rough cuts as skill progresses)
- **Gate:** Wood creak, hinge squeak, latch *clack*
- **Collectibles:** Soft "ping" discovery, backpack "rustle" on pickup

### Memory Audio Vignettes (Planned)
- "Backyard Summer Days" - distant laughter, sprinkler sounds
- "Toy Battle Memories" - imaginative sound effects, playful narration
- "Morning Peace" - deep breath, bird solo, wind through leaves

---

## 🏆 Progression & Unlocks

### Completion Criteria
- **Boy:** Slingshot acquired + Target hit
- **Girl:** Multitool acquired + Token carved
- **Shared:** Either completion unlocks Woodline gate

### What Carries Forward
- **Items:** Slingshot, steel balls, multitool, string, carved token
- **Memory Book:** First entries logged
- **Skills:** Basic tool use established
- **Companion Bond:** Dog presence normalized

### Optional Completionism
- All 10 toy soldiers found
- All linger moments discovered
- All audio vignettes unlocked
- Hidden spots revealed (under house crawlspace hint?)

---

## 🎨 Visual & Aesthetic Goals

### Current State
- ✅ Morning golden hour lighting (nailed the mood)
- ✅ Performance-optimized fence/grass instancing
- ✅ Clean boundaries without feeling claustrophobic
- ⚠️ Some greybox placeholders (multitool, carve station)

### Polish Targets
- [ ] Replace multitool placeholder with proper 3D model
- [ ] Carving station becomes weathered stump with character
- [ ] Tire swing gets rope physics (subtle swing in breeze)
- [ ] Sandbox toys (bucket, shovel) for detail richness
- [ ] Garden plants (tomato cage, herbs) for life
- [ ] House exterior detail (window boxes, back door)
- [ ] Toy soldiers modeled (tiny green army men aesthetic)

---

## 🧠 Emotional & Therapeutic Goals

### What Players Should Feel
- **Safety:** No threats, no timers, no failure states
- **Curiosity:** Natural pull toward new discoveries
- **Competence:** "I can do this" moments with tools
- **Nostalgia:** Childhood backyard memories gently evoked
- **Hope:** The backgate promises adventure without demanding it

### Therapeutic Elements
- **Grounding:** Familiar domestic space before wilderness
- **Agency:** Player chooses exploration pace
- **Mastery:** Simple tools with clear feedback
- **Connection:** Dog companion as emotional anchor
- **Transition:** Gentle bridge from safety to adventure

---

## 🔗 Connections to Other Worlds

### Forward: To Woodline
- **Gate Transition:** Walk through when ready (no forced progression)
- **Vista Preview:** See trees/trail before committing
- **Audio Shift:** Forest sounds grow as Woodline loads
- **Narrative:** "We can go deeper now."

### Backward: From Woodline
- **Return Option:** Can revisit Backyard anytime
- **Vista Reciprocal:** Standing in Woodline early area, see house silhouette and warm morning light behind
- **Progression Lock:** Woodline won't let you return until certain skills/items obtained (soft gate)

---

## 📝 Content Checklist

### Essential (Phase 1)
- [x] Boy tool pickup (slingshot)
- [x] Girl tool pickup (multitool)
- [x] Boy skill challenge (target)
- [x] Girl skill challenge (carving)
- [x] Gate transition to Woodline
- [x] Companion spawn
- [x] Morning lighting established
- [x] Fence boundaries

### Nice to Have (Phase 2)
- [ ] Toy soldier collectibles (10)
- [ ] Linger moments (tire swing, garden)
- [ ] Audio vignettes (3-4)
- [ ] Woodline vista proxy geometry
- [ ] Audio bleed system
- [ ] Bag inventory UI
- [ ] Memory Book integration

### Polish (Phase 3)
- [ ] Replace all greybox props
- [ ] Interactive tire swing
- [ ] Sandbox digging/toys
- [ ] Garden plant identification
- [ ] House exterior details
- [ ] Dynamic time progression (morning → late morning)
- [ ] Weather variation (light breeze, dew effects)

---

## 🌟 Design Mantras

> *"The Backyard remembers you."*  
> *"Safety before mystery."*  
> *"Every tool has a story."*  
> *"The gate waits, but never rushes."*

---

## 🔧 Technical Notes

### Performance
- 36 grass tile instances (optimized)
- 200+ fence picket instances (1 template mesh)
- Static mesh freezing on environment
- 4 simplified collision boxes for fence

### Asset References
- `House.glb` - Backyard house model
- `Summergrass.glb` - Tiled grass patches
- `TreesBushes.glb` - Oak tree varieties (4 instances)
- `Slingshot.glb` - Boy's first tool
- *(Pending: Multitool.glb, Toysolider.glb)*

### Event Flow
```
Pickup → Grant Item → Hide Mesh → Task Complete
Target → Require Item → Success Sound → Task Complete  
Gate → Check Unlock → Emit Area Request → Transition
```

---

*The Backyard is where the forest begins to call—but only when you're ready to answer.*