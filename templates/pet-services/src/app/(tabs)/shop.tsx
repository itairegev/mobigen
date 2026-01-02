import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services';
import { PetProduct } from '@/types';
import { Star, ShoppingCart } from 'lucide-react-native';

export default function ShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState<PetProduct['category'] | 'all'>('all');
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () =>
      selectedCategory === 'all' ? getProducts() : getProducts(selectedCategory),
  });

  const categories = [
    { id: 'all', name: 'All', emoji: '🛍️' },
    { id: 'food', name: 'Food', emoji: '🍖' },
    { id: 'toys', name: 'Toys', emoji: '🎾' },
    { id: 'accessories', name: 'Accessories', emoji: '🎀' },
    { id: 'medicine', name: 'Medicine', emoji: '💊' },
    { id: 'grooming', name: 'Grooming', emoji: '✂️' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 py-4 border-b border-gray-200 bg-white"
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id as any)}
                className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${
                  isSelected ? 'bg-primary-500' : 'bg-gray-100'
                }`}
                testID={`category-${category.id}`}
              >
                <Text className="text-xl mr-2">{category.emoji}</Text>
                <Text
                  className={`font-semibold ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products Grid */}
        <ScrollView className="flex-1 px-6 py-4">
          {isLoading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading products...</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-2">
              {products.map((product) => (
                <View key={product.id} className="w-1/2 px-2 mb-4">
                  <TouchableOpacity
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                    testID={`product-${product.id}`}
                  >
                    <Image
                      source={{ uri: product.image }}
                      className="w-full h-40 bg-gray-200"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text
                        className="text-sm font-semibold text-gray-900 mb-1"
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>

                      <View className="flex-row items-center mb-2">
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Text className="text-xs text-gray-600 ml-1">
                          {product.rating} ({product.reviewCount})
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-primary-600">
                          ${product.price}
                        </Text>
                        <TouchableOpacity
                          className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center"
                          testID={`add-to-cart-${product.id}`}
                        >
                          <ShoppingCart size={16} color="#f97316" />
                        </TouchableOpacity>
                      </View>

                      {!product.inStock && (
                        <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded">
                          <Text className="text-white text-xs font-semibold">
                            Out of Stock
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
