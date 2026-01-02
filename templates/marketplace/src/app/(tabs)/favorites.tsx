import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListingCard } from '@/components';
import { useListings, useFavorites } from '@/hooks';

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const { listings } = useListings();

  const favoriteListings = listings.filter((listing) => favorites.includes(listing.id));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={favoriteListings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-2"
        columnWrapperClassName="gap-2 px-2 py-1"
        renderItem={({ item }) => (
          <View className="flex-1">
            <ListingCard listing={item} testID={`favorite-listing-${item.id}`} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">No favorites yet</Text>
            <Text className="text-gray-400 text-sm mt-2">
              Tap the heart icon on listings to save them here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
