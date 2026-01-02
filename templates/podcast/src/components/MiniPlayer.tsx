import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Episode } from '../types';
import { Play, Pause } from 'lucide-react-native';

interface MiniPlayerProps {
  episode: Episode;
  isPlaying: boolean;
  onPress: () => void;
  onPlayPause: () => void;
  testID?: string;
}

export function MiniPlayer({
  episode,
  isPlaying,
  onPress,
  onPlayPause,
  testID,
}: MiniPlayerProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-podcast-dark border-t border-gray-700"
      testID={testID}
    >
      <View className="flex-row items-center px-4 py-3">
        <Image
          source={{ uri: episode.imageUrl || 'https://via.placeholder.com/48' }}
          className="w-12 h-12 rounded-md"
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-medium text-sm" numberOfLines={1}>
            {episode.title}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
            Now Playing
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          className="bg-primary-500 rounded-full p-2 ml-3"
          testID={`${testID}-play-pause`}
        >
          {isPlaying ? (
            <Pause size={20} color="white" fill="white" />
          ) : (
            <Play size={20} color="white" fill="white" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
