import { Audio, AVPlaybackStatus } from 'expo-av';
import { Episode } from '../types';

/**
 * Audio player service using Expo AV
 * Manages playback state and controls
 */
class PlayerService {
  private sound: Audio.Sound | null = null;
  private currentEpisode: Episode | null = null;

  async loadEpisode(episode: Episode): Promise<void> {
    // Unload previous audio
    if (this.sound) {
      await this.sound.unloadAsync();
    }

    // Configure audio mode for background playback
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    // Load new audio
    const { sound } = await Audio.Sound.createAsync(
      { uri: episode.audioUrl },
      { shouldPlay: false },
      this.onPlaybackStatusUpdate
    );

    this.sound = sound;
    this.currentEpisode = episode;
  }

  async play(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
    }
  }

  async seekTo(positionMillis: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
    }
  }

  async setPlaybackSpeed(rate: number): Promise<void> {
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  async skipForward(seconds: number = 30): Promise<void> {
    if (this.sound) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min(
          status.positionMillis + seconds * 1000,
          status.durationMillis || 0
        );
        await this.sound.setPositionAsync(newPosition);
      }
    }
  }

  async skipBackward(seconds: number = 15): Promise<void> {
    if (this.sound) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - seconds * 1000);
        await this.sound.setPositionAsync(newPosition);
      }
    }
  }

  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
      this.currentEpisode = null;
    }
  }

  getCurrentEpisode(): Episode | null {
    return this.currentEpisode;
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    // This callback can be used to update UI state
    // Listeners can be added via event emitters if needed
  };
}

export const playerService = new PlayerService();
