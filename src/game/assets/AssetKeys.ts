/**
 * Canonical asset keys - no string soup!
 */

// Model keys that match manifest
export const MODEL_KEYS = {
  BOY: 'boy',
  DOG: 'dog'
} as const;

export const AssetKeys = {
  Models: {
    PLAYER_TWIN: 'models/player_twin.glb',
    COMPANION_DOG: 'models/companion_dog.glb',
    COMPANION_CAT: 'models/companion_cat.glb',
    CAMPFIRE: 'models/campfire.glb',
    TENT: 'models/tent.glb',
    AXE: 'models/axe.glb',
    LOGS: 'models/logs.glb',
  },
  Textures: {
    GROUND_FOREST: 'textures/ground_forest.png',
    GROUND_BEACH: 'textures/ground_beach.png',
    UI_BUTTON: 'textures/ui_button.png',
  },
  Audio: {
    MUSIC_FOREST: 'audio/music_forest.ogg',
    SFX_FOOTSTEP: 'audio/sfx_footstep.ogg',
    SFX_PICKUP: 'audio/sfx_pickup.ogg',
    AMB_BIRDS: 'audio/amb_birds.ogg',
    AMB_CREEK: 'audio/amb_creek.ogg',
  },
  Data: {
    FOREST_WORLD: 'data/forest_world.json',
    ITEMS: 'data/items.json',
    TASKS: 'data/tasks.json',
  },
} as const;
