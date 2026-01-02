import { View, Text, Image } from 'react-native';
import { Star } from 'lucide-react-native';
import type { Seller } from '@/types';
import { formatDate } from '@/utils';

interface SellerCardProps {
  seller: Seller;
  testID?: string;
}

export function SellerCard({ seller, testID }: SellerCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm" testID={testID}>
      <Text className="text-sm font-semibold text-gray-700 mb-3">Seller Information</Text>

      <View className="flex-row items-center">
        <Image
          source={{ uri: seller.avatar }}
          className="w-12 h-12 rounded-full mr-3"
        />

        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{seller.name}</Text>

          <View className="flex-row items-center mt-1">
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-sm text-gray-600 ml-1">
              {seller.rating.toFixed(1)} ({seller.reviewCount} reviews)
            </Text>
          </View>

          <Text className="text-xs text-gray-500 mt-1">
            Joined {formatDate(seller.joinedDate)} • {seller.activeListings} active listings
          </Text>
        </View>
      </View>
    </View>
  );
}
