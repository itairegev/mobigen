import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, Clock, User, MapPin } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import type { Appointment } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  serviceName?: string;
  staffName?: string;
  onPress: () => void;
  testID?: string;
}

export function AppointmentCard({
  appointment,
  serviceName = 'Service',
  staffName = 'Staff Member',
  onPress,
  testID,
}: AppointmentCardProps) {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusColor = statusColors[appointment.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      testID={testID}
    >
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-lg font-semibold text-gray-900 flex-1">
          {serviceName}
        </Text>
        <View className={`px-3 py-1 rounded-full ${statusColor}`}>
          <Text className="text-xs font-medium capitalize">
            {appointment.status}
          </Text>
        </View>
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center">
          <User size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-2">{staffName}</Text>
        </View>

        <View className="flex-row items-center">
          <Calendar size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-2">
            {format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Clock size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-2">
            {appointment.startTime} - {appointment.endTime}
          </Text>
        </View>

        {appointment.notes && (
          <View className="mt-2 p-3 bg-gray-50 rounded-lg">
            <Text className="text-xs text-gray-500 mb-1">Notes:</Text>
            <Text className="text-sm text-gray-700">{appointment.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
