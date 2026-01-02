import { create } from 'zustand';
import { Episode, PlayState, PlaybackSettings } from '../types';
import { playerService } from '../services/player';

interface PlayerStore extends PlayState {
  settings: PlaybackSettings;

  // Actions
  loadAndPlay: (episode: Episode) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipForward: () => Promise<void>;
  skipBackward: () => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  updatePosition: (position: number) => void;
  updateDuration: (duration: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlayer = create<PlayerStore>((set, get) => ({
  isPlaying: false,
  currentEpisode: null,
  position: 0,
  duration: 0,
  isLoading: false,
  error: null,
  settings: {
    speed: 1,
    volume: 1,
    skipForward: 30,
    skipBackward: 15,
  },

  loadAndPlay: async (episode: Episode) => {
    try {
      set({ isLoading: true, error: null });

      await playerService.loadEpisode(episode);
      await playerService.play();

      set({
        currentEpisode: episode,
        isPlaying: true,
        isLoading: false,
        position: 0,
        duration: episode.duration,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load episode',
        isLoading: false,
      });
    }
  },

  play: async () => {
    try {
      await playerService.play();
      set({ isPlaying: true });
    } catch (error) {
      set({ error: 'Failed to play' });
    }
  },

  pause: async () => {
    try {
      await playerService.pause();
      set({ isPlaying: false });
    } catch (error) {
      set({ error: 'Failed to pause' });
    }
  },

  stop: async () => {
    try {
      await playerService.stop();
      set({ isPlaying: false, position: 0 });
    } catch (error) {
      set({ error: 'Failed to stop' });
    }
  },

  seekTo: async (position: number) => {
    try {
      await playerService.seekTo(position * 1000);
      set({ position });
    } catch (error) {
      set({ error: 'Failed to seek' });
    }
  },

  skipForward: async () => {
    try {
      const { settings, position, duration } = get();
      const newPosition = Math.min(position + settings.skipForward, duration);
      await playerService.skipForward(settings.skipForward);
      set({ position: newPosition });
    } catch (error) {
      set({ error: 'Failed to skip forward' });
    }
  },

  skipBackward: async () => {
    try {
      const { settings, position } = get();
      const newPosition = Math.max(position - settings.skipBackward, 0);
      await playerService.skipBackward(settings.skipBackward);
      set({ position: newPosition });
    } catch (error) {
      set({ error: 'Failed to skip backward' });
    }
  },

  setSpeed: async (speed: number) => {
    try {
      await playerService.setPlaybackSpeed(speed);
      set(state => ({
        settings: { ...state.settings, speed },
      }));
    } catch (error) {
      set({ error: 'Failed to change speed' });
    }
  },

  updatePosition: (position: number) => set({ position }),
  updateDuration: (duration: number) => set({ duration }),
  setError: (error: string | null) => set({ error }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
