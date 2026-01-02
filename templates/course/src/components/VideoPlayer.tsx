import { useState, useRef } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';

interface VideoPlayerProps {
  source: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  testID?: string;
}

export function VideoPlayer({ source, onProgress, onComplete, testID }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<Video>(null);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setIsLoading(false);

    if (status.didJustFinish) {
      setIsPlaying(false);
      onComplete?.();
    }

    if (status.durationMillis && status.positionMillis) {
      const progress = (status.positionMillis / status.durationMillis) * 100;
      onProgress?.(progress);
    }
  };

  return (
    <View className="bg-black aspect-video" testID={testID}>
      <Video
        ref={videoRef}
        source={{ uri: source }}
        className="w-full h-full"
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoadStart={() => setIsLoading(true)}
      />

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}
