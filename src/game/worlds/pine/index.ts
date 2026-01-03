/**
 * Pine World - Module exports barrel
 * 
 * Clean single-import entry point for PineWorld.ts
 */

// Main orchestrators
export { createTerrain } from './terrain/createTerrain';
export { createTerrainGuards } from './terrain/createTerrainGuards';
export { createTrailRibbon } from './trail/createTrailRibbon';
export { createForest } from './forest/createForest';
export { createProps } from './props/createProps';
export { createMarkers } from './markers/createMarkers';
export { createGateInteractable } from './interactables/createGate';

// Config & constants
export * from './config/constants';
export * from './config/interactables';

// Types
export * from './types';

// Utils (exported for potential reuse by other worlds)
export { DisposableBag } from './utils/DisposableBag';
export { MaterialCache } from './utils/MaterialCache';
export { withBase } from './utils/paths';
export { atTerrain, getElevationAtZ } from './utils/terrain';
