import { Scene, Texture, Color3, Vector3, DirectionalLight, HemisphericLight, Observable } from '@babylonjs/core';
import { PhotoDome } from '@babylonjs/core/Helpers/photoDome';
import { SKY_PRESETS } from './skyPresets';
import type { WorldId, WorldLookPreset } from './skyPresets';
import { detectDeviceCapabilities } from '@game/config/deviceHeuristics';
import { BillboardCloudSystem } from './BillboardCloudSystem';
import { createNoiseOverlay } from './NoiseOverlay';
import type { NoiseOverlayHandle } from './NoiseOverlay';

type SkyHandle = {
  dome: PhotoDome;
  worldId: WorldId;
  alpha: number;
};

export class SkySystem {
  private scene: Scene;
  private currentSky: SkyHandle | null = null;
  private textureCache = new Map<string, Texture>();
  private isTransitioning = false;
  
  // Lighting references (owned by system)
  private sunLight: DirectionalLight | null = null;
  private ambientLight: HemisphericLight | null = null;
  
  // FX systems
  private cloudFx: BillboardCloudSystem | null = null;
  private noiseFx: NoiseOverlayHandle | null = null;
  
  // Dev overlay state (DEV only)
  private devRotation = 0;
  private devOverlay: HTMLDivElement | null = null;
  private devKeyListener: ((e: KeyboardEvent) => void) | null = null;
  
  // Events
  public onTransitionComplete = new Observable<WorldId>();

  constructor(scene: Scene) {
    this.scene = scene;
    
    // Set up transparent background for sky visibility
    scene.clearColor = new Color3(0, 0, 0).toColor4(0);
    
    // Initialize dev tools in DEV mode
    if (import.meta.env.DEV) {
      this.initDevTools();
    }
  }

  /**
   * Apply a world's complete visual preset (sky + fog + lighting)
   * @param worldId World to apply
   * @param transitionMs Crossfade duration (0 = instant)
   */
  async apply(worldId: WorldId, transitionMs = 0): Promise<void> {
    if (this.isTransitioning) {
      console.warn('[SkySystem] Transition already in progress, ignoring');
      return;
    }

    const preset: WorldLookPreset = SKY_PRESETS[worldId];
    if (!preset) {
      console.error(`[SkySystem] No preset found for world: ${worldId}`);
      return;
    }

    console.log(`[SkySystem] Applying preset for ${worldId} (transition: ${transitionMs}ms)`);

    // Preload texture if needed
    await this.preload(worldId);

    if (transitionMs > 0 && this.currentSky) {
      await this.crossfade(worldId, preset, transitionMs);
    } else {
      this.applyInstant(worldId, preset);
    }

    // Apply lighting and fog
    this.applyLighting(preset);
    this.applyFog(preset);

    this.onTransitionComplete.notifyObservers(worldId);
  }

  /**
   * Preload sky texture for smooth transitions
   */
  async preload(worldId: WorldId): Promise<void> {
    const preset: WorldLookPreset = SKY_PRESETS[worldId];
    const sky = preset?.sky;
    if (!sky) return;

    const url = this.withBase(sky.url);
    
    if (this.textureCache.has(url)) {
      console.log(`[SkySystem] Texture already cached: ${url}`);
      return;
    }

    console.log(`[SkySystem] Preloading texture: ${url}`);
    
    return new Promise((resolve) => {
      const tex = new Texture(url, this.scene);
      tex.onLoadObservable.addOnce(() => {
        this.textureCache.set(url, tex);
        console.log(`[SkySystem] Preload complete: ${url}`);
        resolve();
      });
    });
  }

  /**
   * Instant (no fade) sky change
   */
  private applyInstant(worldId: WorldId, preset: WorldLookPreset): void {
    // Dispose old sky
    if (this.currentSky) {
      this.currentSky.dome.dispose();
      this.currentSky = null;
    }

    // Create new sky
    const sky = preset.sky;
    if (sky) {
      const dome = this.createDome(sky);
      this.currentSky = { dome, worldId, alpha: 1 };
      
      // Restore dev rotation in DEV
      if (import.meta.env.DEV) {
        const saved = this.loadDevRotation(worldId);
        if (saved !== null) {
          dome.mesh.rotation.y = saved;
          this.devRotation = saved;
        } else {
          // Initialize devRotation from preset
          this.devRotation = sky.rotationY ?? 0;
        }
      }
    }

    // Apply FX
    this.applyBillboardClouds(preset);
    this.applyNoise(preset);
  }

  /**
   * Crossfade between current and new sky
   */
  private async crossfade(worldId: WorldId, preset: WorldLookPreset, durationMs: number): Promise<void> {
    const sky = preset.sky;
    if (!sky || !this.currentSky) return;

    this.isTransitioning = true;

    const oldSky = this.currentSky;
    const newDome = this.createDome(sky);
    const newSky: SkyHandle = { dome: newDome, worldId, alpha: 0 };

    // Set initial alpha
    const newMat = newDome.mesh.material as { alpha: number } | null;
    if (newMat) newMat.alpha = 0;

    // Animate using scene render loop
    let elapsed = 0;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Fade out old
        const oldMat = oldSky.dome.mesh.material as { alpha: number } | null;
        if (oldMat) oldMat.alpha = 1 - progress;

        // Fade in new
        if (newMat) newMat.alpha = progress;

        if (progress >= 1) {
          // Transition complete
          oldSky.dome.dispose();
          this.currentSky = newSky;
          this.isTransitioning = false;
          this.scene.onBeforeRenderObservable.remove(observer);
          
          // Apply FX after transition
          this.applyBillboardClouds(preset);
          this.applyNoise(preset);
          
          resolve();
        }
      });
    });
  }

  /**
   * Create PhotoDome with quality scaling
   */
  private createDome(skyConfig: NonNullable<WorldLookPreset['sky']>): PhotoDome {
    const quality = detectDeviceCapabilities().estimatedGPU;
    const resolution = skyConfig.resolution ?? (quality === 'low' ? 16 : 32);
    const size = skyConfig.size ?? 1400;

    const url = this.withBase(skyConfig.url);

    const dome = new PhotoDome(
      `skyDome_${Date.now()}`,
      url,
      {
        resolution,
        size,
        useDirectMapping: true,
      },
      this.scene
    );

    dome.mesh.infiniteDistance = true;
    dome.mesh.renderingGroupId = 0;

    // With useDirectMapping:true, we can rotate the mesh directly
    if (skyConfig.rotationY !== undefined) {
      dome.mesh.rotation.y = skyConfig.rotationY;
    }

    return dome;
  }

  /**
   * Apply lighting preset
   */
  private applyLighting(preset: WorldLookPreset): void {
    // Dispose old lights
    this.sunLight?.dispose();
    this.ambientLight?.dispose();

    const sun = preset.sun;
    if (sun) {
      this.sunLight = new DirectionalLight('sunLight', sun.direction, this.scene);
      this.sunLight.intensity = sun.intensity;
      this.sunLight.diffuse = sun.color;
    }

    const ambient = preset.ambient;
    if (ambient) {
      this.ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
      this.ambientLight.intensity = ambient.intensity;
      this.ambientLight.diffuse = ambient.diffuse ?? new Color3(1, 1, 1);
      this.ambientLight.groundColor = ambient.groundColor ?? new Color3(0.6, 0.6, 0.6);
    }
  }

  /**
   * Apply fog preset
   */
  private applyFog(preset: WorldLookPreset): void {
    const fog = preset.fog;
    if (fog) {
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogColor = fog.color;
      this.scene.fogDensity = fog.density;
    } else {
      this.scene.fogMode = Scene.FOGMODE_NONE;
    }
  }

  /**
   * Apply billboard clouds FX
   */
  private applyBillboardClouds(preset: WorldLookPreset): void {
    this.cloudFx?.dispose();
    this.cloudFx = null;

    const cfg = preset.cloudBillboards;
    if (!cfg?.enabled) return;

    this.cloudFx = new BillboardCloudSystem(this.scene, cfg, (u) => this.withBase(u));
  }

  /**
   * Apply noise overlay FX
   */
  private applyNoise(preset: WorldLookPreset): void {
    this.noiseFx?.dispose();
    this.noiseFx = null;

    const cfg = preset.noise;
    if (!cfg?.enabled) return;

    this.noiseFx = createNoiseOverlay(this.scene, cfg, (u) => this.withBase(u));
  }

  /**
   * Vite-safe path resolution
   */
  private withBase(url: string): string {
    const base = import.meta.env.BASE_URL ?? '/';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    return `${base}${url}`;
  }

  /**
   * Initialize dev overlay and keybinds (DEV only)
   */
  private initDevTools(): void {
    // Create overlay
    this.devOverlay = document.createElement('div');
    this.devOverlay.id = 'sky-dev-overlay';
    this.devOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 9999;
      display: none;
    `;
    document.body.appendChild(this.devOverlay);

    // Keybinds: F3 to toggle overlay, Q/E to rotate
    this.devKeyListener = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        const isVisible = this.devOverlay!.style.display !== 'none';
        this.devOverlay!.style.display = isVisible ? 'none' : 'block';
        return;
      }

      if (!this.currentSky) return;

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        this.devRotation -= 0.05;
        this.currentSky.dome.mesh.rotation.y = this.devRotation;
        this.saveDevRotation(this.currentSky.worldId, this.devRotation);
        this.updateDevOverlay();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.devRotation += 0.05;
        this.currentSky.dome.mesh.rotation.y = this.devRotation;
        this.saveDevRotation(this.currentSky.worldId, this.devRotation);
        this.updateDevOverlay();
      }
    };

    window.addEventListener('keydown', this.devKeyListener);
    this.updateDevOverlay();

    console.log('[SkySystem] Dev tools enabled. Press F3 to toggle overlay, Q/E to rotate sky');
  }

  /**
   * Update dev overlay content
   */
  private updateDevOverlay(): void {
    if (!this.devOverlay || !this.currentSky) return;

    const preset: WorldLookPreset = SKY_PRESETS[this.currentSky.worldId];
    const rot = this.devRotation.toFixed(3);
    const fogInfo = preset.fog ? `Fog: ${preset.fog.density.toFixed(4)}` : 'No fog';

    this.devOverlay.innerHTML = `
      <strong>Sky System Dev Tools</strong><br>
      World: <span style="color: #ff0">${this.currentSky.worldId}</span><br>
      Rotation: ${rot} rad<br>
      <button onclick="navigator.clipboard.writeText('${rot}')">Copy</button><br>
      ${fogInfo}<br>
      <small>Q/E: Rotate | F3: Toggle</small>
    `;
  }

  /**
   * Save dev rotation to localStorage
   */
  private saveDevRotation(worldId: WorldId, rotation: number): void {
    localStorage.setItem(`sky_dev_rotation_${worldId}`, rotation.toString());
  }

  /**
   * Load dev rotation from localStorage
   */
  private loadDevRotation(worldId: WorldId): number | null {
    const saved = localStorage.getItem(`sky_dev_rotation_${worldId}`);
    return saved ? parseFloat(saved) : null;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    console.log('[SkySystem] Disposing');

    // Dispose current sky
    if (this.currentSky) {
      this.currentSky.dome.dispose();
      this.currentSky = null;
    }

    // Dispose cached textures
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();

    // Dispose lights
    this.sunLight?.dispose();
    this.ambientLight?.dispose();

    // Dispose FX
    this.cloudFx?.dispose();
    this.cloudFx = null;

    this.noiseFx?.dispose();
    this.noiseFx = null;

    // Remove dev tools
    if (this.devKeyListener) {
      window.removeEventListener('keydown', this.devKeyListener);
      this.devKeyListener = null;
    }
    if (this.devOverlay) {
      this.devOverlay.remove();
      this.devOverlay = null;
    }

    this.onTransitionComplete.clear();
  }
}
