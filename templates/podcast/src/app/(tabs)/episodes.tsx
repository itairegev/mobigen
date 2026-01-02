import { View, Text, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useEpisodes, useSearchEpisodes } from '../../hooks/useEpisodes';
import { usePlayer } from '../../hooks';
import { EpisodeCard } from '../../components';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';

export default function EpisodesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allEpisodes, isLoading: isLoadingAll } = useEpisodes();
  const { data: searchResults, isLoading: isSearching } = useSearchEpisodes(searchQuery);
  const { loadAndPlay } = usePlayer();

  const episodes = searchQuery ? searchResults : allEpisodes;
  const isLoading = searchQuery ? isSearching : isLoadingAll;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Search Bar */}
      <View className="p-4 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
          <Search size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search episodes..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900 dark:text-white"
            testID="search-input"
          />
        </View>
      </View>

      {/* Episodes List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <EpisodeCard
                episode={item}
                onPress={() => router.push(`/episodes/${item.id}`)}
                onPlayPress={() => loadAndPlay(item)}
                testID={`episode-${item.id}`}
              />
            </View>
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                {searchQuery ? 'No episodes found' : 'No episodes available'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
