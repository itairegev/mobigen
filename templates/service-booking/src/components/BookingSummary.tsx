import { View, Text } from 'react-native';
import { Calendar, Clock, User, Scissors, DollarSign } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';

interface BookingSummaryProps {
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName: string;
  date: string;
  timeSlot: { startTime: string; endTime: string };
  notes?: string;
  testID?: string;
}

export function BookingSummary({
  serviceName,
  servicePrice,
  serviceDuration,
  staffName,
  date,
  timeSlot,
  notes,
  testID,
}: BookingSummaryProps) {
  return (
    <View className="bg-white rounded-xl p-6" testID={testID}>
      <Text className="text-xl font-bold text-gray-900 mb-6">
        Booking Summary
      </Text>

      <View className="space-y-4">
        <View className="flex-row items-start">
          <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
            <Scissors size={20} color="#0d9488" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-sm text-gray-500 mb-1">Service</Text>
            <Text className="text-base font-semibold text-gray-900">
              {serviceName}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {serviceDuration} minutes
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="w-10 h-10 bg-secondary-100 rounded-full items-center justify-center">
            <User size={20} color="#9333ea" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-sm text-gray-500 mb-1">Staff Member</Text>
            <Text className="text-base font-semibold text-gray-900">
              {staffName}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
            <Calendar size={20} color="#3b82f6" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-sm text-gray-500 mb-1">Date</Text>
            <Text className="text-base font-semibold text-gray-900">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center">
            <Clock size={20} color="#f59e0b" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-sm text-gray-500 mb-1">Time</Text>
            <Text className="text-base font-semibold text-gray-900">
              {timeSlot.startTime} - {timeSlot.endTime}
            </Text>
          </View>
        </View>

        {notes && (
          <View className="p-4 bg-gray-50 rounded-lg">
            <Text className="text-sm text-gray-500 mb-2">Notes</Text>
            <Text className="text-base text-gray-700">{notes}</Text>
          </View>
        )}

        <View className="border-t border-gray-200 pt-4 mt-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-gray-900">Total</Text>
            <View className="flex-row items-center">
              <DollarSign size={20} color="#0d9488" />
              <Text className="text-2xl font-bold text-primary-600">
                {servicePrice}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
