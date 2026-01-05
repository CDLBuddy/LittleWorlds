/**
 * Deterministic random number generation for grass placement
 * Used for seeded jitter and density sampling
 */

/**
 * Hash a seed value (number or string) to a uint32
 * @param seed - Seed value (number, string, or undefined)
 * @returns uint32 hash
 */
export function hashSeed(seed: number | string | undefined): number {
  if (seed === undefined) {
    // Default seed when explicitly requested but undefined
    return 123456789;
  }

  if (typeof seed === 'number') {
    // Simple hash for numbers
    return (seed >>> 0) || 123456789;
  }

  // FNV-1a hash for strings
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG
 * Fast, high-quality deterministic random number generator
 * @param seed - uint32 seed value
 * @returns Function returning random float in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return function() {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
