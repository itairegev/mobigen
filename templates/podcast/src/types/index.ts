// Episode & Series Types
export interface Episode {
  id: string;
  seriesId: string;
  title: string;
  description: string;
  duration: number; // seconds
  publishedAt: Date;
  audioUrl: string;
  imageUrl?: string;
  showNotes: string;
  exclusive: boolean;
  downloadable: boolean;
  playCount: number;
  season?: number;
  episodeNumber?: number;
}

export interface Series {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  episodeCount: number;
}

// Player State Types
export interface PlayState {
  isPlaying: boolean;
  currentEpisode: Episode | null;
  position: number; // seconds
  duration: number; // seconds
  isLoading: boolean;
  error: string | null;
}

export interface PlaybackSettings {
  speed: number; // 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2
  volume: number; // 0-1
  skipForward: number; // seconds (default 30)
  skipBackward: number; // seconds (default 15)
}

// Comment & Community Types
export interface Comment {
  id: string;
  episodeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: number; // seconds in episode
  createdAt: Date;
  likes: number;
  replies: Comment[];
}

// Download Types
export interface Download {
  episodeId: string;
  downloadedAt: Date;
  fileSize: number;
  localUri: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isSubscriber: boolean;
  favoriteEpisodeIds: string[];
}

// UI State Types
export interface PlayerUIState {
  showMiniPlayer: boolean;
  showFullPlayer: boolean;
  showSpeed: boolean;
}
