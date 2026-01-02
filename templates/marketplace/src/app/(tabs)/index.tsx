import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import { ListingCard } from '@/components';
import { useListings, useCategories } from '@/hooks';

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { listings, isLoading } = useListings();
  const { categories } = useCategories();

  const filteredListings = search
    ? listings.filter((l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search listings..."
            value={search}
            onChangeText={setSearch}
            testID="search-input"
          />
        </View>

        {/* Quick Categories */}
        <View className="flex-row gap-2 mt-3">
          {categories.slice(0, 4).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              className="px-3 py-2 rounded-full bg-primary-50 border border-primary-200"
              onPress={() => router.push(`/(tabs)/categories?category=${cat.id}`)}
              testID={`quick-cat-${cat.id}`}
            >
              <Text className="text-xs font-medium text-primary-700">{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredListings}
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
              {isLoading ? 'Loading listings...' : 'No listings found'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/listings/create')}
        testID="create-listing-fab"
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
