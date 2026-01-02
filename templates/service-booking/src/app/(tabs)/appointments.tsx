import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import { useAppointments, useService, useStaffMember } from '@/hooks';
import { AppointmentCard } from '@/components';

export default function AppointmentsScreen() {
  const { data: appointments, isLoading } = useAppointments();

  const upcomingAppointments = appointments?.filter((apt) => apt.status === 'upcoming') || [];
  const pastAppointments = appointments?.filter((apt) => apt.status !== 'upcoming') || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0d9488" />
            <Text className="text-gray-500 mt-4">Loading appointments...</Text>
          </View>
        ) : appointments && appointments.length > 0 ? (
          <>
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Upcoming
                </Text>
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCardWithData
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => router.push(`/appointments/${appointment.id}`)}
                  />
                ))}
              </View>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Past
                </Text>
                {pastAppointments.map((appointment) => (
                  <AppointmentCardWithData
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => router.push(`/appointments/${appointment.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <CalendarPlus size={40} color="#9ca3af" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No Appointments
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              You don't have any appointments scheduled yet.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/services')}
              className="bg-primary-600 px-6 py-3 rounded-lg"
              testID="book-first-appointment"
            >
              <Text className="text-white font-semibold">
                Book Your First Appointment
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppointmentCardWithData({
  appointment,
  onPress,
}: {
  appointment: any;
  onPress: () => void;
}) {
  const { data: service } = useService(appointment.serviceId);
  const { data: staff } = useStaffMember(appointment.staffId);

  return (
    <AppointmentCard
      appointment={appointment}
      serviceName={service?.name}
      staffName={staff?.name}
      onPress={onPress}
      testID={`appointment-${appointment.id}`}
    />
  );
}
