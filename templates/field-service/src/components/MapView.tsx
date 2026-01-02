import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import type { Location } from '../types';

interface MapViewProps {
  location: Location;
  testID?: string;
}

export function MapView({ location, testID }: MapViewProps) {
  const handleOpenMaps = () => {
    const { latitude, longitude } = location;
    const label = encodeURIComponent(location.address);

    let url = '';
    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
    } else {
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      }
    });
  };

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200" testID={testID}>
      {/* Map Preview (Static for now) */}
      <View className="bg-gray-100 rounded-lg h-48 items-center justify-center mb-4">
        <MapPin size={48} color="#6b7280" />
        <Text className="text-gray-500 text-sm mt-2">Map Preview</Text>
      </View>

      {/* Address */}
      <View className="mb-3">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Location</Text>
        <Text className="text-base text-gray-700">{location.address}</Text>
        <Text className="text-sm text-gray-600">
          {location.city}, {location.state} {location.zip}
        </Text>
      </View>

      {/* Instructions */}
      {location.instructions && (
        <View className="bg-blue-50 rounded-lg p-3 mb-4">
          <Text className="text-sm font-medium text-blue-900 mb-1">
            Access Instructions
          </Text>
          <Text className="text-sm text-blue-700">{location.instructions}</Text>
        </View>
      )}

      {/* Navigate Button */}
      <TouchableOpacity
        onPress={handleOpenMaps}
        className="flex-row items-center justify-center bg-blue-500 py-3 px-4 rounded-lg"
        testID="navigate-button"
      >
        <Navigation size={20} color="white" />
        <Text className="ml-2 text-white font-semibold text-base">
          Get Directions
        </Text>
      </TouchableOpacity>
    </View>
  );
}
