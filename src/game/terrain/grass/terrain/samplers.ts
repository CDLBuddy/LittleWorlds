/**
 * Terrain conforming - Sampler utilities
 * Functions for sampling terrain height and normal at spawn time
 */

import { Ray, Vector3, type Scene } from '@babylonjs/core';
import type { GrassTerrainConform } from './types';

/**
 * Sample terrain height and normal using analytic height function
 * @param cfg - heightFn terrain configuration
 * @param x - World X position
 * @param z - World Z position
 * @returns Terrain Y height and surface normal
 */
export function sampleHeightFn(
  cfg: Extract<GrassTerrainConform, { mode: 'heightFn' }>,
  x: number,
  z: number
): { y: number; normal: Vector3 } {
  const y = cfg.heightAt(x, z);

  let normal: Vector3;

  if (cfg.normalAt) {
    // Use provided normal function
    normal = cfg.normalAt(x, z).clone().normalize();
  } else {
    // Derive normal from height function using central differences
    const eps = cfg.sampleEps ?? 0.5;
    
    const hL = cfg.heightAt(x - eps, z);
    const hR = cfg.heightAt(x + eps, z);
    const hD = cfg.heightAt(x, z - eps);
    const hU = cfg.heightAt(x, z + eps);
    
    const dx = (hR - hL) / (2 * eps);
    const dz = (hU - hD) / (2 * eps);
    
    // Normal = normalize((-dx, 1, -dz))
    normal = new Vector3(-dx, 1, -dz).normalize();
  }

  return { y, normal };
}

/**
 * Sample terrain height and normal using raycast against ground mesh
 * @param scene - Babylon scene
 * @param cfg - raycast terrain configuration
 * @param x - World X position
 * @param z - World Z position
 * @returns Terrain Y height and surface normal, or null if no hit
 */
export function sampleRaycast(
  scene: Scene,
  cfg: Extract<GrassTerrainConform, { mode: 'raycast' }>,
  x: number,
  z: number
): { y: number; normal: Vector3 } | null {
  const rayStartY = cfg.rayStartY ?? 50;
  const rayLength = cfg.rayLength ?? 200;

  const origin = new Vector3(x, rayStartY, z);
  const direction = new Vector3(0, -1, 0);
  const ray = new Ray(origin, direction, rayLength);

  // Raycast only against the ground mesh
  const pick = scene.pickWithRay(ray, (m) => m === cfg.ground);

  if (!pick || !pick.hit || !pick.pickedPoint) {
    return null;
  }

  const y = pick.pickedPoint.y;
  const normal = pick.getNormal(true) ?? Vector3.Up();
  normal.normalize();

  return { y, normal };
}
