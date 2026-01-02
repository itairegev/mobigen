import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePets } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import { getServices, getServicesForPet } from '@/services';
import { ServiceSelector } from '@/components';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { pets, fetchPets, selectedPetId, selectPet } = usePets();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const { data: services = [] } = useQuery({
    queryKey: ['services', selectedPetId],
    queryFn: () => {
      const pet = pets.find((p) => p.id === selectedPetId);
      if (!pet) return getServices();
      return getServicesForPet(pet.species);
    },
    enabled: !!selectedPetId,
  });

  const handleContinue = () => {
    if (!selectedPetId || !selectedServiceId) {
      alert('Please select a pet and service');
      return;
    }
    // In a real app, this would navigate to date/time selection
    console.log('Booking:', { petId: selectedPetId, serviceId: selectedServiceId });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Step 1: Select Pet */}
        <View className="px-6 py-6 bg-white border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Step 1: Select Pet
          </Text>

          {pets.length === 0 ? (
            <View className="bg-gray-50 rounded-lg p-6 items-center">
              <Text className="text-gray-600 mb-4">No pets added yet</Text>
              <TouchableOpacity
                onPress={() => router.push('/pets/add')}
                className="bg-primary-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Add Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-1">
              {pets.map((pet) => {
                const isSelected = selectedPetId === pet.id;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    onPress={() => selectPet(pet.id)}
                    className={`m-1 px-4 py-3 rounded-lg border-2 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    testID={`select-pet-${pet.id}`}
                  >
                    <Text
                      className={`font-semibold ${
                        isSelected ? 'text-primary-700' : 'text-gray-900'
                      }`}
                    >
                      {pet.name}
                    </Text>
                    <Text
                      className={`text-sm ${
                        isSelected ? 'text-primary-600' : 'text-gray-600'
                      }`}
                    >
                      {pet.species}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 2: Select Service */}
        {selectedPetId && (
          <View className="py-6">
            <Text className="text-lg font-bold text-gray-900 mb-4 px-6">
              Step 2: Select Service
            </Text>

            <ServiceSelector
              services={services}
              selectedServiceId={selectedServiceId}
              onSelect={setSelectedServiceId}
              testID="service-selector"
            />
          </View>
        )}

        {/* Continue Button */}
        {selectedPetId && selectedServiceId && (
          <View className="px-6 py-6">
            <TouchableOpacity
              onPress={handleContinue}
              className="bg-primary-500 py-4 rounded-lg"
              testID="continue-button"
            >
              <Text className="text-white text-center font-bold text-lg">
                Continue to Date & Time
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
