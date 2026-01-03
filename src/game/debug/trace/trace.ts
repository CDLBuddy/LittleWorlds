/**
 * trace - DEV-only logging helpers with ring buffer storage
 * 
 * Usage:
 *   trace.info('save', 'Inventory synced', { roleId: 'boy', count: 3 })
 *   trace.warn('switch', 'Switch already in progress')
 *   trace.error('save', 'Role mismatch!', { expected: 'boy', actual: 'girl' })
 */

import { traceBuffer, type TraceEntry } from './TraceBuffer';

const DEV = import.meta.env.DEV;

class Trace {
  /**
   * Log info-level trace event
   */
  info(cat: TraceEntry['cat'], msg: string, data?: unknown): void {
    if (!DEV) return;

    const entry: TraceEntry = {
      t: Date.now(),
      cat,
      level: 'info',
      msg,
      data,
    };

    traceBuffer.push(entry);
    
    // Also log to console in DEV (can be disabled via flag)
    if (this.shouldLogToConsole(cat)) {
      console.log(`[Trace:${cat}] ${msg}`, data ?? '');
    }
  }

  /**
   * Log warning-level trace event
   */
  warn(cat: TraceEntry['cat'], msg: string, data?: unknown): void {
    if (!DEV) return;

    const entry: TraceEntry = {
      t: Date.now(),
      cat,
      level: 'warn',
      msg,
      data,
    };

    traceBuffer.push(entry);
    console.warn(`[Trace:${cat}] ⚠️  ${msg}`, data ?? '');
  }

  /**
   * Log error-level trace event (always logs to console)
   */
  error(cat: TraceEntry['cat'], msg: string, data?: unknown): void {
    if (!DEV) return;

    const entry: TraceEntry = {
      t: Date.now(),
      cat,
      level: 'error',
      msg,
      data,
    };

    traceBuffer.push(entry);
    console.error(`[Trace:${cat}] 🔥 ${msg}`, data ?? '');
  }

  /**
   * Determine if category should log to console
   * (Can be toggled via window.__traceConfig)
   */
  private shouldLogToConsole(cat: TraceEntry['cat']): boolean {
    // Check global config (set via window.__traceConfig)
    const config = (window as unknown as Record<string, unknown>).__traceConfig as Record<string, boolean> | undefined;
    if (config && typeof config[cat] === 'boolean') {
      return config[cat];
    }

    // Default: log switch + save + error, silence event + system
    switch (cat) {
      case 'switch':
      case 'save':
      case 'error':
        return true;
      case 'event':
      case 'system':
        return false;
      default:
        return true;
    }
  }
}

export const trace = new Trace();

// DEV-only: Expose trace config for runtime toggling
if (DEV) {
  (window as unknown as Record<string, unknown>).__traceConfig = {
    event: false,   // EventBus taps (noisy)
    save: true,     // Save writes (important)
    switch: true,   // Character switches (important)
    system: false,  // System lifecycle (noisy)
    error: true,    // Errors (always show)
  };
  console.log('[trace] Helpers initialized. Toggle logging via window.__traceConfig');
}
