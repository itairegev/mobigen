import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getPetById, getHealthRecords, getReminders, getAppointments } from '@/services';
import { HealthRecord as HealthRecordComponent, ReminderItem, AppointmentCard } from '@/components';
import { Edit, Calendar, FileText } from 'lucide-react-native';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => getPetById(id),
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['healthRecords', id],
    queryFn: () => getHealthRecords(id),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', id],
    queryFn: () => getReminders(id),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', id],
    queryFn: () => getAppointments(id),
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Pet not found</Text>
      </SafeAreaView>
    );
  }

  const upcomingReminders = reminders.filter((r) => !r.completed);
  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Pet Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <View className="items-center mb-4">
            {pet.photo ? (
              <Image
                source={{ uri: pet.photo }}
                className="w-32 h-32 rounded-full bg-gray-200 mb-4"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-primary-100 items-center justify-center mb-4">
                <Text className="text-6xl">🐾</Text>
              </View>
            )}
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              {pet.name}
            </Text>
            <Text className="text-lg text-gray-600 capitalize mb-4">
              {pet.breed} • {pet.species}
            </Text>

            <TouchableOpacity
              className="bg-primary-500 flex-row items-center px-6 py-3 rounded-lg"
              testID="edit-pet-button"
            >
              <Edit size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Pet Info Cards */}
          <View className="flex-row justify-around mt-4">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {pet.age}
              </Text>
              <Text className="text-sm text-gray-600">
                {pet.age === 1 ? 'Year' : 'Years'}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {pet.weight}kg
              </Text>
              <Text className="text-sm text-gray-600">Weight</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900 capitalize">
                {pet.gender}
              </Text>
              <Text className="text-sm text-gray-600">Gender</Text>
            </View>
          </View>

          {pet.notes && (
            <View className="mt-4 p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-700">{pet.notes}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <View className="flex-row justify-around">
            <TouchableOpacity
              onPress={() => router.push('/book')}
              className="items-center"
              testID="book-appointment"
            >
              <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-2">
                <Calendar size={28} color="#f97316" />
              </View>
              <Text className="text-sm text-gray-700 font-medium">
                Book
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" testID="add-record">
              <View className="w-16 h-16 bg-secondary-100 rounded-full items-center justify-center mb-2">
                <FileText size={28} color="#14b8a6" />
              </View>
              <Text className="text-sm text-gray-700 font-medium">
                Add Record
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Upcoming Reminders
            </Text>
            {upcomingReminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                testID={`reminder-${reminder.id}`}
              />
            ))}
          </View>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Upcoming Appointments
            </Text>
            {upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                testID={`appointment-${appointment.id}`}
              />
            ))}
          </View>
        )}

        {/* Health Records */}
        <View className="px-6 py-4">
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Health Records
          </Text>
          {healthRecords.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-gray-500">No health records yet</Text>
            </View>
          ) : (
            healthRecords.map((record) => (
              <HealthRecordComponent
                key={record.id}
                record={record}
                testID={`record-${record.id}`}
              />
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
