import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useDogBreeds, useCatBreeds, useBreedSearch } from '@/hooks';
import { BreedCard } from '@/components';
import { Search, Dog, Cat, X } from 'lucide-react-native';

type FilterType = 'all' | 'dog' | 'cat';

export default function BreedsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: dogBreeds, loading: dogsLoading } = useDogBreeds();
  const { data: catBreeds, loading: catsLoading } = useCatBreeds();
  const { data: searchResults, loading: searchLoading } = useBreedSearch(searchQuery);

  const isLoading = dogsLoading || catsLoading;

  // Filter breeds based on selection
  const filteredBreeds = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }

    switch (filter) {
      case 'dog':
        return dogBreeds;
      case 'cat':
        return catBreeds;
      default:
        // Interleave dogs and cats
        const combined: any[] = [];
        const maxLen = Math.max(dogBreeds.length, catBreeds.length);
        for (let i = 0; i < maxLen && combined.length < 50; i++) {
          if (dogBreeds[i]) combined.push(dogBreeds[i]);
          if (catBreeds[i]) combined.push(catBreeds[i]);
        }
        return combined;
    }
  }, [filter, dogBreeds, catBreeds, searchQuery, searchResults]);

  const totalCount = useMemo(() => {
    if (filter === 'dog') return dogBreeds.length;
    if (filter === 'cat') return catBreeds.length;
    return dogBreeds.length + catBreeds.length;
  }, [filter, dogBreeds.length, catBreeds.length]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Discover Breeds',
          headerLargeTitle: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
        {/* Search Bar */}
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
            <Search size={20} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search breeds..."
              className="flex-1 ml-2 text-base text-gray-900"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              testID="breed-search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-4 py-3 bg-white border-b border-gray-100">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg mr-2 ${
              filter === 'all' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            testID="filter-all"
          >
            <Text
              className={`text-center font-semibold ${
                filter === 'all' ? 'text-white' : 'text-gray-600'
              }`}
            >
              All ({dogBreeds.length + catBreeds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('dog')}
            className={`flex-1 py-2 rounded-lg mr-2 flex-row items-center justify-center ${
              filter === 'dog' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            testID="filter-dogs"
          >
            <Text className="mr-1">🐕</Text>
            <Text
              className={`font-semibold ${
                filter === 'dog' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Dogs ({dogBreeds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('cat')}
            className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${
              filter === 'cat' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            testID="filter-cats"
          >
            <Text className="mr-1">🐱</Text>
            <Text
              className={`font-semibold ${
                filter === 'cat' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Cats ({catBreeds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="text-gray-500 mt-3">Loading breeds...</Text>
          </View>
        ) : searchLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#f97316" />
            <Text className="text-gray-500 mt-2">Searching...</Text>
          </View>
        ) : filteredBreeds.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-5xl mb-4">🔍</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              No breeds found
            </Text>
            <Text className="text-gray-500 text-center">
              {searchQuery
                ? `No breeds match "${searchQuery}"`
                : 'No breeds available'}
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            {/* Results count */}
            <Text className="text-sm text-gray-500 mb-3">
              {searchQuery
                ? `${filteredBreeds.length} results for "${searchQuery}"`
                : `Showing ${filteredBreeds.length} of ${totalCount} breeds`}
            </Text>

            {filteredBreeds.map((breed, index) => (
              <BreedCard
                key={`breed-${index}`}
                breed={breed}
                onPress={() => {
                  // Navigate to breed detail (to be implemented)
                  console.log('View breed:', breed);
                }}
                testID={`breed-item-${index}`}
              />
            ))}

            {/* Load more hint */}
            {filteredBreeds.length >= 50 && !searchQuery && (
              <View className="py-4 items-center">
                <Text className="text-gray-400 text-sm">
                  Showing first 50 breeds. Use search for more.
                </Text>
              </View>
            )}

            <View className="h-8" />
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}
