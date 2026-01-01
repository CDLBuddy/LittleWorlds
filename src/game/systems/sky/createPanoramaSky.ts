import {
  Color3,
  Mesh,
  Scene,
  Texture,
} from '@babylonjs/core';
import { PhotoDome } from '@babylonjs/core/Helpers/photoDome';

export type PanoramaSkyOptions = {
  /** URL relative to site root, e.g. "assets/sky/backyard/FS003_Day.png" */
  url: string;

  /** Sphere diameter. Large but not insane. Default 1200. */
  size?: number;

  /** Sphere tessellation. Default 32. (Mobile friendly) */
  segments?: number;

  /** Rotate the sky around Y (radians). Default 0. */
  rotationY?: number;

  /** Render group id. Default 0 (render behind). */
  renderingGroupId?: number;

  /** If true, depth write disabled (prevents horizon fighting). Default true. */
  disableDepthWrite?: boolean;

  /** Optional tint multiplier for vibe shifts. Default null (no tint). */
  tint?: Color3 | null;

  /** Material alpha. Default 1. */
  alpha?: number;

  /**
   * Whether to clamp UV edges (recommended).
   * Default true to avoid seam wrapping artifacts.
   */
  clamp?: boolean;
};

export type PanoramaSkyHandle = {
  mesh: Mesh;
  texture: Texture;
  setRotationY(rad: number): void;
  setAlpha(alpha: number): void;
  dispose(): void;
};

function withBase(url: string) {
  // Vite deploy-safe base path (works on GitHub pages / subpath deploy)
  const base = import.meta.env.BASE_URL ?? '/';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
  return `${base}${url}`;
}

/**
 * Creates an inverted sky dome that maps an equirectangular panorama (2:1).
 * Best for painted/anime skies; no cube seams; quick iteration.
 */
export function createPanoramaSky(scene: Scene, opts: PanoramaSkyOptions): PanoramaSkyHandle {
  const size = opts.size ?? 1200;

  const texUrl = withBase(opts.url);
  
  // Use PhotoDome for proper equirectangular panorama display
  const photoDome = new PhotoDome(
    'skyDome',
    texUrl,
    {
      resolution: opts.segments ?? 32,
      size: size,
      useDirectMapping: false,
    },
    scene
  );

  photoDome.mesh.infiniteDistance = true;
  photoDome.mesh.renderingGroupId = opts.renderingGroupId ?? 0;
  
  if (opts.rotationY) {
    photoDome.mesh.rotation.y = opts.rotationY;
  }

  // Access the texture and material for additional control
  const material = photoDome.mesh.material as any;
  if (material && opts.tint) {
    material.emissiveColor = opts.tint;
  }
  
  if (opts.alpha !== undefined && material) {
    material.alpha = opts.alpha;
  }

  console.log('[PanoramaSky] Created PhotoDome with texture:', texUrl);

  return {
    mesh: photoDome.mesh,
    texture: photoDome.photoTexture,
    setRotationY(rad: number) {
      photoDome.mesh.rotation.y = rad;
    },
    setAlpha(alpha: number) {
      if (material) {
        material.alpha = alpha;
      }
    },
    dispose() {
      photoDome.dispose();
    },
  };
}
