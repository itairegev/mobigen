import { create } from 'zustand';
import type { AgendaItem } from '@/types';

interface AgendaStore {
  items: AgendaItem[];
  addToAgenda: (sessionId: string, reminder?: boolean) => void;
  removeFromAgenda: (sessionId: string) => void;
  isInAgenda: (sessionId: string) => boolean;
  updateNotes: (sessionId: string, notes: string) => void;
  toggleReminder: (sessionId: string) => void;
  clearAgenda: () => void;
}

export const useAgenda = create<AgendaStore>((set, get) => ({
  items: [],

  addToAgenda: (sessionId: string, reminder = false) => {
    set((state) => {
      if (state.items.some((item) => item.sessionId === sessionId)) {
        return state;
      }
      return {
        items: [
          ...state.items,
          {
            sessionId,
            reminder,
            addedAt: new Date(),
          },
        ],
      };
    });
  },

  removeFromAgenda: (sessionId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.sessionId !== sessionId),
    }));
  },

  isInAgenda: (sessionId: string) => {
    return get().items.some((item) => item.sessionId === sessionId);
  },

  updateNotes: (sessionId: string, notes: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.sessionId === sessionId ? { ...item, notes } : item
      ),
    }));
  },

  toggleReminder: (sessionId: string) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.sessionId === sessionId ? { ...item, reminder: !item.reminder } : item
      ),
    }));
  },

  clearAgenda: () => {
    set({ items: [] });
  },
}));
