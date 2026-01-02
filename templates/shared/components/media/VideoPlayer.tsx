import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';

export interface VideoPlayerProps {
  source: string;
  poster?: string;
  autoPlay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  testID?: string;
}

export function VideoPlayer({
  source,
  poster,
  autoPlay = false,
  onProgress,
  onComplete,
  testID,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Note: In a real implementation, you would use expo-av or react-native-video
  // This is a simplified version for demonstration

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number) => {
    setProgress(value);
    onProgress?.(value);
  };

  return (
    <View className="bg-black rounded-lg overflow-hidden" testID={testID}>
      {/* Video container */}
      <View className="aspect-video bg-gray-900 items-center justify-center relative">
        {isLoading && (
          <ActivityIndicator size="large" color="#ffffff" />
        )}

        {/* Play/Pause overlay */}
        <TouchableOpacity
          onPress={togglePlayPause}
          className="absolute inset-0 items-center justify-center"
          activeOpacity={0.8}
          testID={`${testID}-play-pause`}
        >
          {!isPlaying && !isLoading && (
            <View className="w-16 h-16 bg-white/30 rounded-full items-center justify-center">
              <Text className="text-white text-3xl ml-1">▶</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Source info (placeholder) */}
        <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded">
          <Text className="text-white text-xs">{source.split('/').pop()}</Text>
        </View>
      </View>

      {/* Controls */}
      <View className="bg-gray-900 px-4 py-3">
        {/* Progress bar */}
        <View className="mb-2">
          <View className="h-1 bg-gray-700 rounded-full">
            <View
              className="h-1 bg-blue-500 rounded-full"
              style={{ width: `${(progress / duration) * 100}%` }}
            />
          </View>
        </View>

        {/* Time display */}
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-xs">
            {formatTime(progress)} / {formatTime(duration || 0)}
          </Text>

          {/* Control buttons */}
          <View className="flex-row items-center">
            <TouchableOpacity className="px-3" testID={`${testID}-rewind`}>
              <Text className="text-white">⏪</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              className="px-3"
              testID={`${testID}-control`}
            >
              <Text className="text-white text-lg">
                {isPlaying ? '⏸' : '▶️'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="px-3" testID={`${testID}-forward`}>
              <Text className="text-white">⏩</Text>
            </TouchableOpacity>

            <TouchableOpacity className="px-3" testID={`${testID}-fullscreen`}>
              <Text className="text-white">⛶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
