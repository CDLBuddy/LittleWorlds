/**
 * TraceBuffer - Ring buffer for DEV-only trace events
 * 
 * Purpose: Store last N trace events for debugging role/save desync issues.
 * Access via window.__traceDump() in browser console.
 */

export interface TraceEntry {
  /** Timestamp (ms since epoch) */
  t: number;
  /** Category: event, save, switch, system, error */
  cat: 'event' | 'save' | 'switch' | 'system' | 'error';
  /** Log level */
  level: 'info' | 'warn' | 'error';
  /** Human-readable message */
  msg: string;
  /** Optional structured data (shallow, avoid circular refs) */
  data?: unknown;
}

class TraceBuffer {
  private buffer: TraceEntry[] = [];
  private maxSize: number;
  private writeIndex = 0;
  private full = false;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize) as TraceEntry[];
  }

  /**
   * Add an entry to the ring buffer
   */
  push(entry: TraceEntry): void {
    this.buffer[this.writeIndex] = entry;
    this.writeIndex++;
    
    if (this.writeIndex >= this.maxSize) {
      this.writeIndex = 0;
      this.full = true;
    }
  }

  /**
   * Get last N entries (newest first)
   */
  getLast(count?: number): TraceEntry[] {
    const totalEntries = this.full ? this.maxSize : this.writeIndex;
    const n = count ?? totalEntries;
    const result: TraceEntry[] = [];

    // Read backwards from most recent
    for (let i = 0; i < Math.min(n, totalEntries); i++) {
      const idx = (this.writeIndex - 1 - i + this.maxSize) % this.maxSize;
      const entry = this.buffer[idx];
      if (entry) {
        result.push(entry);
      }
    }

    return result;
  }

  /**
   * Get entries by category
   */
  getByCategory(cat: TraceEntry['cat'], count?: number): TraceEntry[] {
    return this.getLast(count).filter(e => e.cat === cat);
  }

  /**
   * Get entries by time range
   */
  getByTimeRange(startMs: number, endMs: number): TraceEntry[] {
    return this.getLast().filter(e => e.t >= startMs && e.t <= endMs);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.buffer = new Array(this.maxSize) as TraceEntry[];
    this.writeIndex = 0;
    this.full = false;
  }

  /**
   * Get current buffer stats
   */
  getStats(): { total: number; oldest?: number; newest?: number } {
    const totalEntries = this.full ? this.maxSize : this.writeIndex;
    if (totalEntries === 0) {
      return { total: 0 };
    }

    const entries = this.getLast();
    return {
      total: totalEntries,
      oldest: entries[entries.length - 1]?.t,
      newest: entries[0]?.t,
    };
  }
}

// Singleton instance
export const traceBuffer = new TraceBuffer(500);

// DEV-only confirmation
// if (import.meta.env.DEV) {
//   console.log('[TraceBuffer] Ring buffer initialized (max 500 entries)');
// }
