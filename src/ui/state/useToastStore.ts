/**
 * Toast Store - Manages toast notifications state
 */

import { create } from 'zustand';

export type ToastLevel = 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  level: ToastLevel;
  message: string;
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  pushToast: (level: ToastLevel, message: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  pushToast: (level, message) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const toast: Toast = {
      id,
      level,
      message,
      createdAt: Date.now(),
    };
    
    set((state) => {
      // Keep max 3 toasts, drop oldest if needed
      const newToasts = [...state.toasts, toast];
      return { toasts: newToasts.slice(-3) };
    });
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ toasts: [] });
  },
}));
