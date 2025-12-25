import { create } from 'zustand';

interface UiState {
  isPaused: boolean;
  showHUD: boolean;
  currentHint: string | null;
  inventoryItems: string[];
  setPaused: (paused: boolean) => void;
  setShowHUD: (show: boolean) => void;
  setHint: (hint: string | null) => void;
  addInventoryItem: (item: string) => void;
  removeInventoryItem: (item: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isPaused: false,
  showHUD: true,
  currentHint: null,
  inventoryItems: [],
  setPaused: (paused) => set({ isPaused: paused }),
  setShowHUD: (show) => set({ showHUD: show }),
  setHint: (hint) => set({ currentHint: hint }),
  addInventoryItem: (item) =>
    set((state) => ({ inventoryItems: [...state.inventoryItems, item] })),
  removeInventoryItem: (item) =>
    set((state) => ({
      inventoryItems: state.inventoryItems.filter((i) => i !== item),
    })),
}));
