# 🌲 Woodline World

## Overview

The **Woodline** is where the journey becomes real. Having left the safety of the Backyard, the twins step into their first true wilderness—a sun-dappled forest clearing where survival skills awaken and the ritual of the campfire becomes a shared triumph. This is the transition from domestic comfort to natural confidence.

---

## ☀️ Atmosphere & Time of Day

**Time:** Late morning / Early midday  
**Mood:** Confident exploration, first "real" adventure, capability building  
**Color Palette:** Forest greens, golden sunlight shafts, earthy browns, sky blue  
**Lighting:** Bright overhead sun filtering through canopy, warm dappled light patterns

### Audio Landscape
- **Primary:** Forest ambience (rustling leaves, distant creek babble)
- **Wildlife:** Woodpeckers, squirrels chattering, crow calls, chickadees
- **Wind:** Gentle breeze through pine needles, leaf whisper
- **Silence:** Pockets of stillness that feel safe, not eerie
- **Vista Echo:** Faint backyard birds if looking toward home

---

## 🎯 Core Design Philosophy

The Woodline represents **the first real campsite ritual**—where both twins learn that fire is earned, not given. It introduces:
- **Dual solution paths** (Boy's sparks vs Girl's friction fire)
- **Shared objective** (the campfire as convergence point)
- **Indirect cooperation** (Girl's bowdrill remotely lights Boy's fire)
- **Skill validation** (tools from Backyard prove their worth)
- **Larger exploration space** (120×120 vs Backyard's 80×80)

**Key Principle:** *"We can do this together, even in different ways."*

---

## 🗺️ Layout & Points of Interest

### Play Area
- **Size:** 120×120 units (possibly make are more of a rectangle (60x120) to to create more of a "woodline look" with campfire area at the center)
- **Structure:** Central clearing surrounded by dense perimeter forest
- **Focal Point:** Campfire at center-back (0, 0, -5)
- **Entry:** Front-center (0, 0, 15) facing inward

### Key Locations

#### **1. The Campfire** *(0, 0, -5)* — *The Heart*
- **Function:** Shared goal for both role paths
- **Visual States:**
  - **Unlit:** Stone ring (torus), cold logs, gray ash
  - **Lit:** Flickering flame cone, warm orange point light (range 10, intensity 1.5)
- **Animation:** Gentle sine/cosine scale flicker (alive, not mechanical)
- **Sound:** Crackling wood, occasional pop, ember hiss
- **Emotional Weight:** "We did it" moment—no fanfare needed, just warmth

#### **2. Flint Pickup (Boy Path)** *(-8, 0, 5)*
- **Current:** Gray stone box hovering at y=0.5
- **Planned:** Actual flint stone with chipped edges, natural texture
- **Context:** Resting on small rock cairn or log end
- **Discovery Feel:** "Found something useful" not "collected quest item"

#### **3. Field Guide Pickup (Girl Path)** *(8, 0, 5)*
- **Current:** Brown book box hovering at y=0.5
- **Planned:** Weathered leather journal, hand-drawn cover
- **Context:** Leaning against tree trunk or on moss-covered stone
- **Mechanic:** Unlocks plant identification, first knowledge-based power

#### **4. Bowdrill Station (Girl Interaction)** *(5, 0, -8)*
- **Current:** Wood-colored box placeholder
- **Planned:** Log with carved groove, spindle beside it, tinder nest
- **Mechanic:** Girl uses multitool + string → creates friction fire → *remotely* lights campfire
- **Elegance:** Teaches indirect problem-solving (affect the world, not just your inventory)

#### **5. Entry Vista: Backyard View** *(Front edge, looking south)*
- **What You See:** House silhouette, white fence tops, golden morning glow
- **Distance:** ~40-50 units away (visible but separate)
- **Parallax:** Slight shift as player moves laterally
- **Emotional Note:** "We came from there. We can always go back."

#### **6. Exit Vista: Creek Glimpse** *(Back edge, looking north)*
- **What You See:** Hint of water shimmer, stepping stones, afternoon light shift
- **Sound Cue:** Distant water babble grows louder near northern edge
- **Gate Location:** Not implemented yet, but planned between two large pines
- **Promise:** "There's more ahead when we're ready."

#### **7. Stump Table Workbench (Craft Hub)** *(3, 0, 2)*
- **Tier 0 (Ground Craft):** Log surface for basic assembly
- **Tier 1:** Stump Table - carved flat surface with tool grooves
- **Tier 2 Upgrade:** Hanging rope spool, small drying rack, knot practice post
- **Signature Craft:** **Rope Line Kit** (tension lines, stakes, knots)

#### **8. Woodline Lean-To Shelter** *(-12, 0, -10)*
- **Structure:** Broad leaves, branches, twine lashings
- **Function:** First shelter build tutorial (simple construction)
- **Materials:** 6× branches, 10× leaves, 2× string
- **Benefit:** Linger spot, "sheltered" audio layer, teaches shelter mechanic

#### **9. Trail Totem - Fork Marker** *(0, 0, -20)*
- **Style:** Carved bark sign with direction arrows
- **Function:** Displays world completion progress
- **Upgrades:** Charms hang from branches (leaf, stone, pinecone, etc.)

---

## 🔒 Gated Content & Backtracking

### Locked Areas (Return Later with Tools)

#### **🕯️ Hollow Log Tunnel** *(-15, 0, -18)*
- **Early Tease:** Faint glow visible inside, creek sounds echo through
- **Visual Block:** Too dark to navigate safely
- **Unlock Tool:** **Lantern Stakes** (Firefly Dusk)
- **Rewards:**
  - Shortcut toward Creekside entry
  - Rare wood bundle (for workbench upgrades)
  - "Hollow Echo" audio vignette
- **Gate Type:** `requiredItemIds: ["lantern-stakes"]`

#### **🌿 Bramble Side Path** *(10, 0, 8)*
- **Early Tease:** Path curves around tree, blocked by thorny vines
- **Visual Block:** Brambles too thick to pass through
- **Unlock Tool:** **Brush Sickle** (Pine Trails)
- **Rewards:**
  - Rare wood + "bench upgrade strap" material
  - Hidden stump bench (new linger spot)
  - "Bramble Clear" memory entry
- **Gate Type:** `requiredItemIds: ["brush-sickle"]`

#### **🪢 Branch Pull-Down Shortcut** *(5, 1.5, -15)*
- **Early Tease:** Branch hangs above steep-ish slope, out of reach
- **Visual Block:** Need way to grab and secure branch
- **Unlock Tool:** **Rope Line Kit** (crafted here)
- **Benefit:** Major shortcut back to gate (reduces travel time)
- **Gate Type:** `requiredItemIds: ["rope-line-kit"]`

#### **⭐ Marked Tree Route** *(Various points in dense forest)*
- **Early Tease:** Easy to get turned around at night or in fog
- **Visual Block:** Navigation difficulty in low visibility
- **Unlock Tool:** **Star Chalk** (Night Stars)
- **Benefit:** Path becomes clearly marked, comfortable to navigate
- **Gate Type:** `requiredItemIds: ["star-chalk"]`

### Secret Linger Spot: Mossy Overlook *(-18, 2, 5)*
- **Early Tease:** Visible from below, requires careful climb
- **Unlock Tools:** **Rope Line Kit** (handline) OR **Step Boards** (stable footing)
- **Rewards:**
  - View of Backyard vista
  - "Wind Through Canopy" memory entry
  - Best photo spot in Woodline
- **Gate Type:** `optionalBoostItemIds: ["rope-line-kit", "step-boards"]`

---

## 🎮 Gameplay Features

### Currently Implemented

#### **Boy Role Tasks**
1. **Find Flint** — Discover gray stone for sparking
2. **Spark Fire** — Interact with campfire using flint + steel balls (from Backyard)
   - Direct interaction: "Strike sparks onto tinder"
   - Success: Fire ignites immediately

#### **Girl Role Tasks**
1. **Find Field Guide** — Acquire survival knowledge book
2. **Use Bowdrill** — Interact with bowdrill station using multitool + string
   - Creates friction fire at station
   - **Key Mechanic:** *Remotely* lights the campfire (elegant solution)

#### **Shared Victory**
- Either path lighting the fire completes the area
- No "race" between roles—both methods equally valid
- Campfire state persists (if Boy lit it, Girl sees it already burning)

### Planned Features

#### **🪢 Rope Line Kit Crafting (Signature Item)**
- **Crafted At:** Stump Table Workbench (Tier 1)
- **Materials Needed:**
  - 3× String/cordage (from Backyard + found here)
  - 2× Wooden stakes (carved with multitool)
  - 1× Toggle (carved from branch)
- **Assembly:** Knot-tying mini-game - practice bowline, tarp line, rescue loop
- **Output:** **Rope Line Kit** - tension lines, bridge support, climbing aid
- **Uses Across Worlds:**
  - **Backyard:** Rope swing to cross muddy corner → hidden trinket
  - **Woodline:** Pull-down branch shortcut (fast backtrack loop)
  - **Creekside:** Lash handrail across stepping stones → deep bank collectibles
  - **Pine Trails:** Tension line for shelter upgrade / reach raised overlook
  - **Firefly Dusk:** String lantern stakes faster (place in one motion)
  - **Night Stars:** Secure stargazing tarp / hang star chart
  - **Beachfront:** Tie driftwood rig → hidden tidepool path

#### **🏕️ Woodline Lean-To Shelter Building**
- **Location:** Shelter site *(-12, 0, -10)*
- **Materials Required:**
  - 6× Long branches (found scattered in clearing)
  - 10× Large leaves (from underbrush)
  - 2× String (from inventory or found)
- **Assembly Steps:**
  1. Position main support branches (drag-and-place)
  2. Lean side branches against support
  3. Layer leaves for roof (simple stack animation)
  4. Tie with string to secure
- **Benefits:**
  - Creates linger spot with "sheltered" audio layer
  - Unlocks "First Shelter" memory entry
  - Teaches shelter mechanic for other worlds
  - Campfire warmth bonus if built nearby

#### **📦 Workbench Tier System**
- **Tier 0 (Ground Craft):** Log surface, basic assembly
  - Always available
  - Recipes: Twine bundles, wooden stakes, simple wraps
- **Tier 1 (Stump Table):** Carved flat surface with grooves
  - Build materials: 4× planks, 1× string, carving tool
  - Unlocks: Rope Line Kit + knot practice
- **Tier 2 (Enhanced Bench):** Full workshop features
  - Upgrade materials: Strap from bramble path, hooks from metal scraps
  - Adds: Hanging rope spool, drying rack, knot practice post
  - Unlocks: Craft 2× rope kits at once, better durability
  - Visual: Accumulates charms, pressed leaves, tools on display

#### **🔥 Campsite Rituals (First Introduction)**
- **Sit by Fire:** Hold position near flames → unlock "Fireside Thoughts" audio vignette
- **Linger Mode Showcase:**
  - Watch flames dance for 20 seconds → Memory Book entry: "First Fire"
  - Companion curls up by fire → audio layer adds soft breathing
- **Warmth Mechanic (Future):** Cold status (visual blue tint) fades near fire

#### **📖 Field Guide System Introduction**
- **Plant Identification:**
  - Ferns near clearing edge: "Bracken Fern - used for bedding"
  - Moss on trees: "Sphagnum Moss - holds water, fire starter when dry"
  - Wild berry bush: "Blackberry - edible, avoid thorns" (can't pick yet, just learn)
- **UI:** Magnifying glass icon appears when near identifiable plants
- **Progression:** Each ID unlocks field guide page, builds toward herbology mastery

#### **🎯 Target Practice Expansion (Boy Skill Growth)**
- **Dynamic Targets:**
  - Pinecone on low branch (easy)
  - Carved notch in distant tree (medium)
  - Hanging bottle cap that spins (hard)
- **Reward:** Accuracy builds toward "Eagle Eye" skill (slow-mo aim assist later)

#### **🪢 Knot Practice (Girl Skill Growth)**
- **Knot Post Workstation:** Rope tied to tree, practice different knots
  - Bowline: "Makes a loop that won't slip"
  - Tarp Line: "Secure shelters"
  - Rescue Loop: "Emergency situations"
- **UI:** Simple mini-game (trace the rope path with mouse/stick)
- **Reward:** Knot mastery unlocks bridge-building, rappelling (later worlds)

#### **🌲 Tree Identification Challenge**
- **Species Around Clearing:**
  - Oak (broad leaves, acorns)
  - Pine (needles, sap potential)
  - Birch (white bark, fire starter)
  - Maple (helicopter seeds, syrup tease)
- **Girl Skill:** Use field guide to name each tree
- **Reward:** Unlock "Forest Friend" achievement, new audio layer (tree names whispered in wind)

---

## 🔄 Backtrack Loop Blueprint

This structure ensures Woodline remains engaging across multiple visits.

### Spawn / Welcome Point
- **Location:** Gate clearing (0, 0, 15)
- **First Visit:** Tool discovery (flint, field guide), fire lighting ritual
- **Return Visits:** Workbench upgrades, shelter improvements

### Main Trail (Always Passable)
- **Route:** Trail Bend → Small Camp Clearing → Campfire
- **Purpose:** Core campsite ritual, first real wilderness experience
- **Gate to Creekside:** Unlocks after campfire is lit

### Early Teases (Locked on First Visit)

#### Tease A: Hollow Log Tunnel
- **Location:** Northwest clearing edge *(-15, 0, -18)*
- **Visual:** Faint glow inside, mysterious darkness
- **Audio:** Creek sounds echo through tunnel, distant water
- **Requires:** `lantern-stakes` (Firefly Dusk)
- **Reward Type:** `shortcut + material + audio-vignette`

#### Tease B: Bramble Side Path
- **Location:** Northeast curve *(10, 0, 8)*
- **Visual:** Path visible through thorny vines, hints of clearing beyond
- **Audio:** Wind changes tone beyond brambles, birdsong
- **Requires:** `brush-sickle` (Pine Trails)
- **Reward Type:** `material + linger-spot + memory`

### Mid Unlock (Later Game)

#### Branch Pull-Down Shortcut
- **Location:** Western slope *(5, 1.5, -15)*
- **Visual:** Branch hangs tantalizingly close, rope marks on trunk
- **Audio:** Branch creaks in wind, inviting interaction
- **Requires:** `rope-line-kit` (crafted here)
- **Reward Type:** `major-shortcut`
- **Function:** Reduces backtracking time by 40 seconds, connects gate to camp directly

### Navigation Enhancement

#### Marked Tree Route
- **Location:** Dense forest areas (various points)
- **Visual:** Easy to lose bearings in thick canopy
- **Audio:** Forest sounds become disorienting without markers
- **Requires:** `star-chalk` (Night Stars)
- **Reward Type:** `navigation-comfort`
- **Function:** Path becomes clearly marked, reduces anxiety

### Secret Linger Spot

#### Mossy Overlook
- **Location:** Elevated outcrop *(-18, 2, 5)*
- **Early Tease:** Visible from below, challenging climb
- **Requires:** `rope-line-kit` (handline) OR `step-boards` (stable footing)
- **Rewards:**
  - View of Backyard vista (emotional callback)
  - "Wind Through Canopy" memory entry
  - Best photo opportunity in Woodline
  - "Overlook Meditation" audio vignette (60 sec linger)
- **Boost Items:**
  - `pocket-press` → adds pressed leaf sketches
  - `shell-wind-chime` → attracts birds to overlook

### Craft Hub Placements

#### Workbench
- **Location:** Stump Table *(3, 0, 2)*
- **Tier 1:** Carved flat surface (craft Rope Line Kit)
- **Tier 2:** Add rope spool, drying rack, knot practice post
- **Visual Progression:** Accumulates tools, knots on display, charms

#### Shelter
- **Location:** Lean-To site *(-12, 0, -10)*
- **Structure:** Leaf and branch shelter (first build)
- **Upgrades:**
  - Add fire ring nearby (campfire extension)
  - Rope Line Kit improves structure stability
  - Pocket Press adds decorative pressed leaves

#### Trail Totem
- **Location:** Fork in path *(0, 0, -20)*
- **Style:** Carved bark sign with direction arrows
- **Function:** Displays world completion charms
- **Upgrades Per World:**
  - Backyard: House charm (miniature fence piece)
  - Creekside: Smooth stone charm
  - Pine Trails: Pinecone charm
  - Firefly Dusk: Lantern charm
  - Night Stars: Star charm
  - Beachfront: Shell charm

### Intentional Loop Summary

**First Visit Flow:**
1. Enter from Backyard through gate
2. Find flint or field guide (role-specific)
3. Light campfire (shared victory)
4. Build Tier 1 workbench
5. Craft Rope Line Kit
6. Notice 2 locked paths (hollow log, bramble)
7. Build Lean-To shelter (optional)
8. Proceed to Creekside

**Return Visit Flow (Pine Trails complete):**
1. Return with Brush Sickle
2. Clear bramble path
3. Discover hidden stump bench + materials
4. Use materials for workbench Tier 2 upgrade
5. Notice other gated areas

**Return Visit Flow (Dusk/Night complete):**
1. Return with Lantern Stakes and Star Chalk
2. Light hollow log tunnel → discover shortcut
3. Mark tree route → comfortable navigation
4. Use Rope Line Kit on branch shortcut
5. All shortcuts active → fast backtracking

**Final Visit Flow (All Tools):**
1. Visit Mossy Overlook with multiple tools
2. Use all boost items (press, chime)
3. Complete shelter upgrades
4. Achieve "Woodline Master" completion

---

## 🌲 Vista System: Dual Views

### Looking South: Backyard Vista
**The Comfort Behind You**

- **Geometry:** House roofline, fence silhouettes, yard tree shapes
- **Lighting:** Warm golden glow (morning sun backlights Backyard)
- **Distance:** 50 units, no collision, LOD'd mesh
- **Audio:** Faint suburban sounds (distant lawnmower, wind chime)
- **Emotion:** "Home is there if I need it."

### Looking North: Creek Teaser
**The Mystery Ahead**

- **Geometry:** Hint of water reflection, 2-3 stepping stones, willow branches
- **Lighting:** Cooler afternoon light (time shift preview)
- **Distance:** 60 units into mist
- **Audio:** Babbling water crescendos as you approach edge
- **Emotion:** "I wonder what's over there..."

### Technical Implementation
- **No loading:** Both vistas load with Woodline (low poly, <500 tris each)
- **Camera tricks:** Slight parallax shift to sell depth
- **Fog layers:** Gradual fade to mask LOD transitions
- **Audio zones:** 3D positional audio with falloff curves

---

## 🎵 Audio Design

### Ambient Layers
1. **Base:** Forest floor ambience (leaf rustle, twig snaps under foot)
2. **Canopy:** Wind through mixed deciduous/coniferous trees
3. **Wildlife:** Layered bird calls (woodpecker percussion, crow call-and-response, chickadee chatter)
4. **Water:** Distant creek babble (grows louder toward north edge)
5. **Human Touch:** Occasional twig snap (your passage), backpack rustle

### Interactive Sounds
- **Flint Strike:** Metal on stone *shing*, spark crackle
- **Bowdrill:** Wood-on-wood friction squeak, smoke hiss, ember glow
- **Fire Ignition:** Soft *whoomph*, tinder catch, flame roar crescendo
- **Field Guide:** Paper rustle, page turn, pencil sketch scratch
- **Footsteps:** Leaf crunch, twig snap, soft earth compression

### Memory Audio Vignettes (Planned)
- **"Fireside Thoughts"** — Crackling fire, deep breath, reflective narration
- **"Forest Names"** — Girl whispers tree species, gentle learning moment
- **"Spark and Flame"** — Boy's focus narration, satisfying fire success
- **"Creek Close-Up"** — Unlocks when standing at northern edge, pure water sounds

---

## 🏆 Progression & Unlocks

### Completion Criteria
- **Boy:** Flint acquired + Campfire lit via sparks
- **Girl:** Field guide acquired + Campfire lit via bowdrill
- **Shared:** Either completion unlocks Creek world (when implemented)

### What Carries Forward
- **Items:** Flint, field guide, any gathered materials
- **Skills:** Fire-making confidence, tool proficiency
- **Knowledge:** Plant IDs, tree names logged in Memory Book
- **Companion Growth:** Dog learns "Stay" command (waits by fire while you explore)

### Optional Completionism
- All plants identified (8 species around clearing)
- All trees named (6 varieties)
- Knot practice station mastered (3 knots)
- Target practice tiers achieved (easy/medium/hard)
- Linger moments discovered (fireside, moss patch, birch grove)

---

## 🎨 Visual & Aesthetic Goals

### Current State
- ✅ Late morning bright lighting (excellent visibility)
- ✅ Larger play space encourages exploration
- ✅ Central campfire as clear focal point
- ✅ Perimeter trees create "forest embrace" without claustrophobia
- ⚠️ Greybox placeholders (flint, field guide, bowdrill station)

### Polish Targets
- [ ] Flint stone model (chipped edges, realistic texture)
- [ ] Field guide model (leather, hand-drawn pages)
- [ ] Bowdrill station (log, spindle, tinder nest, carved groove)
- [ ] Dynamic campfire (better flame shader, ember particles)
- [ ] Ground scatter (fallen leaves, pinecones, twigs)
- [ ] Light shafts (god rays through canopy gaps)
- [ ] Moss on tree trunks (adds age and life)
- [ ] Underbrush variety (ferns, berry bushes, stumps)

---

## 🧠 Emotional & Therapeutic Goals

### What Players Should Feel
- **Capability:** "I can survive out here."
- **Pride:** "I made fire!" (primal satisfaction)
- **Curiosity:** "What's that plant? What tree is this?"
- **Connection:** "We both did this, our own way."
- **Confidence:** "Backyard was safe. This is real. I'm ready."

### Therapeutic Elements
- **Mastery:** Fire-making as concrete skill achievement
- **Dual Validation:** Both paths equally celebrated (no "right" way)
- **Grounding:** Natural sounds, forest scents (visual suggestion), earthiness
- **Safety:** Still no threats, no timers, no failure states
- **Growth:** Clear transition from domestic → wild without trauma

---

## 🔗 Connections to Other Worlds

### Backward: To Backyard
- **Vista:** See house/fence from clearing entry
- **Return Mechanic:** Can walk back through hidden trail gate (when implemented)
- **Progression:** Must complete Woodline to unlock Creek, but Backyard always accessible

### Forward: To Creek
- **Vista:** Water shimmer, stepping stones visible from northern edge
- **Audio Teaser:** Creek babble grows louder
- **Gate:** Not implemented yet, planned between two large pines
- **Narrative Transition:** "The fire's warm, but there's fresh water ahead."

---

## 🔥 Campfire as Symbolic Core

### Why It Matters
The campfire isn't just a task objective—it's the **emotional heart** of Woodline. Fire represents:
- **Survival:** We can take care of ourselves
- **Convergence:** Both twins' skills meet here
- **Warmth:** Physical and emotional
- **Memory:** First "real" wilderness moment
- **Milestone:** Proof we've moved beyond the backyard

### Design Subtleties
- No countdown, no urgency—light it when ready
- Remains lit permanently after success (return visits show warm fire)
- Companion reacts (curls up, relaxes, sighs contentedly)
- Linger by fire → unlock deeper narrative beats
- Future: Other NPCs attracted to firelight (friendly, not threatening)

---

## 📝 Content Checklist

### Essential (Phase 1)
- [x] Boy flint pickup
- [x] Girl field guide pickup
- [x] Boy campfire direct lighting
- [x] Girl bowdrill indirect lighting
- [x] Campfire visual states (unlit/lit)
- [x] Larger forest clearing layout
- [x] Perimeter trees (pines + mixed deciduous)
- [x] Bright daytime lighting

### Nice to Have (Phase 2)
- [ ] Plant identification mechanic (8 species)
- [ ] Tree naming challenge (6 varieties)
- [ ] Target practice expansion (3 tiers)
- [ ] Knot practice station (3 knots)
- [ ] Backyard vista (house silhouette)
- [ ] Creek vista (water teaser)
- [ ] Audio bleed system (backyard ↔ woodline ↔ creek)
- [ ] Linger mode: fireside sitting
- [ ] Field guide UI integration

### Polish (Phase 3)
- [ ] Replace all greybox props
- [ ] Dynamic flame shader + ember particles
- [ ] Ground scatter (leaves, cones, twigs)
- [ ] Light shafts through canopy
- [ ] Moss on tree trunks
- [ ] Underbrush variety (ferns, berry bushes)
- [ ] Companion fire reactions (curl up, sigh, tail wag)
- [ ] Memory Book: "First Fire" entry with illustration

---

## 🌟 Design Mantras

> *"Two paths, one flame."*  
> *"The forest teaches by invitation, not demand."*  
> *"Fire is earned, not given."*  
> *"We're capable now."*

---

## 🔧 Technical Notes

### Performance
- 120×120 unit forest floor (larger than Backyard)
- 6 TreesBushes.glb instances (varied rotation/scale)
- 12 Pinetree.glb instances forming perimeter
- Static mesh freezing on environment
- Dynamic campfire light (single point light, low cost)

### Asset References
- `TreesBushes.glb` - Mixed deciduous trees
- `Pinetree.glb` - Evergreen perimeter
- *(Pending: Flint.glb, FieldGuide.glb, BowdrillStation.glb, CampfireFlame shader)*

### Event Flow
```
Boy: Pickup Flint → Interact Campfire → Sparks → Fire Lit
Girl: Pickup Field Guide → Interact Bowdrill → Friction Fire → Campfire Lit (remotely)
Either → Fire State: Lit → Area Complete → Creek Unlocks
```

### State Management
- Campfire fire state persists (if Boy lit it, Girl sees it already burning)
- Items granted persist across sessions
- Vista geometry loaded with world (no separate load)

---

*The Woodline is where we learn: the wilderness isn't something to conquer—it's something to understand, and it welcomes those who try.*