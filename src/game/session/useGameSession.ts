/**
 * Game session store - Zustand store for current run parameters
 */

import { create } from 'zustand';
import type { RoleId, AreaId } from '@game/content/areas';

interface GameSession {
  slotId: string;
  roleId: RoleId | null;
  areaId: AreaId | null;
  fromArea: AreaId | null; // Which area did we come from (for spawn positioning)
  setRole: (roleId: RoleId) => void;
  setArea: (areaId: AreaId, fromArea?: AreaId) => void;
  setSlot: (slotId: string) => void;
  resetSession: () => void;
}

export const useGameSession = create<GameSession>((set, get) => ({
  slotId: 'main',
  roleId: null,
  areaId: null,
  fromArea: null,
  setRole: (roleId: RoleId) => set({ roleId }),
  setArea: (areaId: AreaId, fromArea?: AreaId) => {
    const currentArea = get().areaId;
    set({ areaId, fromArea: fromArea !== undefined ? fromArea : currentArea });
  },
  setSlot: (slotId: string) => set({ slotId }),
  resetSession: () => set({ roleId: null, areaId: null, fromArea: null }),
}));
