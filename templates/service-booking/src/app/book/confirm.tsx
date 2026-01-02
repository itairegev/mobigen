import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useBooking, useService, useStaffMember, useCreateAppointment } from '@/hooks';
import { BookingSummary } from '@/components';

export default function ConfirmBookingScreen() {
  const { serviceId, staffId, date, timeSlot, notes, setNotes, reset } = useBooking();
  const { data: service } = useService(serviceId || '');
  const { data: staff } = useStaffMember(staffId || '');
  const createAppointment = useCreateAppointment();

  const handleConfirmBooking = async () => {
    if (!serviceId || !staffId || !date || !timeSlot) {
      Alert.alert('Error', 'Missing booking information');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        serviceId,
        staffId,
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: 'upcoming',
        notes: notes || undefined,
      });

      Alert.alert(
        'Booking Confirmed!',
        'Your appointment has been successfully booked.',
        [
          {
            text: 'OK',
            onPress: () => {
              reset();
              router.replace('/(tabs)/appointments');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    }
  };

  if (!service || !staff || !date || !timeSlot) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Missing booking information</Text>
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
          Confirm Booking
        </Text>
      </View>

      {/* Progress Indicator */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <View className="flex-1 h-2 bg-primary-600 rounded-full" />
          <View className="flex-1 h-2 bg-primary-600 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-primary-600 rounded-full ml-2" />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-primary-600 font-medium">Staff</Text>
          <Text className="text-xs text-primary-600 font-medium">Date & Time</Text>
          <Text className="text-xs text-primary-600 font-medium">Confirm</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Booking Summary */}
        <BookingSummary
          serviceName={service.name}
          servicePrice={service.price}
          serviceDuration={service.duration}
          staffName={staff.name}
          date={date}
          timeSlot={timeSlot}
          notes={notes}
          testID="booking-summary"
        />

        {/* Notes Section */}
        <View className="bg-white rounded-xl p-6 mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Additional Notes (Optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special requests or preferences?"
            multiline
            numberOfLines={4}
            className="bg-gray-50 rounded-lg p-4 text-gray-900"
            style={{ textAlignVertical: 'top' }}
            testID="notes-input"
          />
        </View>

        {/* Cancellation Policy */}
        <View className="bg-yellow-50 rounded-xl p-4 mt-4 mb-4">
          <Text className="text-sm font-semibold text-yellow-900 mb-2">
            Cancellation Policy
          </Text>
          <Text className="text-sm text-yellow-800">
            Free cancellation up to 24 hours before your appointment. Late cancellations may incur a fee.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleConfirmBooking}
          disabled={createAppointment.isPending}
          className={`rounded-xl py-4 items-center ${
            createAppointment.isPending ? 'bg-gray-300' : 'bg-primary-600'
          }`}
          testID="confirm-booking-button"
        >
          <Text className="text-white font-semibold text-lg">
            {createAppointment.isPending ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
