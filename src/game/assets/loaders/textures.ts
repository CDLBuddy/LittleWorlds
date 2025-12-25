/**
 * KTX2/Basis texture loading and caching
 */

import { Scene, Texture } from '@babylonjs/core';

export async function loadTexture(
  scene: Scene,
  url: string,
  options?: {
    noMipmap?: boolean;
    invertY?: boolean;
  }
): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const texture = new Texture(
      url,
      scene,
      options?.noMipmap,
      options?.invertY,
      undefined,
      () => resolve(texture),
      (message) => reject(new Error(message || 'Failed to load texture'))
    );
  });
}

export class TextureCache {
  private cache = new Map<string, Texture>();

  async getOrLoad(scene: Scene, url: string): Promise<Texture> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const texture = await loadTexture(scene, url);
    this.cache.set(url, texture);
    return texture;
  }

  dispose(): void {
    this.cache.forEach((texture) => texture.dispose());
    this.cache.clear();
  }
}
