import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Heart } from 'lucide-react-native';
import type { Listing } from '@/types';
import { formatPrice, formatDate } from '@/utils';
import { useFavorites } from '@/hooks';
import { ConditionBadge } from './ConditionBadge';

interface ListingCardProps {
  listing: Listing;
  testID?: string;
}

export function ListingCard({ listing, testID }: ListingCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(listing.id);

  return (
    <TouchableOpacity
      className="bg-white rounded-xl shadow-sm overflow-hidden"
      onPress={() => router.push(`/listings/${listing.id}`)}
      testID={testID}
    >
      <View className="relative">
        <Image
          source={{ uri: listing.images[0] }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <TouchableOpacity
          className="absolute top-2 right-2 bg-white/90 p-2 rounded-full"
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(listing.id);
          }}
          testID={`favorite-${listing.id}`}
        >
          <Heart
            size={20}
            color={favorite ? '#ef4444' : '#64748b'}
            fill={favorite ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>
        <View className="absolute bottom-2 left-2">
          <ConditionBadge condition={listing.condition} />
        </View>
      </View>

      <View className="p-3">
        <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={1}>
          {listing.title}
        </Text>

        <Text className="text-2xl font-bold text-primary-600 mb-2">
          {formatPrice(listing.price)}
        </Text>

        <View className="flex-row items-center mb-2">
          <MapPin size={14} color="#64748b" />
          <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
            {listing.location}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">{formatDate(listing.createdAt)}</Text>
          <Text className="text-xs text-gray-500">{listing.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
