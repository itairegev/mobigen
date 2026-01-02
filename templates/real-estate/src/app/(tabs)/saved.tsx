import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useProperties, useSaved } from '@/hooks';
import { PropertyCard } from '@/components';

export default function SavedScreen() {
  const { savedPropertyIds } = useSaved();
  const { data: allProperties, isLoading } = useProperties();

  const savedProperties = allProperties?.filter((p) =>
    savedPropertyIds.includes(p.id)
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-gray-900 font-bold text-2xl mb-2">Saved Properties</Text>
        <Text className="text-gray-600 mb-6">
          {savedPropertyIds.length} {savedPropertyIds.length === 1 ? 'property' : 'properties'} saved
        </Text>

        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : savedProperties && savedProperties.length > 0 ? (
          savedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              testID={`saved-property-${property.id}`}
            />
          ))
        ) : (
          <View className="py-12 items-center">
            <Heart size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-center mt-4 text-lg">
              No saved properties yet
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Tap the heart icon on any property to save it here
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
