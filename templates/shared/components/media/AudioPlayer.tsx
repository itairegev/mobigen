import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';

export interface AudioPlayerProps {
  source: string;
  title?: string;
  artist?: string;
  artwork?: string;
  autoPlay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  testID?: string;
}

export function AudioPlayer({
  source,
  title,
  artist,
  artwork,
  autoPlay = false,
  onProgress,
  onComplete,
  testID,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Note: In a real implementation, you would use expo-av
  // This is a simplified version for demonstration

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-white rounded-xl p-4 border border-gray-200" testID={testID}>
      {/* Artwork and info */}
      <View className="flex-row items-center mb-4">
        {artwork ? (
          <Image
            source={{ uri: artwork }}
            className="w-16 h-16 rounded-lg mr-3"
          />
        ) : (
          <View className="w-16 h-16 rounded-lg bg-gray-200 items-center justify-center mr-3">
            <Text className="text-gray-400 text-2xl">🎵</Text>
          </View>
        )}

        <View className="flex-1">
          {title && (
            <Text className="text-base font-semibold text-gray-900 mb-1">
              {title}
            </Text>
          )}
          {artist && (
            <Text className="text-sm text-gray-500">{artist}</Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View className="mb-2">
        <View className="h-1.5 bg-gray-200 rounded-full">
          <View
            className="h-1.5 bg-blue-500 rounded-full"
            style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
          />
        </View>
      </View>

      {/* Time display */}
      <View className="flex-row justify-between mb-3">
        <Text className="text-xs text-gray-500">
          {formatTime(progress)}
        </Text>
        <Text className="text-xs text-gray-500">
          {formatTime(duration || 0)}
        </Text>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-center">
        <TouchableOpacity
          className="p-2"
          testID={`${testID}-rewind`}
        >
          <Text className="text-gray-600 text-xl">⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2 mx-4"
          testID={`${testID}-backward`}
        >
          <Text className="text-gray-600 text-2xl">⏪</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlayPause}
          className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center"
          testID={`${testID}-play-pause`}
        >
          <Text className="text-white text-2xl">
            {isPlaying ? '⏸' : '▶️'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2 mx-4"
          testID={`${testID}-forward`}
        >
          <Text className="text-gray-600 text-2xl">⏩</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2"
          testID={`${testID}-next`}
        >
          <Text className="text-gray-600 text-xl">⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
