/**
 * Pine World - Material cache to prevent duplication
 */

import type { StandardMaterial } from '@babylonjs/core';
import type { DisposableBag } from './DisposableBag';

export class MaterialCache {
  private map = new Map<string, StandardMaterial>();
  constructor(private bag: DisposableBag) {}

  get(key: string, build: () => StandardMaterial) {
    const existing = this.map.get(key);
    if (existing) return existing;
    const mat = build();
    this.map.set(key, mat);
    this.bag.trackMat(mat);
    return mat;
  }
}
