import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ListingCard } from '@/components';
import { useCategories, useListings } from '@/hooks';

export default function CategoriesScreen() {
  const params = useLocalSearchParams();
  const { categories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    (params.category as string) || null
  );
  const { listings, isLoading } = useListings(selectedCategory || undefined);

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category as string);
    }
  }, [params.category]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Category Tabs */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All' }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === item.id
                  ? 'bg-primary-500'
                  : 'bg-gray-100 border border-gray-300'
              }`}
              onPress={() => setSelectedCategory(item.id)}
              testID={`category-tab-${item.id || 'all'}`}
            >
              <Text
                className={`font-medium ${
                  selectedCategory === item.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Listings Grid */}
      <FlatList
        data={listings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-2"
        columnWrapperClassName="gap-2 px-2 py-1"
        renderItem={({ item }) => (
          <View className="flex-1">
            <ListingCard listing={item} testID={`listing-${item.id}`} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">
              {isLoading ? 'Loading...' : 'No listings in this category'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
