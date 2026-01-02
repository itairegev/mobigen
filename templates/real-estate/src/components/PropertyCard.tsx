import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Bed, Bath, Maximize } from 'lucide-react-native';
import { formatCurrency, formatNumber } from '@/utils';
import type { Property } from '@/types';
import { useSaved } from '@/hooks';

interface PropertyCardProps {
  property: Property;
  testID?: string;
}

export function PropertyCard({ property, testID }: PropertyCardProps) {
  const router = useRouter();
  const { isSaved, addSaved, removeSaved } = useSaved();
  const saved = isSaved(property.id);

  const handleSaveToggle = () => {
    if (saved) {
      removeSaved(property.id);
    } else {
      addSaved(property.id);
    }
  };

  const getPriceLabel = () => {
    if (property.status === 'for-rent') {
      return `${formatCurrency(property.price)}/mo`;
    }
    return formatCurrency(property.price);
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm overflow-hidden mb-4"
      onPress={() => router.push(`/properties/${property.id}`)}
      testID={testID}
    >
      <View className="relative">
        <Image
          source={{ uri: property.images[0] }}
          className="w-full h-48 bg-gray-100"
          resizeMode="cover"
        />
        <TouchableOpacity
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow"
          onPress={handleSaveToggle}
          testID={`${testID}-favorite`}
        >
          <Heart size={20} color={saved ? '#ef4444' : '#9ca3af'} fill={saved ? '#ef4444' : 'none'} />
        </TouchableOpacity>
        <View className="absolute bottom-3 left-3 bg-primary-600 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-semibold uppercase">
            {property.status === 'for-sale' ? 'For Sale' : 'For Rent'}
          </Text>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-gray-500 text-sm mb-1 capitalize">
          {property.type}
        </Text>
        <Text className="text-gray-900 font-bold text-xl mb-2">
          {getPriceLabel()}
        </Text>
        <Text className="text-gray-900 font-medium mb-2" numberOfLines={1}>
          {property.title}
        </Text>
        <Text className="text-gray-500 text-sm mb-3" numberOfLines={1}>
          {property.address.street}, {property.address.city}, {property.address.state}
        </Text>

        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Bed size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-1">
              {property.bedrooms} bed
            </Text>
          </View>
          <View className="flex-row items-center">
            <Bath size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-1">
              {property.bathrooms} bath
            </Text>
          </View>
          <View className="flex-row items-center">
            <Maximize size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-1">
              {formatNumber(property.sqft)} sqft
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
