import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/useShop';
import { Product } from '@/types';
import { ShoppingCart } from 'lucide-react-native';

export default function ShopScreen() {
  const { data: products, isLoading } = useProducts();

  const featuredProducts = products?.filter((p) => p.featured);
  const otherProducts = products?.filter((p) => !p.featured);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-team-primary p-6">
          <Text className="text-white text-3xl font-bold mb-1">Team Shop</Text>
          <Text className="text-white/90">Official Thunder FC Merchandise</Text>
        </View>

        <View className="p-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : (
            <>
              {/* Featured Products */}
              {featuredProducts && featuredProducts.length > 0 && (
                <View className="mb-6">
                  <Text className="text-2xl font-bold text-gray-900 mb-3">Featured</Text>
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} featured />
                  ))}
                </View>
              )}

              {/* All Products */}
              {otherProducts && otherProducts.length > 0 && (
                <View>
                  <Text className="text-2xl font-bold text-gray-900 mb-3">All Products</Text>
                  <View className="flex-row flex-wrap -mx-2">
                    {otherProducts.map((product) => (
                      <View key={product.id} className="w-1/2 px-2 mb-4">
                        <ProductCard product={product} />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  return (
    <TouchableOpacity
      className={`bg-white rounded-xl shadow-md overflow-hidden ${featured ? 'mb-3' : ''}`}
      testID={`product-${product.id}`}
    >
      <Image
        source={{ uri: product.image }}
        className={featured ? 'w-full h-48' : 'w-full h-32'}
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="font-bold text-gray-900 mb-1" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-sm text-gray-500 mb-2" numberOfLines={featured ? 2 : 1}>
          {product.description}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-team-primary">${product.price}</Text>
          {product.inStock ? (
            <View className="bg-team-primary rounded-full p-2">
              <ShoppingCart size={16} color="white" />
            </View>
          ) : (
            <Text className="text-sm text-red-500 font-semibold">Out of Stock</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
