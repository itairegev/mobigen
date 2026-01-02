import { create } from 'zustand';
import { Download } from '../types';
import { storage } from '../services/storage';

interface DownloadsStore {
  downloads: Download[];

  // Actions
  addDownload: (download: Download) => Promise<void>;
  removeDownload: (episodeId: string) => Promise<void>;
  getDownload: (episodeId: string) => Download | undefined;
  isDownloaded: (episodeId: string) => boolean;
  loadDownloads: () => Promise<void>;
}

const STORAGE_KEY = 'podcast_downloads';

export const useDownloads = create<DownloadsStore>((set, get) => ({
  downloads: [],

  addDownload: async (download: Download) => {
    const newDownloads = [...get().downloads, download];
    set({ downloads: newDownloads });
    await storage.setJSON(STORAGE_KEY, newDownloads);
  },

  removeDownload: async (episodeId: string) => {
    const newDownloads = get().downloads.filter(d => d.episodeId !== episodeId);
    set({ downloads: newDownloads });
    await storage.setJSON(STORAGE_KEY, newDownloads);
  },

  getDownload: (episodeId: string) => {
    return get().downloads.find(d => d.episodeId === episodeId);
  },

  isDownloaded: (episodeId: string) => {
    return get().downloads.some(d => d.episodeId === episodeId);
  },

  loadDownloads: async () => {
    const downloads = await storage.getJSON<Download[]>(STORAGE_KEY);
    set({ downloads: downloads || [] });
  },
}));
