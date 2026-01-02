import { create } from 'zustand';
import type { TimeEntry } from '../types';
import { getTimeEntries, clockIn, clockOut } from '../services/jobs';

interface TimeLogState {
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
  loading: boolean;
  error: string | null;
  fetchEntries: (jobId?: string) => Promise<void>;
  startTimer: (jobId: string, notes?: string) => Promise<void>;
  stopTimer: (entryId: string, notes?: string) => Promise<void>;
  getActiveEntryForJob: (jobId: string) => TimeEntry | null;
}

export const useTimeLog = create<TimeLogState>((set, get) => ({
  entries: [],
  activeEntry: null,
  loading: false,
  error: null,

  fetchEntries: async (jobId) => {
    set({ loading: true, error: null });
    try {
      const entries = await getTimeEntries(jobId);
      const activeEntry = entries.find((e) => !e.clockOut) || null;
      set({ entries, activeEntry, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  startTimer: async (jobId, notes) => {
    set({ loading: true, error: null });
    try {
      const entry = await clockIn(jobId, notes);
      set({
        entries: [...get().entries, entry],
        activeEntry: entry,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  stopTimer: async (entryId, notes) => {
    set({ loading: true, error: null });
    try {
      const updatedEntry = await clockOut(entryId, notes);
      const entries = get().entries.map((e) => (e.id === entryId ? updatedEntry : e));
      set({
        entries,
        activeEntry: null,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getActiveEntryForJob: (jobId) => {
    return get().entries.find((e) => e.jobId === jobId && !e.clockOut) || null;
  },
}));
