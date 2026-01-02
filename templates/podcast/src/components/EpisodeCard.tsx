import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Episode } from '../types';
import { formatDuration, formatRelativeDate } from '../utils';
import { Play, Download, Lock } from 'lucide-react-native';

interface EpisodeCardProps {
  episode: Episode;
  onPress: () => void;
  onPlayPress?: () => void;
  testID?: string;
}

export function EpisodeCard({ episode, onPress, onPlayPress, testID }: EpisodeCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm"
      testID={testID}
    >
      <View className="flex-row p-4">
        {/* Episode Image */}
        <View className="relative">
          <Image
            source={{ uri: episode.imageUrl || 'https://via.placeholder.com/100' }}
            className="w-24 h-24 rounded-lg"
          />
          {episode.exclusive && (
            <View className="absolute top-1 right-1 bg-primary-500 rounded-full p-1">
              <Lock size={12} color="white" />
            </View>
          )}
        </View>

        {/* Episode Info */}
        <View className="flex-1 ml-4">
          <Text
            className="text-base font-semibold text-gray-900 dark:text-white mb-1"
            numberOfLines={2}
          >
            {episode.title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2" numberOfLines={2}>
            {episode.description}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3">
              <Text className="text-xs text-gray-500 dark:text-gray-500">
                {formatDuration(episode.duration)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-500">•</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-500">
                {formatRelativeDate(episode.publishedAt)}
              </Text>
            </View>

            {onPlayPress && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onPlayPress();
                }}
                className="bg-primary-500 rounded-full p-2"
                testID={`${testID}-play`}
              >
                <Play size={16} color="white" fill="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
