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