import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEpisode } from '../../hooks/useEpisodes';
import { usePlayer } from '../../hooks';
import { ShowNotes } from '../../components';
import { formatDuration, formatRelativeDate } from '../../utils';
import { Play, Download, Share2, Lock } from 'lucide-react-native';
import { useState } from 'react';

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: episode, isLoading } = useEpisode(id);
  const { loadAndPlay, currentEpisode } = usePlayer();
  const [showNotes, setShowNotes] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!episode) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 p-6">
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          Episode not found
        </Text>
      </View>
    );
  }

  const isCurrentEpisode = currentEpisode?.id === episode.id;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Episode Image */}
      <View className="relative">
        <Image
          source={{ uri: episode.imageUrl || 'https://via.placeholder.com/400' }}
          className="w-full h-96"
          resizeMode="cover"
        />
        {episode.exclusive && (
          <View className="absolute top-4 right-4 bg-primary-500 rounded-full px-3 py-1 flex-row items-center">
            <Lock size={12} color="white" />
            <Text className="text-white text-xs font-semibold ml-1">Exclusive</Text>
          </View>
        )}
      </View>

      {/* Episode Info */}
      <View className="p-6">
        {/* Title & Meta */}
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {episode.title}
        </Text>

        <View className="flex-row items-center mb-4">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Episode {episode.episodeNumber}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mx-2">•</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Season {episode.season}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mx-2">•</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {formatDuration(episode.duration)}
          </Text>
        </View>

        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {formatRelativeDate(episode.publishedAt)}
        </Text>

        {/* Description */}
        <Text className="text-base text-gray-700 dark:text-gray-300 leading-6 mb-6">
          {episode.description}
        </Text>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-6">
          <TouchableOpacity
            onPress={() => {
              if (!isCurrentEpisode) {
                loadAndPlay(episode);
              }
              router.push('/player');
            }}
            className="flex-1 bg-primary-500 rounded-full flex-row items-center justify-center py-4"
            testID="play-button"
          >
            <Play size={20} color="white" fill="white" />
            <Text className="text-white font-semibold ml-2">
              {isCurrentEpisode ? 'Now Playing' : 'Play Episode'}
            </Text>
          </TouchableOpacity>

          {episode.downloadable && (
            <TouchableOpacity
              className="bg-gray-100 dark:bg-gray-800 rounded-full p-4"
              testID="download-button"
            >
              <Download size={20} color="#8b5cf6" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-gray-100 dark:bg-gray-800 rounded-full p-4"
            testID="share-button"
          >
            <Share2 size={20} color="#8b5cf6" />
          </TouchableOpacity>
        </View>

        {/* Show Notes Tab */}
        <View className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <TouchableOpacity
            onPress={() => setShowNotes(!showNotes)}
            className="mb-4"
            testID="show-notes-toggle"
          >
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Show Notes {showNotes ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {showNotes && (
            <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-gray-700 dark:text-gray-300 leading-6 whitespace-pre-line">
                {episode.showNotes}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="mt-6 flex-row items-center">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {episode.playCount.toLocaleString()} plays
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
