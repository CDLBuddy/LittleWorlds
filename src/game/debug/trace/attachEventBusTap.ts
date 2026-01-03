/**
 * attachEventBusTap - DEV-only tap for EventBus to log all events
 * 
 * Logs every event emitted through the bus with:
 * - Event type
 * - Shallow payload summary (avoid huge objects)
 * - Timestamp
 */

import { trace } from './trace';
import type { AppEvent } from '@game/shared/events';

interface EventBus {
  emit(event: AppEvent): void;
  on(handler: (event: AppEvent) => void): () => void;
}

/**
 * Attach a tap to the EventBus to log all emitted events
 */
export function attachEventBusTap(eventBus: EventBus): void {
  if (!import.meta.env.DEV) return;

  // Store original emit
  const originalEmit = eventBus.emit.bind(eventBus);

  // Wrap emit to log before dispatching
  eventBus.emit = function (event: AppEvent) {
    // Log event with shallow summary
    const summary = summarizeEvent(event);
    trace.info('event', `emit: ${event.type}`, summary);

    // Call original emit
    originalEmit(event);
  };

  console.log('[attachEventBusTap] EventBus tap attached');
}

/**
 * Create a shallow summary of event payload (avoid dumping huge objects)
 */
function summarizeEvent(event: AppEvent): Record<string, unknown> {
  switch (event.type) {
    case 'game/inventoryUpdate':
      return { roleId: event.roleId, itemCount: event.items.length };
    case 'game/task':
      return { taskId: event.taskId, stepIndex: event.stepIndex, complete: event.complete };
    case 'game/taskComplete':
      return { taskId: event.taskId };
    case 'game/characterSwitch':
      return { roleId: event.roleId };
    case 'ui/switchCharacter':
      return { roleId: event.roleId };
    case 'game/areaRequest':
      return { areaId: event.areaId };
    case 'game/prompt':
      return { id: event.id, icon: event.icon };
    case 'game/promptClear':
      return { id: event.id };
    case 'game/companion/state':
      return { state: event.state, targetId: event.targetId };
    case 'game/interact':
      return { targetId: event.targetId };
    case 'game/dwell':
      return { id: event.id, progress: event.progress.toFixed(2) };
    case 'game/dwellClear':
      return { id: event.id };
    case 'ui/audio/volume':
      return { bus: event.bus, value: event.value };
    case 'ui/toast':
      return { level: event.level, message: event.message.substring(0, 50) };
    default:
      // For simple events (no payload), just return type
      return {};
  }
}
