/**
 * Asset deduplication and reference counting
 */

export class AssetCache<T> {
  private cache = new Map<string, { asset: T; refCount: number }>();

  add(key: string, asset: T): void {
    if (this.cache.has(key)) {
      this.cache.get(key)!.refCount++;
    } else {
      this.cache.set(key, { asset, refCount: 1 });
    }
  }

  get(key: string): T | undefined {
    return this.cache.get(key)?.asset;
  }

  release(key: string, disposeFn?: (asset: T) => void): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      if (disposeFn) {
        disposeFn(entry.asset);
      }
      this.cache.delete(key);
    }
  }

  clear(disposeFn?: (asset: T) => void): void {
    if (disposeFn) {
      this.cache.forEach((entry) => disposeFn(entry.asset));
    }
    this.cache.clear();
  }
}
