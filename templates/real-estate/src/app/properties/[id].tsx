import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Share, Calendar } from 'lucide-react-native';
import { useProperty } from '@/hooks';
import { useSaved } from '@/hooks';
import { getAgentById } from '@/services';
import { useQuery } from '@tanstack/react-query';
import {
  ImageGallery,
  PropertyDetails,
  AgentCard,
  MapView,
  Button,
} from '@/components';
import { formatCurrency } from '@/utils';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: property, isLoading } = useProperty(id);
  const { isSaved, addSaved, removeSaved } = useSaved();

  const { data: agent } = useQuery({
    queryKey: ['agent', property?.agentId],
    queryFn: () => (property?.agentId ? getAgentById(property.agentId) : null),
    enabled: !!property?.agentId,
  });

  const saved = property ? isSaved(property.id) : false;

  const handleSaveToggle = () => {
    if (!property) return;
    if (saved) {
      removeSaved(property.id);
    } else {
      addSaved(property.id);
    }
  };

  const getPriceLabel = () => {
    if (!property) return '';
    if (property.status === 'for-rent') {
      return `${formatCurrency(property.price)}/mo`;
    }
    return formatCurrency(property.price);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-gray-500 text-center">Property not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white">
        <ImageGallery images={property.images} testID="property-gallery" />
      </View>

      <View className="p-4">
        {/* Header */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <View className="bg-primary-600 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold uppercase">
                {property.status === 'for-sale' ? 'For Sale' : 'For Rent'}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm ml-auto capitalize">
              {property.type}
            </Text>
          </View>

          <Text className="text-gray-900 font-bold text-3xl mb-2">
            {getPriceLabel()}
          </Text>

          <Text className="text-gray-900 font-semibold text-xl mb-2">
            {property.title}
          </Text>

          <Text className="text-gray-600">
            {property.address.street}, {property.address.city}, {property.address.state}{' '}
            {property.address.zipCode}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-row items-center px-4 py-3 bg-white border border-gray-300 rounded-lg"
            onPress={handleSaveToggle}
            testID="property-save-button"
          >
            <Heart
              size={20}
              color={saved ? '#ef4444' : '#6b7280'}
              fill={saved ? '#ef4444' : 'none'}
            />
            <Text className="text-gray-900 ml-2">
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center px-4 py-3 bg-white border border-gray-300 rounded-lg"
            testID="property-share-button"
          >
            <Share size={20} color="#6b7280" />
            <Text className="text-gray-900 ml-2">Share</Text>
          </TouchableOpacity>

          <Button
            title="Schedule Tour"
            variant="primary"
            className="flex-1"
            onPress={() => router.push(`/schedule-tour?propertyId=${property.id}`)}
            testID="schedule-tour-button"
          />
        </View>

        {/* Property Details */}
        <PropertyDetails property={property} testID="property-details" />

        {/* Map */}
        <View className="mb-4">
          <MapView property={property} testID="property-map" />
        </View>

        {/* Agent */}
        {agent && (
          <View className="mb-4">
            <Text className="text-gray-900 font-bold text-xl mb-3">Contact Agent</Text>
            <AgentCard agent={agent} testID="property-agent" />
          </View>
        )}

        {/* Bottom CTA */}
        <View className="mb-8">
          <Button
            title="Schedule a Tour"
            variant="primary"
            size="lg"
            onPress={() => router.push(`/schedule-tour?propertyId=${property.id}`)}
            testID="schedule-tour-bottom-button"
          />
        </View>
      </View>
    </ScrollView>
  );
}
