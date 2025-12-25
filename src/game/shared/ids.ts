/**
 * Stable ID generation and management for game objects
 */

let idCounter = 0;

export function generateId(prefix = 'obj'): string {
  return `${prefix}_${++idCounter}_${Date.now()}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

export class IdRegistry {
  private registry = new Map<string, any>();

  register(id: string, object: any): void {
    this.registry.set(id, object);
  }

  unregister(id: string): void {
    this.registry.delete(id);
  }

  get<T = any>(id: string): T | undefined {
    return this.registry.get(id);
  }

  has(id: string): boolean {
    return this.registry.has(id);
  }

  clear(): void {
    this.registry.clear();
  }
}

export const globalRegistry = new IdRegistry();
