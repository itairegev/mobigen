import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PetSpecies } from '@/types';

export default function AddPetScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const speciesOptions: { value: PetSpecies; label: string; emoji: string }[] = [
    { value: 'dog', label: 'Dog', emoji: '🐕' },
    { value: 'cat', label: 'Cat', emoji: '🐈' },
    { value: 'bird', label: 'Bird', emoji: '🐦' },
    { value: 'rabbit', label: 'Rabbit', emoji: '🐰' },
    { value: 'hamster', label: 'Hamster', emoji: '🐹' },
    { value: 'reptile', label: 'Reptile', emoji: '🦎' },
    { value: 'other', label: 'Other', emoji: '🐾' },
  ];

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving pet:', { name, species, breed, age, weight, gender });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-6">
        {/* Name */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Pet Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter pet name"
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
            testID="input-name"
          />
        </View>

        {/* Species */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Species *
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {speciesOptions.map((option) => {
              const isSelected = species === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSpecies(option.value)}
                  className={`m-1 px-4 py-3 rounded-lg flex-row items-center ${
                    isSelected ? 'bg-primary-500' : 'bg-white border border-gray-300'
                  }`}
                  testID={`species-${option.value}`}
                >
                  <Text className="text-xl mr-2">{option.emoji}</Text>
                  <Text
                    className={`font-medium ${
                      isSelected ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Breed */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Breed *
          </Text>
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="Enter breed"
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
            testID="input-breed"
          />
        </View>

        {/* Age */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Age (years) *
          </Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            keyboardType="numeric"
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
            testID="input-age"
          />
        </View>

        {/* Weight */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Weight (kg) *
          </Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight"
            keyboardType="decimal-pad"
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
            testID="input-weight"
          />
        </View>

        {/* Gender */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Gender *
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setGender('male')}
              className={`flex-1 mr-2 py-3 rounded-lg ${
                gender === 'male'
                  ? 'bg-primary-500'
                  : 'bg-white border border-gray-300'
              }`}
              testID="gender-male"
            >
              <Text
                className={`text-center font-semibold ${
                  gender === 'male' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender('female')}
              className={`flex-1 ml-2 py-3 rounded-lg ${
                gender === 'female'
                  ? 'bg-primary-500'
                  : 'bg-white border border-gray-300'
              }`}
              testID="gender-female"
            >
              <Text
                className={`text-center font-semibold ${
                  gender === 'female' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          className="bg-primary-500 py-4 rounded-lg mb-6"
          testID="save-pet-button"
        >
          <Text className="text-white text-center font-bold text-lg">
            Add Pet
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
