import { ScrollView, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { TourScheduler } from '@/components';

export default function ScheduleTourScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-gray-900 font-bold text-2xl mb-2">Schedule a Tour</Text>
        <Text className="text-gray-600 mb-6">
          Choose a date and time that works best for you
        </Text>

        {propertyId ? (
          <TourScheduler propertyId={propertyId} testID="tour-scheduler" />
        ) : (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Text className="text-yellow-800">
              Please select a property first to schedule a tour.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
