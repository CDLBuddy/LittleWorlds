// src/game/systems/sky/BillboardCloudSystem.ts
import {
  Color3,
  Constants,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '@babylonjs/core';
import type { BillboardCloudsConfig } from './skyPresets';

type Cloud = {
  mesh: Mesh;
  vel: Vector3;
  baseAlpha: number;
  fadeT: number;
  fadeInSec: number;
};

type RequiredCfg = Required<
  Omit<BillboardCloudsConfig, 'windDir' | 'brightness' | 'tint' | 'renderingGroupId'>
> & {
  windDir: { x: number; z: number };
  brightness: number;
  tint: { r: number; g: number; b: number };

  /**
   * NOTE: We intentionally DO NOT honor renderingGroupId for clouds.
   * Clouds are a background FX layer and must never draw over world geometry.
   */
  renderingGroupId: number;
};

// Hard guarantee: clouds are background.
// If you ever want “foreground fog puffs”, make a separate system.
const CLOUD_RENDER_GROUP_ID = 0;

// Ensure clouds sort BEFORE other transparent meshes (grass cards, leaves, UI planes, etc.)
const CLOUD_ALPHA_INDEX = -10000;

export class BillboardCloudSystem {
  private scene: Scene;
  private cfg: RequiredCfg;
  private clouds: Cloud[] = [];

  // Cache: one texture + material per url (much cheaper than per-cloud)
  private textures = new Map<string, Texture>();
  private materials = new Map<string, StandardMaterial>();

  private observer: any = null;
  private lastT = 0;

  constructor(scene: Scene, cfg: BillboardCloudsConfig, private withBase: (u: string) => string) {
    this.scene = scene;

    if (!cfg.urls?.length) {
      throw new Error('BillboardCloudSystem: cfg.urls must contain at least one sprite url');
    }

    this.cfg = {
      enabled: cfg.enabled ?? true,
      urls: cfg.urls,

      count: cfg.count ?? 40,

      radiusMin: cfg.radiusMin ?? 260,
      radiusMax: cfg.radiusMax ?? 780,

      heightMin: cfg.heightMin ?? 120,
      heightMax: cfg.heightMax ?? 220,

      sizeMin: cfg.sizeMin ?? 70,
      sizeMax: cfg.sizeMax ?? 210,

      // Bump defaults a bit so they’re visible on bright panoramas
      alphaMin: cfg.alphaMin ?? 0.10,
      alphaMax: cfg.alphaMax ?? 0.22,

      speedMin: cfg.speedMin ?? 0.12,
      speedMax: cfg.speedMax ?? 0.55,

      windDir: cfg.windDir ?? { x: 1, z: 0.25 },

      wrap: cfg.wrap ?? true,
      fadeInSec: cfg.fadeInSec ?? 0.8,
      billboard: cfg.billboard ?? true,

      // Slight lift helps “soft smoke” sprites read as clouds
      brightness: cfg.brightness ?? 1.25,
      tint: cfg.tint ?? { r: 1, g: 1.02, b: 1.06 },

      // Ignored (kept for compatibility)
      renderingGroupId: cfg.renderingGroupId ?? CLOUD_RENDER_GROUP_ID,
    };

    this.init();
  }

  private rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  private pickUrl() {
    const i = (Math.random() * this.cfg.urls.length) | 0;
    return this.cfg.urls[i];
  }

  private getOrCreateMaterial(url: string) {
    const existing = this.materials.get(url);
    if (existing) return existing;

    // Mipmaps ON, invertY ON (safe for typical PNG sprite exports)
    const tex = new Texture(this.withBase(url), this.scene, false, true);
    tex.hasAlpha = true;
    tex.wrapU = Texture.CLAMP_ADDRESSMODE;
    tex.wrapV = Texture.CLAMP_ADDRESSMODE;

    // Slightly nicer sampling for soft edges / far distance
    tex.anisotropicFilteringLevel = 2;

    const mat = new StandardMaterial(`cloudMat_${this.materials.size}`, this.scene);
    mat.backFaceCulling = false;
    mat.disableLighting = true;

    // ✅ critical: don’t write depth for transparent sprites
    mat.disableDepthWrite = true;

    // Correct alpha use
    mat.useAlphaFromDiffuseTexture = true;

    // Emissive-only: clouds stay bright and stylized
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.diffuseTexture = null;

    // Brightness / tint
    const { brightness, tint } = this.cfg;
    mat.emissiveColor = new Color3(tint.r, tint.g, tint.b).scale(brightness);

    mat.specularColor = Color3.Black();

    // Standard alpha blending
    mat.alphaMode = Constants.ALPHA_COMBINE;

    this.textures.set(url, tex);
    this.materials.set(url, mat);

    return mat;
  }

  private anchorPos(): Vector3 {
    const cam = this.scene.activeCamera;
    return cam ? cam.globalPosition : Vector3.Zero();
  }

  private spawnOne(): Cloud {
    const anchor = this.anchorPos();

    const radius = this.rand(this.cfg.radiusMin, this.cfg.radiusMax);
    const theta = this.rand(0, Math.PI * 2);

    const x = anchor.x + Math.cos(theta) * radius;
    const z = anchor.z + Math.sin(theta) * radius;
    const y = this.rand(this.cfg.heightMin, this.cfg.heightMax);

    const size = this.rand(this.cfg.sizeMin, this.cfg.sizeMax);

    const mesh = MeshBuilder.CreatePlane(`cloud_${this.clouds.length}`, { size }, this.scene);
    mesh.isPickable = false;
    mesh.position.set(x, y, z);

    // ✅ HARD guarantee: clouds render as background FX
    mesh.renderingGroupId = CLOUD_RENDER_GROUP_ID;
    mesh.alphaIndex = CLOUD_ALPHA_INDEX;

    if (this.cfg.billboard) {
      mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    }

    const url = this.pickUrl();
    const baseAlpha = this.rand(this.cfg.alphaMin, this.cfg.alphaMax);

    mesh.material = this.getOrCreateMaterial(url);
    mesh.visibility = 0; // fade in

    // Velocity = wind + small jitter so they don’t move like a marching band
    const wd = new Vector3(this.cfg.windDir.x, 0, this.cfg.windDir.z);
    if (wd.lengthSquared() < 1e-6) wd.set(1, 0, 0);
    wd.normalize();

    const speed = this.rand(this.cfg.speedMin, this.cfg.speedMax);
    const vel = wd.scale(speed);
    vel.x += this.rand(-0.08, 0.08);
    vel.z += this.rand(-0.08, 0.08);

    return { mesh, vel, baseAlpha, fadeT: 0, fadeInSec: this.cfg.fadeInSec };
  }

  private init() {
    for (let i = 0; i < this.cfg.count; i++) {
      this.clouds.push(this.spawnOne());
    }

    this.lastT = performance.now();
    this.observer = this.scene.onBeforeRenderObservable.add(() => this.tick());
  }

  private resetCloud(c: Cloud, anchor: Vector3) {
    const radius = this.rand(this.cfg.radiusMin, this.cfg.radiusMax);
    const theta = this.rand(0, Math.PI * 2);

    c.mesh.position.x = anchor.x + Math.cos(theta) * radius;
    c.mesh.position.z = anchor.z + Math.sin(theta) * radius;
    c.mesh.position.y = this.rand(this.cfg.heightMin, this.cfg.heightMax);

    c.baseAlpha = this.rand(this.cfg.alphaMin, this.cfg.alphaMax);
    c.fadeT = 0;

    const url = this.pickUrl();
    c.mesh.material = this.getOrCreateMaterial(url);

    // recompute velocity
    const wd = new Vector3(this.cfg.windDir.x, 0, this.cfg.windDir.z);
    if (wd.lengthSquared() < 1e-6) wd.set(1, 0, 0);
    wd.normalize();

    const speed = this.rand(this.cfg.speedMin, this.cfg.speedMax);
    c.vel = wd.scale(speed);
    c.vel.x += this.rand(-0.08, 0.08);
    c.vel.z += this.rand(-0.08, 0.08);

    c.mesh.visibility = 0;
  }

  private tick() {
    const cam = this.scene.activeCamera;
    if (!cam) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastT) / 1000);
    this.lastT = now;

    const anchor = cam.globalPosition;

    const minR = this.cfg.radiusMin * 0.7;
    const minR2 = minR * minR;

    const maxR = this.cfg.radiusMax * 1.4;
    const maxR2 = maxR * maxR;

    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];

      c.mesh.position.addInPlace(c.vel.scale(dt));

      // Fade-in to avoid spawn pops
      if (c.fadeT < 1) {
        c.fadeT = Math.min(1, c.fadeT + dt / Math.max(0.001, c.fadeInSec));
      }
      c.mesh.visibility = c.baseAlpha * c.fadeT;

      if (this.cfg.wrap) {
        const dx = c.mesh.position.x - anchor.x;
        const dz = c.mesh.position.z - anchor.z;
        const d2 = dx * dx + dz * dz;

        if (d2 < minR2 || d2 > maxR2) {
          this.resetCloud(c, anchor);
          continue;
        }
      }
    }
  }

  dispose() {
    if (this.observer) {
      this.scene.onBeforeRenderObservable.remove(this.observer);
      this.observer = null;
    }

    for (const c of this.clouds) c.mesh.dispose();
    this.clouds = [];

    for (const mat of this.materials.values()) mat.dispose();
    this.materials.clear();

    for (const tex of this.textures.values()) tex.dispose();
    this.textures.clear();
  }
}
