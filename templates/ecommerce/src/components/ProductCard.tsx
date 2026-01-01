import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { formatCurrency } from '@/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  testID?: string;
}

export function ProductCard({ product, testID }: ProductCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm overflow-hidden"
      onPress={() => router.push(`/product/${product.id}`)}
      testID={testID}
    >
      <View className="relative">
        <Image
          source={{ uri: product.image }}
          className="w-full h-32 bg-gray-100"
          resizeMode="cover"
        />
        <TouchableOpacity
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow"
          testID={`${testID}-favorite`}
        >
          <Heart size={16} color="#9ca3af" />
        </TouchableOpacity>
        {product.discount && (
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded">
            <Text className="text-white text-xs font-medium">
              -{product.discount}%
            </Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <Text className="text-gray-500 text-xs mb-1">{product.category}</Text>
        <Text className="text-gray-900 font-medium mb-1" numberOfLines={2}>
          {product.name}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-primary-500 font-bold">
            {formatCurrency(product.price)}
          </Text>
          {product.originalPrice && (
            <Text className="text-gray-400 text-sm line-through ml-2">
              {formatCurrency(product.originalPrice)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
