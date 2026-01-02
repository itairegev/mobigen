import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Pet } from '@/types';

interface PetCardProps {
  pet: Pet;
  onPress?: () => void;
  testID?: string;
}

export function PetCard({ pet, onPress, testID }: PetCardProps) {
  const speciesEmoji = {
    dog: '🐕',
    cat: '🐈',
    bird: '🐦',
    rabbit: '🐰',
    hamster: '🐹',
    reptile: '🦎',
    other: '🐾',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md p-4 mb-4 flex-row"
      testID={testID}
    >
      {pet.photo ? (
        <Image
          source={{ uri: pet.photo }}
          className="w-20 h-20 rounded-full bg-gray-200"
        />
      ) : (
        <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center">
          <Text className="text-4xl">{speciesEmoji[pet.species]}</Text>
        </View>
      )}

      <View className="flex-1 ml-4 justify-center">
        <Text className="text-lg font-bold text-gray-900">{pet.name}</Text>
        <Text className="text-sm text-gray-600 capitalize">
          {pet.breed} • {pet.species}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {pet.age} {pet.age === 1 ? 'year' : 'years'} old • {pet.weight}kg
        </Text>
      </View>
    </TouchableOpacity>
  );
}
