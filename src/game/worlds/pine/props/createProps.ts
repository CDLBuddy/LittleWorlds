/**
 * Pine World - Props orchestrator
 */

import type { Scene } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core';
import type { TerrainSamplerWithBounds } from '../../../terrain/terrainSampler';
import type { DisposableBag } from '../utils/DisposableBag';
import type { MaterialCache } from '../utils/MaterialCache';
import { createCairn } from './cairn';
import { createLanternStation } from './lanternStation';
import { createLogBench } from './logBench';
import { createPineBoughHut } from './pineBoughHut';
import { createPineconeTotem } from './pineconeTotem';
import { createRockyOutcrop } from './rockyOutcrop';
import { createScatteredPinecones } from './scatteredPinecones';
import { createTrappersCache } from './trappersCache';

export function createProps(scene: Scene, bag: DisposableBag, mats: MaterialCache, sampler: TerrainSamplerWithBounds) {
  // Trailhead cairn
  createCairn(scene, bag, mats, new Vector3(0, sampler.heightAt(0, 60), 60));

  // Overlook rock cluster
  createRockyOutcrop(scene, bag, mats, new Vector3(12, sampler.heightAt(12, 0), 0), sampler);

  // Lantern station platform
  createLanternStation(scene, bag, mats, new Vector3(5, sampler.heightAt(5, -10), -10));

  // Cache
  createTrappersCache(scene, bag, mats, new Vector3(-10, sampler.heightAt(-10, -15), -15));

  // Simple workbench log
  createLogBench(scene, bag, mats, new Vector3(2, sampler.heightAt(2, -5) + 0.2, -5));

  // Shelter
  createPineBoughHut(scene, bag, mats, new Vector3(-10, sampler.heightAt(-10, -18), -18));

  // Totem
  createPineconeTotem(scene, bag, mats, new Vector3(0, sampler.heightAt(0, -28), -28));

  // Pinecones (Phase 8: pass sampler)
  createScatteredPinecones(scene, bag, mats, sampler);

  return true;
}
