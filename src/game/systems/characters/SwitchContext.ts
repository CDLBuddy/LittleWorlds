/**
 * SwitchContext - Transaction context for character switches
 * 
 * Purpose: Track when we're in the middle of a switch transaction to prevent
 * concurrent switches and enable safe cancellation of pending operations.
 * 
 * Every system can check:
 * - Are we mid-switch? (block concurrent operations)
 * - Which switch transaction is this? (correlation for debugging)
 */

export interface SwitchContextSnapshot {
  switching: boolean;
  seq: number;
}

class SwitchContext {
  private switching = false;
  private seq = 0;

  /**
   * Begin a switch transaction
   * @returns The switch sequence number for correlation
   */
  begin(): number {
    this.switching = true;
    this.seq++;
    return this.seq;
  }

  /**
   * End the current switch transaction
   */
  end(): void {
    this.switching = false;
  }

  /**
   * Get a snapshot of current switch state
   */
  getSnapshot(): SwitchContextSnapshot {
    return {
      switching: this.switching,
      seq: this.seq,
    };
  }

  /**
   * Check if we're currently in a switch transaction
   */
  isSwitching(): boolean {
    return this.switching;
  }

  /**
   * Get the current switch sequence number
   */
  getSeq(): number {
    return this.seq;
  }
}

// Export singleton instance
export const switchContext = new SwitchContext();

// DEV-only confirmation
if (import.meta.env.DEV) {
  console.log('[SwitchContext] Transaction context initialized');
}
