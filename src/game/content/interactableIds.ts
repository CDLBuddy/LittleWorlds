/**
 * Interactable ID Registry - Single Source of Truth
 * All interactable IDs used across tasks and worlds
 */

export const INTERACTABLE_ID = {
  // Boot/Dev World
  AXE: 'axe_001',
  LOGPILE: 'logpile_001',
  CAMPFIRE: 'campfire',
  
  // Backyard World - Boy
  SLINGSHOT_PICKUP: 'slingshot_pickup',
  BACKYARD_TARGET: 'backyard_target',
  
  // Backyard World - Girl
  MULTITOOL_PICKUP: 'multitool_pickup',
  CARVE_STATION: 'carve_station',
  
  // Backyard World - Shared
  BACKYARD_GATE: 'backyard_gate',
  
  // Woodline World - Boy
  FLINT_PICKUP: 'flint_pickup',
  WOODLINE_CAMPFIRE: 'campfire', // Note: reuses same ID as boot campfire
  
  // Woodline World - Girl
  FIELDGUIDE_PICKUP: 'fieldguide_pickup',
  BOWDRILL_STATION: 'bowdrill_station',
  
  // Woodline World - Shared
  WOODLINE_CREEK_GATE: 'woodline_creek_gate',
  WOODLINE_BACKYARD_GATE: 'woodline_backyard_gate',
  
  // Creek World - Boy
  CREEK_SLINGSHOT_BRANCH_TARGET: 'creek_slingshot_branch_target',
  
  // Creek World - Girl
  CREEK_FILTER_STATION: 'creek_filter_station',
  
  // Creek World - Shared
  CREEK_WILLOW_REST: 'creek_willow_rest',
  CREEK_DEEP_POOL_LINGER: 'creek_deep_pool_linger',
  CREEK_NORTH_VISTA_MARKER: 'creek_north_vista_marker',
  CREEK_STONES_ENTRY: 'creek_stones_entry',
  CREEK_PINE_GATE: 'creek_pine_gate',
  CREEK_WOODLINE_GATE: 'creek_woodline_gate',
  
  // Pine World - Shared
  PINE_DUSK_GATE: 'pine_dusk_gate',
  PINE_CREEK_GATE: 'pine_creek_gate',
  
  // Dusk World - Shared
  DUSK_NIGHT_GATE: 'dusk_night_gate',
  DUSK_PINE_GATE: 'dusk_pine_gate',
  
  // Night World - Shared
  NIGHT_BEACH_GATE: 'night_beach_gate',
  NIGHT_DUSK_GATE: 'night_dusk_gate',
  
  // Beach World - Shared
  BEACH_CAMPFIRE: 'beach_campfire',
  BEACH_NIGHT_GATE: 'beach_night_gate',
} as const;

export type InteractableId = typeof INTERACTABLE_ID[keyof typeof INTERACTABLE_ID];

export const ALL_INTERACTABLE_IDS = Object.values(INTERACTABLE_ID);
