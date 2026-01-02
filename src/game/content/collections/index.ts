// src/game/content/collections/index.ts
/**
 * Collections registry - exports all area collections
 */

import { BACKYARD_COLLECTIONS } from './areas/backyard';
import { WOODLINE_COLLECTIONS } from './areas/woodline';
import { CREEKSIDE_COLLECTIONS } from './areas/creekside';
import { PINE_COLLECTIONS } from './areas/pine';
import { DUSK_COLLECTIONS } from './areas/dusk';
import { NIGHT_COLLECTIONS } from './areas/night';
import { BEACH_COLLECTIONS } from './areas/beach';
import type { AreaTemplate } from './types';

export const COLLECTIONS: Record<string, AreaTemplate> = {
  backyard: BACKYARD_COLLECTIONS,
  woodline: WOODLINE_COLLECTIONS,
  creek: CREEKSIDE_COLLECTIONS,
  pine: PINE_COLLECTIONS,
  dusk: DUSK_COLLECTIONS,
  night: NIGHT_COLLECTIONS,
  beach: BEACH_COLLECTIONS,
};

export * from './types';
export * from './template';
