# 📋 Documentation Overview

This document provides a guide to all the README files and design documentation created for Little Worlds.

---

## 🗺️ World README Files

Each world has a comprehensive README documenting its vision, atmosphere, mechanics, and content plans.

### Existing Worlds (Implementation Started)

#### [🏡 Backyard](../src/game/worlds/backyard/README.md)
**Time:** Morning / Sunrise  
**Theme:** Safety → Curiosity  
**Key Features:**
- Tutorial area that doesn't feel like a tutorial
- Tool acquisition (slingshot, multitool)
- Toy soldier collectibles (10 total)
- Vista to Woodline through backgate
- Morning warmth and suburban comfort

#### [🌲 Woodline](../src/game/worlds/woodline/README.md)
**Time:** Late Morning / Midday  
**Theme:** Confidence → Skill  
**Key Features:**
- First real campsite ritual (shared campfire)
- Dual fire-lighting paths (Boy: sparks, Girl: bowdrill)
- Field guide introduction (plant identification)
- Vista back to Backyard, forward to Creek
- Forest confidence building

---

### New Worlds (Ready for Implementation)

#### [💧 Creek](../src/game/worlds/creek/README.md)
**Time:** Afternoon  
**Theme:** Flow → Patience  
**Key Features:**
- Stepping stone navigation (balance mechanics)
- Water filtering (Girl's knowledge skill)
- Slingshot bridge puzzle (Boy's cooperation)
- "Ask Twin" mechanic introduction
- Meditative water sounds (0.2 Hz relaxation)

#### [🌲 Pine Trails](../src/game/worlds/pine/README.md)
**Time:** Late Afternoon / Early Golden Hour  
**Theme:** Preparation → Anticipation  
**Key Features:**
- Uphill trail navigation (switchbacks, cairns)
- Sap collection (Boy gathering mechanic)
- Lantern crafting (Girl + Boy convergence)
- Trail-finding without minimap
- Time shift toward evening

#### [✨ Dusk Firefly](../src/game/worlds/dusk/README.md)
**Time:** Golden Hour → Twilight  
**Theme:** Beauty → Stillness  
**Key Features:**
- **Linger Mode showcase** (stillness reveals beauty)
- Firefly pattern collection (ethical catch-and-release)
- Photography introduction (Memory Capture)
- No required tasks (pure experience)
- Therapeutic pacing mastery

#### [⭐ Night Stars](../src/game/worlds/night/README.md)
**Time:** Deep Night / 10 PM - Midnight  
**Theme:** Navigation → Calm  
**Key Features:**
- Constellation tracing (Boy navigation skill)
- Night-blooming flowers (Girl botany)
- Lantern navigation (light management)
- Audio landmark orientation
- Darkness becomes friend

#### [🌊 Beach](../src/game/worlds/beach/README.md)
**Time:** Dawn *OR* Moonlit Midnight  
**Theme:** Completion → Reflection  
**Key Features:**
- Journey's end (memory landmark)
- Memory cairn building (Boy's ritual)
- Tide pool observation (Girl's final lesson)
- Optional final campfire
- Wave rhythm (12 bpm therapeutic breathing)

---

## 📖 Core Design Documents

### [🌍 Game Vision Document](../docs/game-vision.md)
**Comprehensive design philosophy and roadmap**

**Contents:**
- Core design pillars (5 foundational principles)
- Journey arc (Backyard → Beach progression)
- Companion & twin mechanics (locks, boosts, bridges)
- Vista system (worlds that see each other)
- Inventory & progression systems
- Collectibles philosophy
- Audio as emotional anchor
- Therapeutic design principles
- Build order (avoiding feature pile)
- Success metrics (not traditional KPIs)

---

## 🎯 Key Concepts Explained

### Vista System
Lightweight distant proxies of neighboring worlds:
- **In Backyard:** See Woodline trees through backgate
- **In Woodline:** See Backyard house silhouette behind
- **Technical:** <1000 tris, no collision, audio bleed zones
- **Goal:** Worlds feel connected, not isolated levels

### Linger Mode
Stillness unlocks content:
- Fireflies approach when you stop moving
- Stars become clearer after 30 seconds
- Audio layers add depth with patience
- **Not a button**—just stop and observe
- **Design:** Teaches mindfulness through gameplay

### Companion Reliance
Soft interdependence without frustration:
- **Locks:** Rare story beats (1-2 per world)
- **Boosts:** Common enhancements (fire starts faster)
- **Bridges:** Optional side paths (secrets, collectibles)
- **"Ask Twin" button:** One-button cooperation, zero menus

### Memory Book
Not a quest log—a scrapbook:
- Flora & fauna entries (plant/animal IDs)
- Skills (fire-making, knots, constellations)
- Trinkets (toy soldiers, shells, collectibles)
- Moments (linger spots, photos, synergy events)
- Audio vignettes (unlockable ASMR soundscapes)

---

## 🎨 World Design Patterns

### Each World Includes:

#### Atmosphere Section
- Time of day
- Mood and emotional goals
- Color palette
- Lighting details
- Audio landscape (5-6 layers)

#### Layout & Points of Interest
- Play area size and structure
- 8-12 key locations with details
- Entry/exit points
- Vista descriptions (what you see looking back/ahead)

#### Gameplay Features
- Core mechanics (2-4 new systems)
- Boy role tasks
- Girl role tasks
- Optional content (linger moments, collectibles)

#### Vista System Details
- Looking back (previous world)
- Looking ahead (next world)
- Technical implementation notes

#### Audio Design
- Ambient layers (5-6 types)
- Interactive sounds (8-10 types)
- Memory audio vignettes (3-5 unlockable)

#### Progression & Unlocks
- Completion criteria
- What carries forward (items, skills, abilities)
- Optional completionism checklist

#### Emotional & Therapeutic Goals
- What players should feel
- Therapeutic elements embedded
- Teaching moments

#### Content Checklist
- Essential (Phase 1)
- Nice to Have (Phase 2)
- Polish (Phase 3)

---

## 📊 Progression Flow

```
Backyard
├─ Tools: Slingshot, Multitool
├─ Items: Steel balls, String, Carved token
└─ Skills: Tool use basics

Woodline
├─ Tools: (Keep previous)
├─ Items: Flint, Field guide
└─ Skills: Fire-making (2 methods)

Creek
├─ Tools: (Keep previous)
├─ Items: Clean water, Filtered materials
└─ Skills: Balance, Water safety, Patience

Pine Trails
├─ Tools: + Lantern (NEW), Compass
├─ Items: Sap, Wire, Wick materials
└─ Skills: Navigation, Uphill climbing, Gathering

Dusk Firefly
├─ Tools: (Keep all)
├─ Items: Firefly knowledge, Wildflowers
└─ Skills: Stillness mastery, Memory Capture

Night Stars
├─ Tools: (Keep all)
├─ Items: Constellation knowledge, Night flowers, Scents
└─ Skills: Star navigation, Night confidence

Beach
├─ Tools: (Keep all)
├─ Items: Shells, Sea glass, Memory stones
└─ Skills: Reflection, Completion, Cycle understanding
```

---

## 🎵 Audio Philosophy

### Signature Sounds Per World

- **Backyard:** Morning birds, suburban quiet, grass rustle
- **Woodline:** Forest breeze, campfire crackle, woodpecker
- **Creek:** Water babble (therapeutic 0.2 Hz), stepping stone thunks
- **Pine:** Wind through needles, pine creak, cone drops
- **Dusk:** Cricket symphony, firefly hum (barely audible)
- **Night:** Near-silence, owl hoots, celestial hum
- **Beach:** Ocean waves (12 bpm breathing sync)

### Audio Vignettes (Unlockable)

**Purpose:** Reward stillness with pure ASMR-quality audio

**Examples:**
- "Creek Close-Up" — Layered water (trickle, gurgle, splash, drip)
- "Wind in Pine" — Needle whisper, hawk cry, elevation
- "Firefly Dance" — Wing flutter, glow hum, meditation
- "Journey's End" — All worlds remembered, gratitude

---

## 🧠 Therapeutic Design Elements

### Embedded Throughout

1. **Grounding:** Sensory focus (water sounds, grass texture)
2. **Breath Pacing:** Wave/cricket rhythm syncs with breathing
3. **Safe Challenge:** Failure = splash/restart, no punishment
4. **Patience Rewarded:** Rushed play harder, slow play richer
5. **Darkness Gradual:** By Night world, player is ready
6. **Mastery Visible:** Skills improve (wobble less, aim better)

### Target Outcomes

**Children should feel:**
- Capable (I can navigate, make fire, identify plants)
- Patient (Beauty happened when I waited)
- Safe in dark (Night became friend)
- Respectful (Observe, don't exploit nature)

---

## 🛠️ Implementation Priorities

### Current State (Phase 1)
✅ Backyard fully implemented  
✅ Woodline fully implemented  
✅ Tool pickup and use working  
✅ Basic companion presence  
✅ Task progression system  

### Next Steps (Phase 2)
1. **Companion Depth**
   - "Ask Twin" interaction system
   - Background loops (whittling, practicing)
   - Intervention moments
   
2. **First Collectible**
   - Toy soldier quest (Backyard + future worlds)
   - Bag inventory UI
   
3. **Memory Book Foundation**
   - Entry logging system
   - 1-2 audio vignettes

### Medium Term (Phase 3-4)
- Vista system (Backyard ↔ Woodline proxies)
- Audio bleed zones
- Creek world implementation
- Pine Trails + lantern crafting

### Long Term (Phase 5-6)
- Dusk Firefly (Linger Mode showcase)
- Night Stars (constellation system)
- Beach (completion world)
- Full polish pass

---

## 📁 File Locations

```
Little Worlds/
├─ docs/
│  ├─ game-vision.md (THIS IS THE MAIN DESIGN DOC)
│  ├─ DOCUMENTATION_OVERVIEW.md (you are here)
│  └─ [other phase docs...]
│
└─ src/game/worlds/
   ├─ backyard/
   │  ├─ README.md (Backyard world design)
   │  └─ BackyardWorld.ts (implementation)
   │
   ├─ woodline/
   │  ├─ README.md (Woodline world design)
   │  └─ WoodlineWorld.ts (implementation)
   │
   ├─ creek/
   │  └─ README.md (Creek world design - NOT YET IMPLEMENTED)
   │
   ├─ pine/
   │  └─ README.md (Pine Trails design - NOT YET IMPLEMENTED)
   │
   ├─ dusk/
   │  └─ README.md (Dusk Firefly design - NOT YET IMPLEMENTED)
   │
   ├─ night/
   │  └─ README.md (Night Stars design - NOT YET IMPLEMENTED)
   │
   └─ beach/
      └─ README.md (Beach design - NOT YET IMPLEMENTED)
```

---

## 🌟 Design Mantras (Quick Reference)

> *"The forest remembers you."*

> *"Beauty doesn't rush, and neither should you."*

> *"Night is not empty—it's full of stars."*

> *"Magic happens in the spaces between doing."*

> *"You carry the light. Darkness bows to you."*

> *"The ocean says: You walked far. Rest now."*

---

## 💡 When Designing New Content

**Ask these questions:**

1. Does this teach patience or punish it?
2. Does this make stillness valuable or boring?
3. Does this respect young intelligence or talk down?
4. Does this feel like discovery or chore?
5. Would a 6-year-old find this magical or stressful?

**If any answer is wrong, redesign.**

---

## 🎯 The North Star

**"Does the game teach children that stillness has value?"**

If a 6-year-old sits by the fireflies for 2 minutes without prompting, **we succeeded**.

---

*This is your compass through the documentation. Start with [game-vision.md](../docs/game-vision.md) for the full philosophy, then dive into individual world READMEs as you implement each area.*

*Each README is comprehensive enough to guide implementation without constant reference to the main doc—but they all align with the core vision.*

**Now go build something beautiful. The forest is waiting.**