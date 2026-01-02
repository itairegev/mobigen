import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { TimeSlot } from '@/types';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  testID?: string;
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSlotSelect,
  testID,
}: TimeSlotGridProps) {
  const availableSlots = slots.filter((slot) => slot.available);
  const unavailableSlots = slots.filter((slot) => !slot.available);

  if (availableSlots.length === 0) {
    return (
      <View className="bg-yellow-50 p-6 rounded-xl" testID={testID}>
        <Text className="text-center text-yellow-800 font-medium">
          No available time slots for this date
        </Text>
        <Text className="text-center text-yellow-600 mt-2">
          Please select a different date or staff member
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 mb-4">
        Available Times
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {availableSlots.map((slot) => {
          const isSelected =
            selectedSlot && selectedSlot.startTime === slot.startTime;

          return (
            <TouchableOpacity
              key={slot.id}
              onPress={() => onSlotSelect(slot)}
              className={`px-6 py-3 rounded-lg mr-3 border-2 ${
                isSelected
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-300'
              }`}
              testID={`time-slot-${slot.startTime}`}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? 'text-white' : 'text-gray-900'
                }`}
              >
                {slot.startTime}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {unavailableSlots.length > 0 && (
        <View className="mt-4">
          <Text className="text-sm text-gray-500 mb-2">Unavailable</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {unavailableSlots.map((slot) => (
              <View
                key={slot.id}
                className="px-6 py-3 rounded-lg mr-3 bg-gray-100"
              >
                <Text className="text-sm text-gray-400 line-through">
                  {slot.startTime}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
