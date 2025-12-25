/**
 * Typed event bus for communication between UI and game systems
 */

// Icon types for kid-friendly prompts (no text)
export type PromptIcon = 'hand' | 'axe' | 'log' | 'fire' | 'tent' | 'fish' | 'paw';

// Companion FSM states
export type CompanionState = 'FollowPlayer' | 'LeadToTarget' | 'InvestigateTarget' | 'Celebrate';

// UI → Game events
export type UiToGame =
  | { type: 'ui/play' }
  | { type: 'ui/pause' }
  | { type: 'ui/resume' }
  | { type: 'ui/setQuality'; preset: 'low' | 'med' | 'high' }
  | { type: 'ui/callCompanion' }
  | { type: 'ui/toggleHelp' };

// Game → UI events
export type GameToUi =
  | { type: 'game/ready' }
  | { type: 'game/fps'; fps: number }
  | { type: 'game/prompt'; id: string; icon: PromptIcon; worldPos?: { x: number; y: number; z: number } }
  | { type: 'game/promptClear'; id?: string }
  | { type: 'game/task'; taskId: string; stepIndex: number; complete?: boolean }
  | { type: 'game/companion/state'; state: CompanionState; targetId?: string };

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
