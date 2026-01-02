import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { MapPin, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useListing, useFavorites, useCreateConversation } from '@/hooks';
import { SellerCard, ConditionBadge, Button } from '@/components';
import { formatPrice, formatDate } from '@/utils';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { listing, isLoading } = useListing(params.id as string);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { createConversation, isCreating } = useCreateConversation();
  const [activeImage, setActiveImage] = useState(0);

  const handleContactSeller = async () => {
    if (!listing) return;

    try {
      const conversation = await createConversation({
        listingId: listing.id,
        message: `Hi! I'm interested in "${listing.title}"`,
      });
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (isLoading || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(listing.id);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Image Carousel */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(index);
            }}
            scrollEventThrottle={16}
          >
            {listing.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{ width, height: 400 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image Indicator */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {listing.images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === activeImage ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View className="absolute top-4 right-4 flex-row gap-2">
            <TouchableOpacity
              className="bg-white/90 p-3 rounded-full shadow-lg"
              onPress={() => toggleFavorite(listing.id)}
              testID="favorite-button"
            >
              <Heart
                size={24}
                color={favorite ? '#ef4444' : '#64748b'}
                fill={favorite ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white/90 p-3 rounded-full shadow-lg"
              testID="share-button"
            >
              <Share2 size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Title and Price */}
          <View className="mb-4">
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-2xl font-bold text-gray-900 flex-1 mr-2">
                {listing.title}
              </Text>
              <ConditionBadge condition={listing.condition} />
            </View>

            <Text className="text-3xl font-bold text-primary-600">
              {formatPrice(listing.price)}
            </Text>
          </View>

          {/* Location and Date */}
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <MapPin size={16} color="#64748b" />
              <Text className="text-gray-600 ml-1">{listing.location}</Text>
            </View>
            <Text className="text-sm text-gray-500">
              Listed {formatDate(listing.createdAt)}
            </Text>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Description</Text>
            <Text className="text-gray-700 leading-6">{listing.description}</Text>
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-1">Category</Text>
            <View className="bg-gray-100 px-3 py-2 rounded-lg self-start">
              <Text className="text-gray-900">{listing.category}</Text>
            </View>
          </View>

          {/* Seller Card */}
          <SellerCard seller={listing.seller} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <Button
          title="Contact Seller"
          onPress={handleContactSeller}
          loading={isCreating}
          testID="contact-seller-button"
        />
      </View>
    </SafeAreaView>
  );
}
