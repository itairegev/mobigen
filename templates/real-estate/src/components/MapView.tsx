import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Card } from './Card';
import type { Property } from '@/types';

interface MapViewProps {
  property: Property;
  testID?: string;
}

export function MapView({ property, testID }: MapViewProps) {
  const { address } = property;
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    Linking.openURL(url);
  };

  return (
    <Card className="p-4" testID={testID}>
      <View className="flex-row items-center mb-3">
        <MapPin size={20} color="#16a34a" />
        <Text className="text-gray-900 font-bold text-lg ml-2">Location</Text>
      </View>

      <Text className="text-gray-900 font-medium mb-1">{address.street}</Text>
      <Text className="text-gray-600 mb-4">
        {address.city}, {address.state} {address.zipCode}
      </Text>

      {/* Placeholder for actual map - would integrate with react-native-maps */}
      <View className="bg-gray-100 h-48 rounded-lg mb-4 items-center justify-center">
        <MapPin size={48} color="#9ca3af" />
        <Text className="text-gray-500 mt-2">Map View</Text>
      </View>

      <TouchableOpacity
        className="bg-navy-600 py-3 rounded-lg flex-row items-center justify-center"
        onPress={handleOpenMaps}
        testID={`${testID}-directions`}
      >
        <Navigation size={18} color="#fff" />
        <Text className="text-white font-semibold ml-2">Get Directions</Text>
      </TouchableOpacity>
    </Card>
  );
}
