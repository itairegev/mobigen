import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export interface TimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  available: boolean;
}

export interface TimeSlotGridProps {
  date: Date;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  columns?: number;
  testID?: string;
}

export function TimeSlotGrid({
  date,
  slots,
  selectedSlot,
  onSlotSelect,
  columns = 3,
  testID,
}: TimeSlotGridProps) {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  return (
    <View className="bg-white rounded-xl p-4" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 mb-4">
        {formatDate(date)}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap -mx-1">
          {slots.map(slot => {
            const isSelected = selectedSlot?.id === slot.id;
            const isDisabled = !slot.available;

            return (
              <View
                key={slot.id}
                className={`px-1 mb-2`}
                style={{ width: `${100 / columns}%` }}
              >
                <TouchableOpacity
                  onPress={() => !isDisabled && onSlotSelect(slot)}
                  disabled={isDisabled}
                  className={`py-3 px-2 rounded-lg border ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : isDisabled
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                  testID={`${testID}-slot-${slot.id}`}
                >
                  <Text
                    className={`text-center text-sm font-medium ${
                      isSelected
                        ? 'text-white'
                        : isDisabled
                        ? 'text-gray-400'
                        : 'text-gray-900'
                    }`}
                  >
                    {slot.startTime}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {slots.length === 0 && (
          <View className="py-8">
            <Text className="text-center text-gray-500">
              No time slots available for this date
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
