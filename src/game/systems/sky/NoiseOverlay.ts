import { Layer, Scene, Texture } from '@babylonjs/core';
import type { NoiseConfig } from './skyPresets';

export type NoiseOverlayHandle = {
  setAlpha(a: number): void;
  dispose(): void;
};

export function createNoiseOverlay(scene: Scene, cfg: NoiseConfig, withBase: (u: string) => string): NoiseOverlayHandle {
  const tex = new Texture(withBase(cfg.url), scene, true, false);
  tex.wrapU = Texture.WRAP_ADDRESSMODE;
  tex.wrapV = Texture.WRAP_ADDRESSMODE;

  const scale = cfg.scale ?? 2;
  tex.uScale = scale;
  tex.vScale = scale;

  tex.level = cfg.alpha ?? 0.03;

  const layer = new Layer('noiseOverlay', null, scene, true);
  layer.texture = tex;
  layer.isBackground = false;

  return {
    setAlpha(a: number) {
      if (layer.texture) {
        layer.texture.level = a;
      }
    },
    dispose() {
      layer.dispose();
      tex.dispose();
    },
  };
}
