// src/game/systems/sky/createPanoramaSky.ts
import { Color3, Mesh, Scene, Texture } from '@babylonjs/core';
import { PhotoDome } from '@babylonjs/core/Helpers/photoDome';

export type PanoramaSkyOptions = {
  /** URL relative to site root, e.g. "assets/sky/backyard/sky.png" */
  url: string;

  /** Dome size. Default 1200. */
  size?: number;

  /** Dome tessellation/resolution. Default 32. */
  segments?: number;

  /** Rotate the sky around Y (radians). Default 0. */
  rotationY?: number;

  /** Render group id. Default 0 (render behind). */
  renderingGroupId?: number;

  /** If true, disables depth write for the dome material. Default true. */
  disableDepthWrite?: boolean;

  /** Optional tint multiplier. Default null (no tint). */
  tint?: Color3 | null;

  /** Material alpha. Default 1. */
  alpha?: number;

  /**
   * Whether to clamp UV edges (recommended for panoramas).
   * Default true to avoid seam wrapping artifacts.
   */
  clamp?: boolean;

  /**
   * Optional unique name suffix (helps debugging / avoids duplicate names).
   * Default auto-generated.
   */
  name?: string;
};

export type PanoramaSkyHandle = {
  mesh: Mesh;
  texture: Texture;
  setRotationY(rad: number): void;
  setAlpha(alpha: number): void;
  setTint(tint: Color3 | null): void;
  dispose(): void;
};

function isAbsoluteUrl(url: string) {
  // http(s)://, //cdn, data:, blob:
  return /^(https?:)?\/\/|^data:|^blob:/i.test(url);
}

function withBase(url: string) {
  // Vite deploy-safe base path (works on GitHub Pages / subpath deploy)
  const base = import.meta.env.BASE_URL ?? '/';

  // If already absolute or root-relative, don't touch it.
  if (isAbsoluteUrl(url) || url.startsWith('/')) return url;

  // Normalize: avoid double slashes and "./"
  const baseNorm = base.endsWith('/') ? base : `${base}/`;
  const urlNorm = url.replace(/^\.?\//, '');

  return `${baseNorm}${urlNorm}`;
}

// Minimal “material-like” surface we need. PhotoDome uses an internal material,
// but alpha/emissiveColor/disableDepthWrite are the knobs we care about.
type DomeMaterialLike = {
  alpha?: number;
  emissiveColor?: Color3;
  disableDepthWrite?: boolean;
} | null;

function getDomeMaterialLike(mesh: Mesh): DomeMaterialLike {
  const mat = mesh.material;
  if (!mat) return null;

  // We intentionally only touch fields if they exist.
  const maybe = mat as unknown as DomeMaterialLike;
  return maybe ?? null;
}

/**
 * Creates a sky dome that maps an equirectangular panorama (2:1).
 * Uses Babylon's PhotoDome to avoid UV/inversion headaches.
 */
export function createPanoramaSky(scene: Scene, opts: PanoramaSkyOptions): PanoramaSkyHandle {
  const size = opts.size ?? 1200;
  const segments = opts.segments ?? 32;
  const renderingGroupId = opts.renderingGroupId ?? 0;
  const disableDepthWrite = opts.disableDepthWrite ?? true;
  const clamp = opts.clamp ?? true;

  const texUrl = withBase(opts.url);

  const domeName = opts.name ? `skyDome_${opts.name}` : `skyDome_${Date.now()}`;

  const photoDome = new PhotoDome(
    domeName,
    texUrl,
    {
      resolution: segments,
      size,
      // Babylon’s recommended mode for equirectangular panoramas.
      useDirectMapping: false,
    },
    scene
  );

  // Core behavior: sky follows the camera position.
  photoDome.mesh.infiniteDistance = true;

  // Background ordering.
  photoDome.mesh.renderingGroupId = renderingGroupId;

  // Apply rotation (must not skip 0).
  if (opts.rotationY !== undefined) {
    photoDome.mesh.rotation.y = opts.rotationY;
  }

  // Texture polish
  const tex = photoDome.photoTexture;

  if (clamp) {
    tex.wrapU = Texture.CLAMP_ADDRESSMODE;
    tex.wrapV = Texture.CLAMP_ADDRESSMODE;
  }

  // Slight quality bump without going crazy.
  // (Safe even if anisotropy is ignored on some devices.)
  tex.anisotropicFilteringLevel = Math.max(tex.anisotropicFilteringLevel ?? 0, 2);

  // Material polish (no "any"; only touch fields if they exist)
  const applyMaterialTweaks = () => {
    const mat = getDomeMaterialLike(photoDome.mesh);
    if (!mat) return;

    if (disableDepthWrite !== undefined) {
      mat.disableDepthWrite = disableDepthWrite;
    }

    if (opts.tint !== undefined) {
      if (opts.tint) mat.emissiveColor = opts.tint;
      // If null, we leave emissiveColor as-is (don’t guess defaults).
    }

    if (opts.alpha !== undefined) {
      mat.alpha = opts.alpha;
    }
  };

  applyMaterialTweaks();

  if (import.meta.env.DEV) {
    // Helpful, but keeps prod console clean.
    // es lint-disable-next-line no-console
    console.log('[PanoramaSky] PhotoDome created:', { domeName, texUrl, size, segments });
  }

  return {
    mesh: photoDome.mesh,
    texture: tex,

    setRotationY(rad: number) {
      photoDome.mesh.rotation.y = rad;
    },

    setAlpha(alpha: number) {
      const mat = getDomeMaterialLike(photoDome.mesh);
      if (mat) mat.alpha = alpha;
    },

    setTint(tint: Color3 | null) {
      const mat = getDomeMaterialLike(photoDome.mesh);
      if (!mat) return;
      if (tint) mat.emissiveColor = tint;
      // If null, leave it alone (don’t surprise the look).
    },

    dispose() {
      photoDome.dispose();
    },
  };
}
