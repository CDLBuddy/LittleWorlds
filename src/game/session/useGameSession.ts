/**
 * Game session store - Zustand store for current run parameters
 */

import { create } from 'zustand';
import type { RoleId, AreaId } from '@game/content/areas';

interface GameSession {
  slotId: string;
  roleId: RoleId | null;
  areaId: AreaId | null;
  setRole: (roleId: RoleId) => void;
  setArea: (areaId: AreaId) => void;
  setSlot: (slotId: string) => void;
  resetSession: () => void;
}

export const useGameSession = create<GameSession>((set) => ({
  slotId: 'main',
  roleId: null,
  areaId: null,
  setRole: (roleId: RoleId) => set({ roleId }),
  setArea: (areaId: AreaId) => set({ areaId }),
  setSlot: (slotId: string) => set({ slotId }),
  resetSession: () => set({ roleId: null, areaId: null }),
}));
