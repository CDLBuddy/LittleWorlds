/**
 * Typed event bus for communication between UI and game systems
 */

// Icon types for kid-friendly prompts (no text)
export type PromptIcon = 'hand' | 'axe' | 'log' | 'fire' | 'tent' | 'fish' | 'paw' | 'book' | 'knife' | 'spark' | 'knot' | 'target';

// Companion FSM states
export type CompanionState = 'FollowPlayer' | 'LeadToTarget' | 'InvestigateTarget' | 'Celebrate';

// Camera modes for dynamic framing
export type CameraMode = 'FOLLOW' | 'LEAD' | 'CELEBRATE';

// UI → Game events
export type UiToGame =
  | { type: 'ui/play' }
  | { type: 'ui/pause' }
  | { type: 'ui/resume' }
  | { type: 'ui/setQuality'; preset: 'low' | 'med' | 'high' }
  | { type: 'ui/callCompanion' }
  | { type: 'ui/toggleHelp' }
  | { type: 'ui/audio/unlock' }
  | { type: 'ui/audio/volume'; bus: 'master' | 'music' | 'sfx'; value: number }
  | { type: 'ui/restart' }
  | { type: 'ui/quit' }
  | { type: 'ui/getInventory' } // Request current inventory
  | { type: 'ui/getCollections' } // Request shared collections progress
  | { type: 'ui/switchCharacter'; roleId: 'boy' | 'girl' } // Switch active character
  | { type: 'ui/toast'; level: 'info' | 'warning' | 'error'; message: string };

// Game → UI events
export type GameToUi =
  | { type: 'game/ready' }
  | { type: 'game/appReady'; roleId: 'boy' | 'girl' } // GameApp + TaskSystem fully initialized
  | { type: 'game/fps'; fps: number }
  | { type: 'game/prompt'; id: string; icon: PromptIcon; worldPos?: { x: number; y: number; z: number } }
  | { type: 'game/promptClear'; id?: string }
  | { type: 'game/task'; taskId: string; stepIndex: number; complete?: boolean }
  | { type: 'game/taskComplete'; taskId: string; position: { x: number; y: number; z: number } }
  | { type: 'game/companion/state'; state: CompanionState; targetId?: string }
  | { type: 'game/audio/locked'; locked: boolean }
  | { type: 'game/interact'; targetId: string }
  | { type: 'game/dwell'; id: string; progress: number } // Dwell progress 0..1
  | { type: 'game/dwellClear'; id: string } // Clear dwell for specific id
  | { type: 'game/areaRequest'; areaId: string } // Request area transition (from gate)
  | { type: 'game/inventoryUpdate'; roleId: 'boy' | 'girl'; items: string[] } // Send current inventory to UI with role
  | { type: 'game/characterSwitch'; roleId: 'boy' | 'girl' } // Character switched
  | { type: 'game/collectionsUpdate'; shared: { findsByArea: Record<string, string[]>; trophiesByArea: Record<string, boolean>; postcardsByArea: Record<string, boolean>; audioByArea: Record<string, boolean>; campUpgrades: string[] } }; // Shared collections progress

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

// DEV: Confirm singleton initialization
if (import.meta.env.DEV) {
  console.log('[eventBus] singleton created');
}
