import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Calendar, Clock, User, MapPin, X } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { useAppointment, useService, useStaffMember, useCancelAppointment } from '@/hooks';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const appointmentId = Array.isArray(id) ? id[0] : id;

  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const { data: service } = useService(appointment?.serviceId || '');
  const { data: staff } = useStaffMember(appointment?.staffId || '');
  const cancelAppointment = useCancelAppointment();

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment.mutateAsync(appointmentId);
              Alert.alert('Cancelled', 'Your appointment has been cancelled.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0d9488" />
      </SafeAreaView>
    );
  }

  if (!appointment || !service || !staff) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Appointment not found</Text>
      </SafeAreaView>
    );
  }

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

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
          Appointment Details
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Status Badge */}
        <View className="items-center mb-4">
          <View className={`px-4 py-2 rounded-full ${statusColors[appointment.status]}`}>
            <Text className="text-sm font-semibold capitalize">
              {appointment.status}
            </Text>
          </View>
        </View>

        {/* Service Info */}
        <View className="bg-white rounded-xl p-6 mb-4">
          {service.image && (
            <Image
              source={{ uri: service.image }}
              className="w-full h-48 rounded-lg mb-4"
              resizeMode="cover"
            />
          )}
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {service.name}
          </Text>
          <Text className="text-base text-gray-600 mb-4">
            {service.description}
          </Text>

          <View className="flex-row justify-between">
            <View>
              <Text className="text-sm text-gray-500">Duration</Text>
              <Text className="text-base font-semibold text-gray-900">
                {service.duration} minutes
              </Text>
            </View>
            <View>
              <Text className="text-sm text-gray-500">Price</Text>
              <Text className="text-base font-semibold text-gray-900">
                ${service.price}
              </Text>
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View className="bg-white rounded-xl p-6 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Appointment Information
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                <User size={20} color="#0d9488" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-sm text-gray-500">Staff Member</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {staff.name}
                </Text>
                <Text className="text-sm text-gray-600">{staff.title}</Text>
              </View>
            </View>

            <View className="flex-row items-center pt-4 border-t border-gray-100">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <Calendar size={20} color="#3b82f6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-sm text-gray-500">Date</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center pt-4 border-t border-gray-100">
              <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center">
                <Clock size={20} color="#f59e0b" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-sm text-gray-500">Time</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {appointment.startTime} - {appointment.endTime}
                </Text>
              </View>
            </View>

            {appointment.notes && (
              <View className="pt-4 border-t border-gray-100">
                <Text className="text-sm text-gray-500 mb-2">Notes</Text>
                <Text className="text-base text-gray-700">{appointment.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {appointment.status === 'upcoming' && (
          <View className="mb-6">
            <TouchableOpacity
              onPress={handleCancelAppointment}
              disabled={cancelAppointment.isPending}
              className="bg-red-50 rounded-xl py-4 flex-row items-center justify-center"
              testID="cancel-appointment-button"
            >
              <X size={20} color="#ef4444" />
              <Text className="text-red-600 font-semibold text-base ml-2">
                {cancelAppointment.isPending ? 'Cancelling...' : 'Cancel Appointment'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
