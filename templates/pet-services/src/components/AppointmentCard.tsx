import { View, Text, TouchableOpacity } from 'react-native';
import { Appointment } from '@/types';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react-native';

interface AppointmentCardProps {
  appointment: Appointment;
  petName?: string;
  serviceName?: string;
  onPress?: () => void;
  testID?: string;
}

export function AppointmentCard({
  appointment,
  petName,
  serviceName,
  onPress,
  testID,
}: AppointmentCardProps) {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusText = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md p-4 mb-3"
      testID={testID}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-900 flex-1">
          {serviceName || 'Appointment'}
        </Text>
        <View className={`px-3 py-1 rounded-full ${statusColors[appointment.status]}`}>
          <Text className={`text-xs font-semibold ${statusColors[appointment.status]}`}>
            {statusText[appointment.status]}
          </Text>
        </View>
      </View>

      {petName && (
        <Text className="text-sm text-gray-600 mb-2">For: {petName}</Text>
      )}

      <View className="flex-row items-center mb-1">
        <Calendar size={16} color="#64748b" />
        <Text className="text-sm text-gray-600 ml-2">
          {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Clock size={16} color="#64748b" />
        <Text className="text-sm text-gray-600 ml-2">
          {appointment.startTime} - {appointment.endTime}
        </Text>
      </View>

      {appointment.veterinarian && (
        <Text className="text-sm text-gray-500 mt-2">
          With: {appointment.veterinarian}
        </Text>
      )}

      {appointment.notes && (
        <Text className="text-sm text-gray-500 mt-2 italic">
          {appointment.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}
