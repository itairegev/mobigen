import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePets, useUpcomingAppointments, useUpcomingReminders } from '@/hooks';
import { PetCard, AppointmentCard, ReminderItem } from '@/components';
import { getPetById, getServiceById } from '@/services';
import { Plus, FileText } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { pets, fetchPets } = usePets();
  const { data: upcomingAppointments = [] } = useUpcomingAppointments();
  const { data: upcomingReminders = [] } = useUpcomingReminders();

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-primary-500 px-6 py-8">
          <Text className="text-3xl font-bold text-white mb-2">
            Welcome Back! 👋
          </Text>
          <Text className="text-primary-100">
            Taking care of your furry friends
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-6">
          <View className="bg-white rounded-xl shadow-md p-4 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Quick Actions
            </Text>
            <View className="flex-row justify-around">
              <TouchableOpacity
                onPress={() => router.push('/book')}
                className="items-center"
                testID="quick-action-book"
              >
                <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-3xl">📅</Text>
                </View>
                <Text className="text-sm text-gray-700 font-medium">
                  Book
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/pets')}
                className="items-center"
                testID="quick-action-pets"
              >
                <View className="w-16 h-16 bg-secondary-100 rounded-full items-center justify-center mb-2">
                  <Text className="text-3xl">🐾</Text>
                </View>
                <Text className="text-sm text-gray-700 font-medium">
                  My Pets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/articles')}
                className="items-center"
                testID="quick-action-articles"
              >
                <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-2">
                  <FileText size={32} color="#8b5cf6" />
                </View>
                <Text className="text-sm text-gray-700 font-medium">
                  Articles
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* My Pets */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">My Pets</Text>
            <TouchableOpacity
              onPress={() => router.push('/pets/add')}
              testID="add-pet-button"
            >
              <View className="flex-row items-center">
                <Plus size={20} color="#f97316" />
                <Text className="text-primary-600 font-semibold ml-1">
                  Add Pet
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {pets.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-6xl mb-3">🐾</Text>
              <Text className="text-gray-600 text-center mb-4">
                No pets added yet
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/pets/add')}
                className="bg-primary-500 px-6 py-3 rounded-lg"
                testID="add-first-pet"
              >
                <Text className="text-white font-semibold">
                  Add Your First Pet
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            pets.slice(0, 3).map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() => router.push(`/pets/${pet.id}`)}
                testID={`pet-card-${pet.id}`}
              />
            ))
          )}
        </View>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Upcoming Reminders
            </Text>
            {upcomingReminders.slice(0, 3).map((reminder) => {
              const pet = pets.find(p => p.id === reminder.petId);
              return (
                <ReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  petName={pet?.name}
                  testID={`reminder-${reminder.id}`}
                />
              );
            })}
          </View>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Upcoming Appointments
            </Text>
            {upcomingAppointments.slice(0, 3).map((appointment) => {
              const pet = pets.find(p => p.id === appointment.petId);
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

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
