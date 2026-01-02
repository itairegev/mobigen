import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListingCard } from '@/components';
import { useListings } from '@/hooks';

// Filter for current user's listings
const MY_SELLER_ID = 'me';

export default function MyListingsScreen() {
  const { listings, isLoading } = useListings();

  // In a real app, this would filter by current user ID from auth
  const myListings = listings.filter((listing) => listing.sellerId === MY_SELLER_ID);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={myListings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-2"
        columnWrapperClassName="gap-2 px-2 py-1"
        renderItem={({ item }) => (
          <View className="flex-1">
            <ListingCard listing={item} testID={`my-listing-${item.id}`} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">
              {isLoading ? 'Loading...' : 'No active listings'}
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              Create your first listing to start selling!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
