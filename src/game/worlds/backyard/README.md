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

#### **9. Sandbox Workbench (Craft Hub)** *(-7.5, 0.15, 5.5)*
- **Tier 0 (Ground Craft):** Always available - blanket on sandbox edge
- **Function:** Basic crafting surface for bundling, tying, simple assembly
- **Tier 1 Upgrade:** Sandbox Workbench - add toy crates as storage
- **Tier 2 Upgrade:** Add hooks for tools, toy drawers, charm display
- **Signature Craft:** **Pocket Press** (leaf/flower preservation tool)

#### **10. Backgate Trail Totem** *(0, 0, -28)*
- **Function:** Marks progression - displays ribbons/charms as worlds unlock
- **Visual:** Painted wood sign with toy decorations
- **Upgrades:** Each world completed adds a new charm or ribbon

---

## 🔒 Gated Content & Backtracking

### Locked Areas (Return Later with Tools)

#### **🌾 Neighbor's Yard - Tall Grass Wall** *(-25, 0, 0)*
- **Early Tease:** Visible through fence gaps, sparkle trail hints at collectibles
- **Visual Block:** Grass too tall to wade through safely
- **Unlock Tool:** **Brush Sickle** (crafted in Pine Trails)
- **Rewards:**
  - Toy soldiers #11-13
  - Rare fiber bundle (for crafting upgrades)
  - "Pressed Clover" Memory Book entry
- **Gate Type:** `requiredItemIds: ["brush-sickle"]`

#### **💧 Muddy Corner by Fence** *(12, 0, -22)*
- **Early Tease:** Dog sniffs and paw prints lead into soggy patch
- **Visual Block:** Too muddy to cross without getting stuck
- **Unlock Tool:** **Step Boards** (crafted in Creekside)
- **Rewards:**
  - Hidden twine bundle (3 uses)
  - Board socket locations reveal elsewhere
  - "Muddy Paws" audio vignette
- **Gate Type:** `requiredItemIds: ["step-boards"]`

#### **🕯️ Shed Shadow Nook** *(20, 0, 15)*
- **Early Tease:** Dark corner under shed overhang, mysterious
- **Visual Block:** Too dark/eerie to explore early on
- **Unlock Tool:** **Lantern Stakes** (crafted in Firefly Dusk) OR basic lantern
- **Rewards:**
  - Cosmetic backpack charm
  - "Distant Crickets" audio vignette
  - Toy soldier #14
- **Gate Type:** `requiredItemIds: ["lantern-stakes"]`

#### **🪢 Rope Swing to Fence Hop** *(22, 1, -8)*
- **Shortcut:** Quick path from porch side to backgate side
- **Unlock Tool:** **Rope Line Kit** (crafted in Woodline)
- **Benefit:** Reduces backtracking time by 30 seconds
- **Gate Type:** `requiredItemIds: ["rope-line-kit"]`

### Secret Linger Spot: Tree Base Picnic Circle *(5, 0, -12)*
- **Always Reachable:** But improves with progression
- **Upgrades:**
  - **Shell Wind Chime:** Birds land nearby, new chirp sounds
  - **Pocket Press:** Adds sketch pages to Memory Book
  - **Star Chalk:** Can draw hopscotch pattern (reveals toy soldier)
- **Rewards:** Layered audio vignettes, "childhood summers" memory

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

#### **🛠️ Pocket Press Crafting (Signature Item)**
- **Crafted At:** Sandbox Workbench (Tier 1)
- **Materials Needed:**
  - 2× Wooden boards (found near garden)
  - 1× String (from multitool supplies)
  - 2× Flat stones (near sandbox)
- **Assembly:** Simple mini-game - stack boards, thread string, place stones
- **Output:** **Pocket Press** - preserves leaves/flowers for Memory Book
- **Uses Across Worlds:**
  - **Backyard:** Press clover/flower pages → toy soldier hints
  - **Woodline:** Press leaves/bark → reveals hidden trail markers
  - **Creekside:** Press reeds → unlocks water-sound vignette
  - **Pine Trails:** Press pine needles → resin wrap upgrade hint
  - **Firefly Dusk:** Press glow petals → lantern color variant
  - **Night Stars:** Press starflower → constellation puzzle clue
  - **Beachfront:** Press sea grass → shell wind chime tuning clue

#### **📦 Workbench Tier System**
- **Tier 0 (Ground Craft):** Always available from start
  - Blanket/flat surface on sandbox edge
  - Recipes: Twine bundles, charcoal marks, simple stakes
- **Tier 1 (Sandbox Workbench):** Built after finding materials
  - Requires: 4× boards, 2× string, 1× hammer (found items)
  - Unlocks: Pocket Press + bundle recipes
- **Tier 2 (Enhanced Bench):** Upgrade after visiting other worlds
  - Add: Tool hooks, toy drawers, charm display
  - Unlocks: Craft 2 items at once, better durability
  - Visual: Accumulates charms, pressed leaves, toy soldier guards

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
- **Additional Soldiers (with tools):**
  - #11-13: Behind tall grass wall (needs Brush Sickle)
  - #14: In shed shadow nook (needs Lantern Stakes)
  - #15: Under hopscotch chalk (needs Star Chalk)

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

## 🔄 Backtrack Loop Blueprint

This structure ensures Backyard remains engaging across multiple visits.

### Spawn / Welcome Point
- **Location:** Back porch / sandbox edge
- **First Visit:** Tool discovery, basic crafting introduction
- **Return Visits:** Workbench upgrades, new recipes unlock

### Main Trail (Always Passable)
- **Route:** Porch → Backyard loop → Backgate fence line
- **Purpose:** Core exploration, establishes world boundaries
- **Gate to Woodline:** Unlocks after completing basic tasks

### Early Teases (Locked on First Visit)

#### Tease A: Neighbor Yard - Tall Grass
- **Location:** West fence line *(-25, 0, 0)*
- **Visual:** Sparkle trail through fence gaps, toy soldier silhouettes
- **Audio:** Distant wind chimes, grass rustle
- **Requires:** `brush-sickle` (Pine Trails)
- **Reward Type:** `material + trinket + memory`

#### Tease B: Muddy Corner
- **Location:** Southeast corner *(12, 0, -22)*
- **Visual:** Dog tracks leading in, paw prints in mud
- **Audio:** Squelching sounds, companion whine
- **Requires:** `step-boards` (Creekside)
- **Reward Type:** `material + shortcut-unlock`

### Mid Unlock (Later Game)

#### Shed Shadow Nook
- **Location:** Northeast *(20, 0, 15)*
- **Visual:** Dark overhang, mysterious shapes in shadow
- **Audio:** Quiet echo, cricket chirps intensify
- **Requires:** `lantern-stakes` (Firefly Dusk)
- **Reward Type:** `trinket + memory + audio-vignette`
- **Optional Boost:** `pocket-press` adds extra memory entry

### Shortcut (Backtracking Quality of Life)

#### Rope Swing Fence Hop
- **Location:** Tire swing tree *(22, 1, -8)*
- **Requires:** `rope-line-kit` (Woodline)
- **Function:** Fast travel from porch side → backgate side
- **Time Saved:** ~30 seconds per crossing
- **Visual:** Rope extends from swing to fence top

### Secret Linger Spot

#### Tree Base Picnic Circle
- **Location:** Under oak tree *(5, 0, -12)*
- **Always Accessible:** Yes, but upgrades with tools
- **Boost Items:**
  - `shell-wind-chime` → Birds land, new audio layer
  - `pocket-press` → Sketch pages unlock
  - `star-chalk` → Hopscotch pattern reveals toy soldier #15
- **Rewards:** Layered audio vignettes, "Childhood Summers" memory
- **Linger Duration:** 60 seconds for full experience

### Craft Hub Placements

#### Workbench
- **Location:** Sandbox edge *(-7.5, 0.15, 5.5)*
- **Tier 1:** Toy crate workbench (craft Pocket Press)
- **Tier 2:** Add hooks, drawers, charm rack
- **Visual Progression:** Accumulates tools, pressed flowers, toy soldiers

#### Trail Totem
- **Location:** Backgate entrance *(0, 0, -28)*
- **Style:** Painted wood sign + toy decorations
- **Function:** Displays world completion ribbons/charms
- **Upgrades Per World:**
  - Woodline: Leaf charm
  - Creekside: Stone charm
  - Pine Trails: Pinecone charm
  - Firefly Dusk: Lantern charm
  - Night Stars: Star charm
  - Beachfront: Shell charm

### Intentional Loop Summary

**First Visit Flow:**
1. Find tools (slingshot, multitool)
2. Complete basic tasks
3. Build Tier 1 workbench
4. Craft Pocket Press
5. Notice 3 locked areas
6. Proceed to Woodline

**Return Visit Flow (Pine Trails complete):**
1. Return with Brush Sickle
2. Cut tall grass → neighbor yard
3. Collect toy soldiers + materials
4. Use materials for workbench Tier 2 upgrade
5. Notice other locked areas still present

**Return Visit Flow (All Tools):**
1. Unlock all 3 gated areas
2. Complete toy soldier collection
3. Upgrade workbench to Tier 2
4. Use all boost items at linger spot
5. Achieve 100% completion memory

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