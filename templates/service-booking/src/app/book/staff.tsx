import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useStaffForService, useBooking } from '@/hooks';
import { StaffCard } from '@/components';

export default function SelectStaffScreen() {
  const { serviceId, staffId, setStaff, canProceedToDateTime } = useBooking();
  const { data: staff, isLoading } = useStaffForService(serviceId || '');

  const handleContinue = () => {
    if (canProceedToDateTime()) {
      router.push('/book/datetime');
    }
  };

  if (!serviceId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Please select a service first</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          testID="back-button"
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-900 ml-2">
          Select Staff Member
        </Text>
      </View>

      {/* Progress Indicator */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <View className="flex-1 h-2 bg-primary-600 rounded-full" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-primary-600 font-medium">Staff</Text>
          <Text className="text-xs text-gray-400">Date & Time</Text>
          <Text className="text-xs text-gray-400">Confirm</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0d9488" />
            <Text className="text-gray-500 mt-4">Loading staff...</Text>
          </View>
        ) : staff && staff.length > 0 ? (
          <>
            <Text className="text-gray-600 mb-4">
              Choose your preferred staff member
            </Text>
            {staff.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                selected={staffId === member.id}
                onPress={() => setStaff(member.id)}
                testID={`staff-option-${member.id}`}
              />
            ))}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500">No staff available for this service</Text>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canProceedToDateTime()}
          className={`rounded-xl py-4 items-center ${
            canProceedToDateTime() ? 'bg-primary-600' : 'bg-gray-300'
          }`}
          testID="continue-button"
        >
          <Text className="text-white font-semibold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
