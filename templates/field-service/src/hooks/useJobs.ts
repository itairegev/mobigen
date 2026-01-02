import { create } from 'zustand';
import type { Job } from '../types';
import { getJobs, getJobById, updateJobStatus } from '../services/jobs';

interface JobsState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  selectedJob: Job | null;
  fetchJobs: (filter?: { status?: string; date?: string }) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  clearSelectedJob: () => void;
}

export const useJobs = create<JobsState>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,
  selectedJob: null,

  fetchJobs: async (filter) => {
    set({ loading: true, error: null });
    try {
      const jobs = await getJobs(filter);
      set({ jobs, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchJobById: async (id) => {
    set({ loading: true, error: null });
    try {
      const job = await getJobById(id);
      set({ selectedJob: job, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const updatedJob = await updateJobStatus(id, status);

      // Update in jobs array
      const jobs = get().jobs.map((job) => (job.id === id ? updatedJob : job));
      set({ jobs, loading: false });

      // Update selected job if it's the one being updated
      if (get().selectedJob?.id === id) {
        set({ selectedJob: updatedJob });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  clearSelectedJob: () => set({ selectedJob: null }),
}));
