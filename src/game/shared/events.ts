/**
 * Typed event bus for communication between UI and game systems
 */

// UI → Game events
export type UiToGame =
  | { type: 'ui/play' }
  | { type: 'ui/pause' }
  | { type: 'ui/resume' }
  | { type: 'ui/setQuality'; preset: 'low' | 'med' | 'high' }
  | { type: 'ui/callCompanion' };

// Game → UI events
export type GameToUi =
  | { type: 'game/ready' }
  | { type: 'game/fps'; fps: number }
  | { type: 'game/prompt'; id: string; icon: string }
  | { type: 'game/task'; id: string; status: 'started' | 'done' };

export type AppEvent = UiToGame | GameToUi;

type EventHandler = (event: AppEvent) => void;

class EventBus {
  private handlers = new Set<EventHandler>();

  on(handler: EventHandler): () => void {
    this.handlers.add(handler);
    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(event: AppEvent): void {
    this.handlers.forEach((handler) => handler(event));
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
