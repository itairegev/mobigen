import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppointments, usePets } from '@/hooks';
import { AppointmentCard } from '@/components';
import { Plus } from 'lucide-react-native';
import { useEffect } from 'react';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { pets, fetchPets } = usePets();
  const { data: appointments = [], isLoading } = useAppointments();

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'upcoming'
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completed'
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        <View className="py-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900">
              Appointments
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/book')}
              className="bg-primary-500 flex-row items-center px-4 py-2 rounded-lg"
              testID="book-appointment-button"
            >
              <Plus size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Book</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading appointments...</Text>
            </View>
          ) : appointments.length === 0 ? (
            <View className="bg-white rounded-xl p-12 items-center">
              <Text className="text-8xl mb-4">📅</Text>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                No Appointments
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                Book your first appointment for your pet
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/book')}
                className="bg-primary-500 px-8 py-3 rounded-lg"
                testID="book-first-appointment"
              >
                <Text className="text-white font-semibold text-base">
                  Book Appointment
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {upcomingAppointments.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-3">
                    Upcoming
                  </Text>
                  {upcomingAppointments.map((appointment) => {
                    const pet = pets.find((p) => p.id === appointment.petId);
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        petName={pet?.name}
                        testID={`appointment-${appointment.id}`}
                      />
                    );
                  })}
                </View>
              )}

              {pastAppointments.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-3">
                    Past Appointments
                  </Text>
                  {pastAppointments.map((appointment) => {
                    const pet = pets.find((p) => p.id === appointment.petId);
                    return (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        petName={pet?.name}
                        testID={`appointment-${appointment.id}`}
                      />
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
