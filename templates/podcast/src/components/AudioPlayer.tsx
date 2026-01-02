import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Episode } from '../types';
import { formatDuration } from '../utils';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react-native';
import { ProgressSlider } from './ProgressSlider';

interface AudioPlayerProps {
  episode: Episode;
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onSeek: (position: number) => void;
  onClose?: () => void;
  testID?: string;
}

export function AudioPlayer({
  episode,
  isPlaying,
  position,
  duration,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
  onSeek,
  onClose,
  testID,
}: AudioPlayerProps) {
  return (
    <View className="bg-podcast-dark p-6" testID={testID}>
      {/* Episode Info */}
      <View className="flex-row items-center mb-6">
        <Image
          source={{ uri: episode.imageUrl || 'https://via.placeholder.com/80' }}
          className="w-20 h-20 rounded-lg"
        />
        <View className="flex-1 ml-4">
          <Text className="text-white font-semibold text-lg" numberOfLines={1}>
            {episode.title}
          </Text>
          <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
            Episode {episode.episodeNumber} • Season {episode.season}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} className="ml-2" testID={`${testID}-close`}>
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Slider */}
      <ProgressSlider
        position={position}
        duration={duration}
        onSeek={onSeek}
        testID={`${testID}-progress`}
      />

      {/* Time Labels */}
      <View className="flex-row justify-between mb-6">
        <Text className="text-gray-400 text-xs">{formatDuration(position)}</Text>
        <Text className="text-gray-400 text-xs">{formatDuration(duration)}</Text>
      </View>

      {/* Playback Controls */}
      <View className="flex-row items-center justify-center space-x-8">
        <TouchableOpacity
          onPress={onSkipBackward}
          className="p-3"
          testID={`${testID}-skip-back`}
        >
          <SkipBack size={32} color="white" />
          <Text className="text-white text-xs text-center mt-1">15s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPlayPause}
          className="bg-white rounded-full p-4"
          testID={`${testID}-play-pause`}
        >
          {isPlaying ? (
            <Pause size={36} color="#1e1b4b" fill="#1e1b4b" />
          ) : (
            <Play size={36} color="#1e1b4b" fill="#1e1b4b" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkipForward}
          className="p-3"
          testID={`${testID}-skip-forward`}
        >
          <SkipForward size={32} color="white" />
          <Text className="text-white text-xs text-center mt-1">30s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
