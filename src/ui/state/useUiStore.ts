import { create } from 'zustand';
import type { PromptIcon, CompanionState } from '@game/shared/events';

interface ActivePrompt {
  id: string;
  icon: PromptIcon;
  worldPos?: { x: number; y: number; z: number };
}

interface UiState {
  isPaused: boolean;
  showHUD: boolean;
  currentHint: string | null;
  inventoryItems: string[];
  activePrompts: Map<string, ActivePrompt>;
  companionState: CompanionState | null;
  setPaused: (paused: boolean) => void;
  setShowHUD: (show: boolean) => void;
  setHint: (hint: string | null) => void;
  addInventoryItem: (item: string) => void;
  removeInventoryItem: (item: string) => void;
  addPrompt: (prompt: ActivePrompt) => void;
  removePrompt: (id: string) => void;
  setCompanionState: (state: CompanionState) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isPaused: false,
  showHUD: true,
  currentHint: null,
  inventoryItems: [],
  activePrompts: new Map(),
  companionState: null,
  setPaused: (paused) => set({ isPaused: paused }),
  setShowHUD: (show) => set({ showHUD: show }),
  setHint: (hint) => set({ currentHint: hint }),
  addInventoryItem: (item) =>
    set((state) => ({ inventoryItems: [...state.inventoryItems, item] })),
  removeInventoryItem: (item) =>
    set((state) => ({
      inventoryItems: state.inventoryItems.filter((i) => i !== item),
    })),
  addPrompt: (prompt) =>
    set((state) => {
      const newPrompts = new Map(state.activePrompts);
      newPrompts.set(prompt.id, prompt);
      // Keep only last 3 prompts to avoid clutter
      if (newPrompts.size > 3) {
        const firstKey = newPrompts.keys().next().value;
        if (firstKey !== undefined) {
          newPrompts.delete(firstKey);
        }
      }
      return { activePrompts: newPrompts };
    }),
  removePrompt: (id) =>
    set((state) => {
      const newPrompts = new Map(state.activePrompts);
      newPrompts.delete(id);
      return { activePrompts: newPrompts };
    }),
  setCompanionState: (companionState) => set({ companionState }),
}));
