/**
 * Grass field factory
 * Reusable orchestrator for loading, placing, and animating grass instances
 */

import { TransformNode, Vector3, Mesh } from '@babylonjs/core';
import type { Scene, AssetContainer, AbstractMesh } from '@babylonjs/core';
import type { GrassFieldConfig, GrassFieldResult } from './types';
import { resolveTemplateMesh } from './asset/resolveTemplateMesh';
import { buildGridPositions } from './placement/grid';
import { isExcludedXZ } from './placement/zones';
import { applyGrassWindToMesh } from './applyGrassWind';
import { sampleHeightFn, sampleRaycast } from './terrain/samplers';
import { rotationFromUpToNormalWithYaw } from './terrain/align';
import { hashSeed, mulberry32 } from './placement/rng';

/**
 * Dependency injection interface for createGrassField
 * Allows worlds to provide their own asset loading implementation
 */
export interface CreateGrassFieldDeps {
  /** Asset container loader (world-specific) */
  loadContainer: (args: {
    scene: Scene;
    url: string;
    getIsAlive: () => boolean;
  }) => Promise<AssetContainer>;
  /** Lifecycle check callback */
  getIsAlive: () => boolean;
}

/**
 * Create a grass field with grid-based placement and wind animation
 * 
 * Features:
 * - Loads grass asset via provided loader
 * - Resolves template mesh (configurable strategy)
 * - Creates instances on grid with exclusion zones
 * - Applies wind animation plugin
 * - Returns all created objects for caller management
 * 
 * Phase B scope:
 * - Grid placement only (no terrain conform, density maps)
 * - Standard instancing via createInstance (no thin instances)
 * - No caching, no LOD tiers
 * 
 * @param scene - Babylon scene
 * @param cfg - Grass field configuration
 * @param deps - Dependency injection (loader, lifecycle)
 * @returns Grass field result with parent, instances, template, container
 */
export async function createGrassField(
  scene: Scene,
  cfg: GrassFieldConfig,
  deps: CreateGrassFieldDeps
): Promise<GrassFieldResult> {
  const debug = cfg.debug?.log && import.meta.env.DEV;

  // Step 1: Create parent TransformNode
  const parent = new TransformNode(cfg.parentName ?? 'grassField', scene);
  parent.position = Vector3.Zero();

  if (debug) {
    console.log(`[createGrassField] Creating grass field: ${cfg.parentName ?? 'grassField'}`);
  }

  // Step 2: Load AssetContainer
  const container = await deps.loadContainer({
    scene,
    url: cfg.assetUrl,
    getIsAlive: deps.getIsAlive,
  });

  if (debug) {
    console.log(`[createGrassField] Loaded asset: ${cfg.assetUrl} (${container.meshes.length} meshes)`);
  }

  // Step 3: Resolve template mesh
  const templateMesh = resolveTemplateMesh(container.meshes, cfg.template);

  if (debug) {
    console.log(`[createGrassField] Resolved template mesh: ${templateMesh.name}`);
  }

  // Step 4: Apply wind animation if configured
  if (cfg.wind) {
    applyGrassWindToMesh(templateMesh, cfg.wind);

    if (debug) {
      console.log(`[createGrassField] Applied wind animation to template`);
    }
  }

  // Step 5: Disable template mesh (instances will render)
  templateMesh.setEnabled(false);

  // Step 6: Verify template is instantiable (is a Mesh with createInstance)
  if (!(templateMesh instanceof Mesh)) {
    throw new Error(
      `[createGrassField] Template mesh "${templateMesh.name}" is not instantiable. ` +
      `Expected Mesh with createInstance, got: ${templateMesh.constructor.name}`
    );
  }

  // Step 7: Build grid positions
  const gridPositions = buildGridPositions(cfg.placement);

  if (debug) {
    console.log(`[createGrassField] Built ${gridPositions.length} grid positions`);
  }

  // Step 8: Log terrain conforming mode (if enabled)
  if (debug && cfg.terrain) {
    console.log(`[createGrassField] Terrain conforming enabled: mode="${cfg.terrain.mode}"`);
  }

  // Step 9: Setup RNG if needed (Phase E)
  const needsRNG = !!(
    cfg.placement.jitter ||
    (cfg.budget && cfg.budget.density !== undefined && cfg.budget.density < 1) ||
    (cfg.budget && cfg.budget.maxInstances !== undefined)
  );

  const rng = needsRNG 
    ? mulberry32(hashSeed(cfg.placement.random?.seed))
    : null;

  // Step 10: Filter candidates (exclusion + density)
  type Candidate = { i: number; j: number; x: number; z: number };
  const candidates: Candidate[] = [];
  let excludedCount = 0;

  const density = cfg.budget?.density !== undefined
    ? Math.max(0, Math.min(1, cfg.budget.density))
    : 1;

  for (const pos of gridPositions) {
    // Check exclusion zones
    if (isExcludedXZ(pos.x, pos.z, cfg.zones)) {
      excludedCount++;
      continue;
    }

    // Apply density filter (Phase E)
    if (density < 1 && rng) {
      if (rng() > density) {
        continue;
      }
    }

    candidates.push(pos);
  }

  if (debug) {
    console.log(
      `[createGrassField] Candidates: ${candidates.length} ` +
      `(excluded: ${excludedCount}, density: ${density.toFixed(2)})`
    );
  }

  // Step 11: Apply maxInstances cap (Phase E)
  const maxInstances = cfg.budget?.maxInstances;
  let finalCandidates = candidates;

  if (maxInstances !== undefined && candidates.length > maxInstances) {
    // Fisher-Yates shuffle with seeded RNG
    const shuffled = [...candidates];
    if (rng) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    finalCandidates = shuffled.slice(0, maxInstances);

    if (debug) {
      console.log(`[createGrassField] Capped to ${maxInstances} instances`);
    }
  }

  // Step 12: Create instances
  const instances: AbstractMesh[] = [];

  for (const pos of finalCandidates) {
    // Create instance
    const instance = templateMesh.createInstance(`grass_${pos.i}_${pos.j}`);
    
    // Set base position (use offsetY to prevent z-fighting with ground plane)
    const yOffset = cfg.placement.offsetY ?? 0;
    let finalX = pos.x;
    let finalZ = pos.z;

    // Apply position jitter (Phase C/E - seeded if RNG provided)
    const jitterPos = cfg.placement.jitter?.position;
    if (jitterPos) {
      const xzAmount = typeof jitterPos === 'number' ? jitterPos : jitterPos.xz; // Backward compat
      if (xzAmount > 0) {
        if (rng) {
          // Seeded jitter (Phase E)
          finalX += (rng() * 2 - 1) * xzAmount;
          finalZ += (rng() * 2 - 1) * xzAmount;
        } else {
          // Legacy fallback (Math.random for old configs)
          finalX += (Math.random() * 2 - 1) * xzAmount;
          finalZ += (Math.random() * 2 - 1) * xzAmount;
        }
      }
    }

    // Determine Y position and rotation based on terrain conforming mode
    let finalY = yOffset;
    let terrainNormal: Vector3 | null = null;

    if (cfg.terrain && cfg.terrain.mode !== 'none') {
      if (cfg.terrain.mode === 'heightFn') {
        const sample = sampleHeightFn(cfg.terrain, finalX, finalZ);
        finalY = sample.y + (cfg.terrain.yOffset ?? 0); // Phase E: yOffset polish
        if (cfg.terrain.alignToNormal ?? true) {
          terrainNormal = sample.normal;
        }
      } else if (cfg.terrain.mode === 'raycast') {
        const sample = sampleRaycast(scene, cfg.terrain, finalX, finalZ);
        if (sample) {
          finalY = sample.y + (cfg.terrain.yOffset ?? 0); // Phase E: yOffset polish
          if (cfg.terrain.alignToNormal ?? true) {
            terrainNormal = sample.normal;
          }
        } else {
          // Raycast failed, use default Y offset
          finalY = yOffset;
        }
      }
    }

    instance.position.set(finalX, finalY, finalZ);

    // Apply scale jitter (Phase E - before scaleY override)
    const jitterScale = cfg.placement.jitter?.scale;
    if (jitterScale) {
      const s = rng
        ? jitterScale.min + rng() * (jitterScale.max - jitterScale.min)
        : jitterScale.min + Math.random() * (jitterScale.max - jitterScale.min);
      instance.scaling.setAll(s);
    }

    // Apply Y-axis scaling if configured (overrides Y from uniform scale)
    if (cfg.placement.scaleY !== undefined) {
      instance.scaling.y = cfg.placement.scaleY;
    }

    // Determine yaw rotation (seeded jitter or global rotation)
    let yawRad = cfg.placement.rotationY ?? 0;
    const jitterRot = cfg.placement.jitter?.rotationY;
    if (jitterRot) {
      const radAmount = typeof jitterRot === 'number' ? jitterRot : jitterRot.rad; // Backward compat
      if (radAmount > 0) {
        if (rng) {
          // Seeded jitter (Phase E)
          yawRad += (rng() * 2 - 1) * radAmount;
        } else {
          // Legacy fallback
          yawRad += (Math.random() * 2 - 1) * radAmount;
        }
      }
    }

    // Apply rotation (quaternion if terrain conforming, euler otherwise)
    if (terrainNormal) {
      // Phase E: Apply normal blend and max tilt
      let finalNormal = terrainNormal.clone();
      const terrain = cfg.terrain;
      const normalBlend = (terrain && 'normalBlend' in terrain ? terrain.normalBlend : undefined) ?? 1;
      const maxTiltDeg = terrain && 'maxTiltDeg' in terrain ? terrain.maxTiltDeg : undefined;

      if (normalBlend < 1) {
        // Blend toward vertical
        finalNormal = Vector3.Lerp(Vector3.Up(), terrainNormal, normalBlend).normalize();
      }

      if (maxTiltDeg !== undefined && maxTiltDeg > 0) {
        // Clamp tilt angle
        const up = Vector3.Up();
        const dot = Vector3.Dot(up, finalNormal);
        const tiltRad = Math.acos(Math.max(-1, Math.min(1, dot)));
        const tiltDeg = tiltRad * (180 / Math.PI);

        if (tiltDeg > maxTiltDeg) {
          // Lerp from Up toward finalNormal by maxTiltDeg/tiltDeg (approximate)
          const t = maxTiltDeg / tiltDeg;
          finalNormal = Vector3.Lerp(up, finalNormal, t).normalize();
        }
      }

      // Align to (possibly adjusted) terrain normal while preserving yaw
      instance.rotationQuaternion = rotationFromUpToNormalWithYaw(finalNormal, yawRad);
    } else {
      // Use standard euler rotation (no terrain conforming)
      instance.rotation.y = yawRad;
    }

    // Grass is not interactive
    instance.isPickable = false;

    // Parent to grass field
    instance.parent = parent;

    instances.push(instance);
  }

  if (debug) {
    console.log(`[createGrassField] Created ${instances.length} instances`);
  }

  // Step 13: Return result
  return {
    parent,
    instances,
    templateMesh,
    container,
  };
}
