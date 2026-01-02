import { View, Text } from 'react-native';
import { Bed, Bath, Maximize, Calendar, MapPin, Home } from 'lucide-react-native';
import { Card } from './Card';
import { formatNumber } from '@/utils';
import type { Property } from '@/types';

interface PropertyDetailsProps {
  property: Property;
  testID?: string;
}

export function PropertyDetails({ property, testID }: PropertyDetailsProps) {
  return (
    <View testID={testID}>
      <Card className="p-4 mb-4">
        <Text className="text-gray-900 font-bold text-lg mb-4">Property Details</Text>
        <View className="space-y-3">
          <View className="flex-row items-center">
            <Bed size={20} color="#6b7280" />
            <Text className="text-gray-600 ml-3 flex-1">Bedrooms</Text>
            <Text className="text-gray-900 font-semibold">{property.bedrooms}</Text>
          </View>
          <View className="flex-row items-center">
            <Bath size={20} color="#6b7280" />
            <Text className="text-gray-600 ml-3 flex-1">Bathrooms</Text>
            <Text className="text-gray-900 font-semibold">{property.bathrooms}</Text>
          </View>
          <View className="flex-row items-center">
            <Maximize size={20} color="#6b7280" />
            <Text className="text-gray-600 ml-3 flex-1">Square Feet</Text>
            <Text className="text-gray-900 font-semibold">{formatNumber(property.sqft)}</Text>
          </View>
          {property.lotSize && (
            <View className="flex-row items-center">
              <MapPin size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-3 flex-1">Lot Size</Text>
              <Text className="text-gray-900 font-semibold">
                {formatNumber(property.lotSize)} sqft
              </Text>
            </View>
          )}
          {property.yearBuilt && (
            <View className="flex-row items-center">
              <Calendar size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-3 flex-1">Year Built</Text>
              <Text className="text-gray-900 font-semibold">{property.yearBuilt}</Text>
            </View>
          )}
          <View className="flex-row items-center">
            <Home size={20} color="#6b7280" />
            <Text className="text-gray-600 ml-3 flex-1">Property Type</Text>
            <Text className="text-gray-900 font-semibold capitalize">{property.type}</Text>
          </View>
          {property.pricePerSqft && (
            <View className="flex-row items-center">
              <Text className="text-gray-600 ml-8 flex-1">Price per Sqft</Text>
              <Text className="text-gray-900 font-semibold">
                ${property.pricePerSqft.toFixed(0)}
              </Text>
            </View>
          )}
        </View>
      </Card>

      <Card className="p-4 mb-4">
        <Text className="text-gray-900 font-bold text-lg mb-3">Description</Text>
        <Text className="text-gray-600 leading-6">{property.description}</Text>
      </Card>

      <Card className="p-4">
        <Text className="text-gray-900 font-bold text-lg mb-3">Features & Amenities</Text>
        <View className="flex-row flex-wrap gap-2">
          {property.features.map((feature, index) => (
            <View
              key={index}
              className="bg-primary-50 px-3 py-2 rounded-full"
            >
              <Text className="text-primary-700 text-sm">{feature}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
