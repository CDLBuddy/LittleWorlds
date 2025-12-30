/**
 * World Manifests - Declares which interactables each world implements
 * Used for content validation to ensure all task targetIds are implemented
 */

import type { AreaId } from '@game/content/areas';
import type { InteractableId } from '@game/content/interactableIds';

export type WorldManifest = {
  areaId: AreaId;
  interactables: readonly InteractableId[];
};

// Import world-specific interactable lists
import { BOOT_INTERACTABLES } from './BootWorld';
import { BACKYARD_INTERACTABLES } from './backyard/BackyardWorld';
import { WOODLINE_INTERACTABLES } from './woodline/WoodlineWorld';
import { CREEK_INTERACTABLES } from './creek/CreekWorld';

export const WORLD_MANIFESTS: Record<AreaId, WorldManifest> = {
  backyard: {
    areaId: 'backyard',
    interactables: BACKYARD_INTERACTABLES,
  },
  woodline: {
    areaId: 'woodline',
    interactables: WOODLINE_INTERACTABLES,
  },
  creek: {
    areaId: 'creek',
    interactables: CREEK_INTERACTABLES,
  },
};

// Boot world is not an area, but we can export it for validation if needed
export const BOOT_MANIFEST: WorldManifest = {
  areaId: 'backyard' as AreaId, // Boot uses backyard as fallback
  interactables: BOOT_INTERACTABLES,
};
