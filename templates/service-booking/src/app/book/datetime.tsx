import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { format } from 'date-fns';
import { useBooking, useAvailableSlots } from '@/hooks';
import { CalendarPicker, TimeSlotGrid } from '@/components';

export default function SelectDateTimeScreen() {
  const { staffId, date, setDate, timeSlot, setTimeSlot, canProceedToConfirm } = useBooking();
  const [selectedDate, setSelectedDate] = useState<Date | null>(date ? new Date(date) : null);

  const { data: slots, isLoading } = useAvailableSlots(
    staffId || '',
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDate(format(date, 'yyyy-MM-dd'));
    setTimeSlot(null as any); // Reset time slot when date changes
  };

  const handleContinue = () => {
    if (canProceedToConfirm()) {
      router.push('/book/confirm');
    }
  };

  if (!staffId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Please select a staff member first</Text>
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
          Select Date & Time
        </Text>
      </View>

      {/* Progress Indicator */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <View className="flex-1 h-2 bg-primary-600 rounded-full" />
          <View className="flex-1 h-2 bg-primary-600 rounded-full ml-2" />
          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-primary-600 font-medium">Staff</Text>
          <Text className="text-xs text-primary-600 font-medium">Date & Time</Text>
          <Text className="text-xs text-gray-400">Confirm</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Calendar */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Select Date
          </Text>
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            testID="calendar-picker"
          />
        </View>

        {/* Time Slots */}
        {selectedDate && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Select Time
            </Text>
            {isLoading ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <ActivityIndicator size="large" color="#0d9488" />
                <Text className="text-gray-500 mt-4">Loading available times...</Text>
              </View>
            ) : slots ? (
              <TimeSlotGrid
                slots={slots}
                selectedSlot={timeSlot}
                onSlotSelect={setTimeSlot}
                testID="time-slot-grid"
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canProceedToConfirm()}
          className={`rounded-xl py-4 items-center ${
            canProceedToConfirm() ? 'bg-primary-600' : 'bg-gray-300'
          }`}
          testID="continue-button"
        >
          <Text className="text-white font-semibold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
