import { View, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ProductCard } from '@/components';
import { useProducts } from '@/hooks/useProducts';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const { products, isLoading } = useProducts();

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-4">
        <TextInput
          className="bg-white px-4 py-3 rounded-lg border border-gray-200"
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          testID="search-input"
        />
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-2 pb-4"
        columnWrapperClassName="gap-2"
        renderItem={({ item }) => (
          <View className="flex-1 p-2">
            <ProductCard product={item} testID={`product-${item.id}`} />
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-gray-500">
              {isLoading ? 'Loading...' : 'No products found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
