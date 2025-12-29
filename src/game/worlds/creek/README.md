# 💧 Creek World

## Overview

The **Creek** is where water becomes teacher. Afternoon light dances on ripples as the twins learn to move with intention, filter uncertainty, and cross obstacles one careful step at a time. This is the world of flow, patience, and the soft power of water.

---

## 🌞 Atmosphere & Time of Day

**Time:** Mid-to-late afternoon  
**Mood:** Meditative, fluid, unhurried confidence  
**Color Palette:** Cool blues, sun-warmed stones, silver reflections, green moss  
**Lighting:** Overhead afternoon sun, water caustics dancing on rocks, dappled shade from willow branches

### Audio Landscape
- **Primary:** Creek babble (constant, varying pitch from shallow to deep)
- **Water Detail:** Specific sounds per area:
  - Gentle trickle over smooth stones
  - Deeper gurgle near pools
  - Splash from stepping stones
  - Drip from overhanging moss
- **Wildlife:** Frogs (distant ribbit), dragonflies (wing buzz), water birds (kingfisher chatter)
- **Wind:** Willow leaves whisper (softer than forest rustle)
- **Vista Echo:** Faint forest ambience from Woodline behind, wind through pines ahead

---

## 🎯 Core Design Philosophy

The Creek introduces **movement as problem-solving**. It teaches:
- **Stepping Stones:** Path-finding, balance, consequence-free "failure" (just restart)
- **Water Filtering:** Girl's knowledge skill applied practically
- **Slingshot Bridge:** Boy's tool used architecturally (knock branch to cross gap)
craft Fishing pole
- **Patience Mechanics:** Rush = wet feet (visual feedback, no punishment)
- **"Ask Twin" Introduction:** First companion cooperation prompts

**Key Principle:** *"Water doesn't fight—it finds a way. So can we."*

---

## 🗺️ Layout & Points of Interest

### Play Area
- **Size:** 100×140 units (longer than wide, follows creek flow)
- **Structure:** Creek runs north-south down center, banks on both sides
- **Flow Direction:** Gentle current south → north (toward Pine Trails)
- **Entry:** Southern bank from Woodline

### Key Locations

#### **1. Shallow Crossing (Entry Point)** *(0, 0, 15)*
- **Function:** Tutorial for stepping stones
- **Layout:** 5 stones spaced 1.5 units apart, obvious path
- **Feedback:** Step on stone = satisfying *thunk* + balance animation
- **Failure:** Miss = splash sound + wet footprint trail (no damage, just visual)
- **Learning:** Teaches rhythm before harder crossings

#### **2. The Filter Station (Girl Skill)** *(-8, 1, 0)*
- **Location:** East bank, flat rock shelf beside small pool
- **Function:** Purify murky water → clean water (inventory item)
- **Visual:** Murky pool (brown-green), ceramic filter setup, collection jar
- **Interaction:**
  - Girl uses field guide → identifies safe filtering method
  - Requires: Field guide + string (make filter bag)
  - Output: Clean water (3 uses, stackable)
- **Sound:** Water trickling through fabric, drip into jar
- **Emotional Beat:** "Knowledge makes the world safer."

#### **3. Stepping Stone Challenge (Mid-Creek)** *(0, 0, 0)*
- **Layout:** 9 stones in zigzag pattern, some wobbly, one "fake" (slippery moss)
- **Visual Cues:**
  - Stable stones: Dry, sun-warmed, gray granite
  - Wobbly stones: Slight tilt, darker color (wet longer)
  - Fake stone: Green moss coating (comedic slip, not frustrating)
- **Companion Help:** Dog sniffs fake stone, barks warning (optional hint)
- **Reward:** Reach center island → small dry clearing with log bench (linger spot)

#### **4. The Slingshot Bridge (Boy Cooperation)** *(5, 2, -10)*
- **Setup:** Wide gap in creek, no stones, but a Y-branch hangs over water from far side
- **Puzzle:**
  - Boy aims slingshot at branch connection point
  - Hit 3 times → branch creaks, falls, spans the gap
  - Now both twins can cross
- **"Lock" Type:** Rare story beat (Boy required, but obvious and fun)
- **Sound:** Branch crack, splash, wood settle
- **Emotional Beat:** "We need each other."

#### **5. Deep Pool (Linger Moment)** *(-10, 0, -15)*
- **Visual:** Calm, clear pool reflecting sky, moss-covered stones, fern overhang
- **Interaction:** Stand at edge for 15 seconds
- **Unlocks:**
  - Audio vignette: "Creek Close-Up" (pure water sounds, frog chirp, dragonfly zip)
  - Memory Book entry: "Still Water" (illustration of reflection)
- **Optional:** Girl can identify aquatic plants (cattails, water lilies)
- **Emotional Note:** This is where the game breathes with you

#### **6. Willow Canopy Rest** *(10, 0, 5)*
- **Visual:** Massive willow tree, roots reaching into water, shaded alcove
- **Function:** Safe spot, natural campsite feel
- **Interaction:** Sit on root → companion curls up beside you
- **Audio Shift:** Creek sounds muffled by willow leaves, wind focus
- **Memory:** "Under the Willow" vignette (childhood hiding spot nostalgia)

#### **7. North Vista: Pine Trails Glimpse** *(0, 0, -30)*
- **What You See:** Creek narrows, disappears into rocky terrain, tall pines on slopes
- **Audio Cue:** Wind pitch changes (forest → mountain), distant pine creak
- **Visual Shift:** Afternoon light becomes more golden (time advancing)
- **Gate (Future):** Stone arch formed by two leaning boulders
- **Promise:** "The climb begins soon."

#### **8. South Vista: Woodline Echo** *(0, 0, 30)*
- **What You See:** Forest canopy, hint of campfire smoke rising above trees
- **Audio:** Faint crackle if you lit the fire, bird calls from Woodline
- **Emotional:** "We're not far from where we started, but we've learned so much."

---

## 🎮 Gameplay Features

### Core Mechanics

#### **🪨 Stepping Stones System**
- **Physics:** Semi-rigid bodies (wobble slightly under weight)
- **Visual Feedback:**
  - Foot placement indicator (circle, green = safe, red = miss)
  - Balance animation (twin wobbles if too fast)
- **Progression:**
  - Shallow Crossing: Easy, 5 stones, straight line
  - Mid Challenge: Medium, 9 stones, zigzag
  - Final Test: Hard, 12 stones, some timed (water level rises/falls)
- **Failure State:** Splash, wet feet, retry from bank (no punishment, just feedback)
- **Companion:** Dog jumps stone-to-stone playfully (shows it's safe)

#### **💧 Water Filtering (Girl Knowledge Skill)**
- **Setup:** Three pools around creek (murky, algae, clear-but-suspect)
- **Field Guide Interaction:**
  - Girl examines water → guide shows filtering diagram
  - Requires: String (from Backyard) + fabric scrap (found near filter station)
- **Mini-Game (Optional):** Layer sand, charcoal, gravel in correct order
- **Output:** Clean water item (heals companion if tired, unlocks "hydration" UI later)
- **Teaching Moment:** Water isn't always safe—knowledge protects

#### **🎯 Slingshot Bridge (Boy Tool Architecture)**
- **Target:** Hanging branch (Y-fork) over wide creek gap
- **Mechanic:**
  - Aim at glowing weak point (where branch joins trunk)
  - 3 hits = cracks visible, sound cues
  - Final hit = slow-mo fall, satisfying splash, bridge forms
- **Elegance:** Slingshot isn't just combat—it's environmental manipulation
- **Optional:** Can skip by finding longer path around (no tool required alternate)

#### **🐕 "Ask Twin" / Companion Hints**
- **Trigger:** Stand near puzzle, press "Ask Twin" button
- **Responses:**
  - At fake mossy stone: Dog sniffs, barks, sits (warning)
  - At filter station: Dog drinks clean water, refuses murky (validation)
  - At slingshot bridge: Dog looks up at branch, tail wags (hint)
- **Tone:** Helpful without hand-holding, cute without breaking immersion

#### **🌿 Plant Identification Expansion (Girl Skill)**
- **New Species:**
  - Cattails (edible roots, tinder material)
  - Water lilies (beauty, frog habitat note)
  - Moss (water indicator, compass trick)
  - Ferns (shade lovers, decorative)
- **Mechanic:** Magnifying glass icon → short description → field guide page added
- **Reward:** Collecting 5 creek plants unlocks "Creek Herbalist" achievement

---

## 🌊 Vista System: Water Corridor

### Looking South: Woodline Memory
**Where We Came From**

- **Geometry:** Forest treeline, campfire smoke wisp, oak/pine silhouettes
- **Lighting:** Warm forest green, midday brightness fading
- **Audio:** Forest birds, leaf rustle, faint fire crackle
- **Distance:** 50 units, mist transition
- **Emotion:** "The campfire is still warm. We can return."

### Looking North: Pine Approach
**Where We're Going**

- **Geometry:** Creek narrowing into rocky channel, pine trunks on slopes, boulders
- **Lighting:** Golden afternoon shifting (time creeping toward late afternoon/evening)
- **Audio:** Wind through needles (higher pitch), distant creek rapids, stone echo
- **Distance:** 60 units, fog gradient
- **Emotion:** "It's getting wilder, but we're ready."

### Technical Implementation
- **Water Shader:** Simple reflective plane, animated normal map, foam at stone edges
- **Caustics:** Projected texture simulating light through water (cheap, effective)
- **Audio Zones:** 5 distinct creek sound zones (shallow, deep, pool, rapids, trickle)
- **Vista Loading:** Both load with Creek world, <1000 tris total

---

## 🎵 Audio Design

### Ambient Layers
1. **Base:** Creek babble (varies by depth—shallow tinkle, deep gurgle)
2. **Water Detail:** Drips, splashes, ripples (reactive to player movement)
3. **Wildlife:** Frogs (afternoon chorus), dragonflies (buzz-by), kingfisher (rattle call)
4. **Wind:** Willow leaves (soft rustle), gentle breeze over water
5. **Stone:** Water lapping against rocks, occasional plunk

### Interactive Sounds
- **Stepping Stone:** Stone thunk (different pitches per stone), balance shift
- **Splash:** Varying splash sizes (toe dip vs full step)
- **Filtering:** Water trickling through fabric, drip into jar, satisfied "ahh"
- **Slingshot Bridge:** Branch crack (3 stages), final crash-splash, wood settle
- **Field Guide:** Page turn, pencil sketch, "aha" moment hum

### Memory Audio Vignettes (Unlockable)
- **"Creek Close-Up"** — Pure water sounds, layered (trickle, gurgle, splash, drip)
- **"Under the Willow"** — Muffled world, leaf whisper, safe hiding spot narration
- **"Still Water"** — Meditative breathing, distant frog, reflection peace
- **"Stepping Stones"** — Rhythmic stone taps, water flow, balance focus narration

---

## 🏆 Progression & Unlocks

### Completion Criteria
- **Boy:** Slingshot bridge created + Crossed creek via stones
- **Girl:** Water filtered + Plant knowledge expanded (3+ species)
- **Shared:** Reach northern vista gate (when implemented)

### What Carries Forward
- **Items:** Clean water (3 uses), filtered fabric, creek plants knowledge
- **Skills:** Balance confidence, water safety knowledge, tool versatility
- **Companion:** Dog learns "Lead" (shows path through stepping stones)
- **Memory Book:** Creek entries (4-6 new pages)

### Optional Completionism
- All stepping stone paths completed (easy, medium, hard)
- All 3 pools filtered (murky, algae, suspect)
- All 5 creek plants identified (cattails, lily, moss, ferns, + bonus)
- Both linger moments discovered (deep pool, willow rest)
- Slingshot bridge + alternate path found

---

## 🎨 Visual & Aesthetic Goals

### Planned Aesthetic
- [ ] Realistic water shader (reflections, refraction, foam at stones)
- [ ] Stepping stones (granite texture, moss gradients, wet/dry states)
- [ ] Filter station (ceramic jug, fabric bag, rock shelf)
- [ ] Willow tree (hanging branches, animated sway, root system into water)
- [ ] Creek banks (eroded earth, exposed roots, pebble scatter)
- [ ] Water plants (cattails, lilies, ferns with frond detail)
- [ ] Caustics (light dancing on stone bottoms, underwater glow)
- [ ] Dragonflies (animated, occasional landing on stones)
- [ ] Afternoon light shafts (through willow gaps, water sparkle)

### Color Palette
- **Water:** Cool blues (dark in pools, light in shallows), silver highlights
- **Stones:** Grays (granite), browns (river rock), greens (moss)
- **Plants:** Vibrant greens (ferns), deep greens (lily pads), silver-green (willow)
- **Sky Reflection:** Blue with white clouds, subtle afternoon gold
- **Earth:** Browns (mud), ochres (sand), dark greens (wet soil)

---

## 🧠 Emotional & Therapeutic Goals

### What Players Should Feel
- **Flow State:** Stepping stones create rhythm, meditation through movement
- **Patience Rewarded:** Rushing = mistakes, slow = success (therapeutic pacing lesson)
- **Adaptability:** "Water finds a way, so can I."
- **Cooperation:** Slingshot bridge = first clear "we need each other" moment
- **Calm:** Creek sounds are universally soothing (ASMR quality)
- **Mastery:** Balance skill visibly improves (wobble less over time)

### Therapeutic Elements
- **Grounding:** Water sounds scientifically reduce anxiety
- **Breath Pacing:** Stepping stone rhythm mirrors mindful breathing
- **Safe Challenge:** Failure has zero consequence (just splash, restart)
- **Skill Building:** Balance improves subtly (player feels growth)
- **Linger Rewards:** Deep pool + willow rest = forced pause (healthy)

---

## 🔗 Connections to Other Worlds

### Backward: To Woodline
- **Vista:** See forest canopy, campfire smoke
- **Return Path:** Creek flows from Woodline direction (upstream)
- **Progression:** Can return anytime (no locks)

### Forward: To Pine Trails
- **Vista:** Rocky terrain, pine slopes, golden light shift
- **Transition:** Creek narrows into stone channel, boulders form natural gate
- **Audio Bridge:** Forest ambience fades, wind through pines intensifies
- **Narrative:** "The water led us here. Now we climb."

---

## 📝 Content Checklist

### Essential (Phase 1)
- [ ] Creek terrain (banks, water plane, flow animation)
- [ ] Stepping stone system (5-stone easy path)
- [ ] Filter station (Girl interaction)
- [ ] Slingshot bridge (Boy puzzle)
- [ ] Shallow crossing tutorial
- [ ] Water shader (basic reflections)
- [ ] Boy/Girl task chains
- [ ] Spawn point (south bank)

### Nice to Have (Phase 2)
- [ ] 3-tier stepping stone challenges (easy/medium/hard)
- [ ] Plant identification (5 species)
- [ ] Deep pool linger moment
- [ ] Willow tree rest spot
- [ ] "Ask Twin" companion hints (3 scenarios)
- [ ] Woodline vista (south)
- [ ] Pine Trails vista (north)
- [ ] Audio zone system (5 creek sound types)

### Polish (Phase 3)
- [ ] Advanced water shader (caustics, foam, refraction)
- [ ] Dragonfly animations
- [ ] Stepping stone wobble physics
- [ ] Wet footprint trails (visual feedback)
- [ ] Dynamic water level (subtle rise/fall over time)
- [ ] Frog spawns (distant, animated)
- [ ] Willow branch sway (wind reactive)
- [ ] Memory Book illustrations (creek drawings)

---

## 🌟 Design Mantras

> *"Water doesn't fight—it flows around."*  
> *"Patience is the path, rushing is the splash."*  
> *"Every stone is a choice, every choice a lesson."*  
> *"We move together, even when the bridge is one stone wide."*

---

## 🔧 Technical Notes

### Water System
- **Shader:** Reflective plane with animated normal map
- **Caustics:** Projected texture on creek bed (faked but beautiful)
- **Audio:** 3D positioned sources at stone clusters (spatial realism)
- **Performance:** Single water mesh with tiling texture, <2000 tris

### Stepping Stone Physics
- **Collision:** Capsule colliders per stone (tight fit)
- **Wobble:** Simple rotation constraint (max 5° tilt)
- **Feedback:** Raycast from foot to stone, color indicator pre-step

### Asset References
- `CreekStone.glb` - Granite stepping stones (LODs)
- `WillowTree.glb` - Massive weeping willow
- `WaterPlants.glb` - Cattails, lilies, ferns
- `FilterStation.glb` - Ceramic jug, fabric, rock shelf
- *(Pending: Water shader, caustics texture, dragonfly animation)*

---

*The Creek teaches: movement is meditation, and every careful step forward is a choice to be present.*