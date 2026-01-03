/**
 * Pine World - Disposable resource bag
 */

import type { AbstractMesh, StandardMaterial, Texture } from '@babylonjs/core';

export class DisposableBag {
  private meshes: AbstractMesh[] = [];
  private materials: StandardMaterial[] = [];
  private textures: Texture[] = [];
  private others: Array<{ dispose: () => void }> = [];

  trackMesh<T extends AbstractMesh>(m: T) {
    this.meshes.push(m);
    return m;
  }
  trackMat<T extends StandardMaterial>(m: T) {
    this.materials.push(m);
    return m;
  }
  trackTex<T extends Texture>(t: T) {
    this.textures.push(t);
    return t;
  }
  trackOther(o: { dispose: () => void }) {
    this.others.push(o);
    return o;
  }

  dispose() {
    // Dispose meshes first (they reference mats)
    for (const m of this.meshes) m.dispose();
    this.meshes = [];

    for (const m of this.materials) m.dispose();
    this.materials = [];

    for (const t of this.textures) t.dispose();
    this.textures = [];

    for (const o of this.others) o.dispose();
    this.others = [];
  }
}
