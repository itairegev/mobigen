import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePets } from '@/hooks';
import { PetCard } from '@/components';
import { Plus } from 'lucide-react-native';

export default function PetsScreen() {
  const router = useRouter();
  const { pets, fetchPets, loading } = usePets();

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        <View className="py-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900">My Pets</Text>
            <TouchableOpacity
              onPress={() => router.push('/pets/add')}
              className="bg-primary-500 flex-row items-center px-4 py-2 rounded-lg"
              testID="add-pet-button"
            >
              <Plus size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Add Pet</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">Loading pets...</Text>
            </View>
          ) : pets.length === 0 ? (
            <View className="bg-white rounded-xl p-12 items-center">
              <Text className="text-8xl mb-4">🐾</Text>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                No Pets Yet
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                Add your first pet to start managing their health and appointments
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/pets/add')}
                className="bg-primary-500 px-8 py-3 rounded-lg"
                testID="add-first-pet"
              >
                <Text className="text-white font-semibold text-base">
                  Add Your First Pet
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onPress={() => router.push(`/pets/${pet.id}`)}
                  testID={`pet-card-${pet.id}`}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
