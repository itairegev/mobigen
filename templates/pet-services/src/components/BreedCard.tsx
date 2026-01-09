import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DogBreed, CatBreed, UnifiedBreed } from '@/services/breeds';

interface BreedCardProps {
  breed: DogBreed | CatBreed | UnifiedBreed;
  onPress?: () => void;
  compact?: boolean;
  testID?: string;
}

// Type guards
function isDogBreed(breed: DogBreed | CatBreed | UnifiedBreed): breed is DogBreed {
  return typeof (breed as DogBreed).id === 'number';
}

function isCatBreed(breed: DogBreed | CatBreed | UnifiedBreed): breed is CatBreed {
  return typeof (breed as CatBreed).id === 'string' && 'adaptability' in breed;
}

function isUnifiedBreed(breed: DogBreed | CatBreed | UnifiedBreed): breed is UnifiedBreed {
  return 'species' in breed && typeof (breed as UnifiedBreed).species === 'string';
}

export function BreedCard({ breed, onPress, compact = false, testID }: BreedCardProps): JSX.Element {
  // Extract data based on breed type
  let name: string;
  let imageUrl: string | undefined;
  let temperament: string | undefined;
  let lifeSpan: string;
  let species: 'dog' | 'cat' = 'dog';
  let origin: string | undefined;

  if (isUnifiedBreed(breed)) {
    name = breed.name;
    imageUrl = breed.imageUrl;
    temperament = breed.temperament;
    lifeSpan = breed.lifeSpan;
    species = breed.species;
    origin = breed.origin;
  } else if (isDogBreed(breed)) {
    name = breed.name;
    imageUrl = breed.image?.url;
    temperament = breed.temperament;
    lifeSpan = breed.life_span;
    species = 'dog';
    origin = breed.origin;
  } else if (isCatBreed(breed)) {
    name = breed.name;
    imageUrl = breed.image?.url;
    temperament = breed.temperament;
    lifeSpan = breed.life_span + ' years';
    species = 'cat';
    origin = breed.origin;
  } else {
    return <View />;
  }

  // Default images if none available
  const defaultImage = species === 'dog'
    ? 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'
    : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400';

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="bg-white rounded-xl mr-3 overflow-hidden shadow-sm"
        style={{ width: 160 }}
        testID={testID}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: imageUrl || defaultImage }}
          className="w-full h-24"
          resizeMode="cover"
        />
        <View className="p-2">
          <View className="flex-row items-center mb-1">
            <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-sm">{species === 'dog' ? '🐕' : '🐱'}</Text>
          </View>
          {origin && (
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {origin}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm flex-row"
      testID={testID}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: imageUrl || defaultImage }}
        className="w-24 h-24"
        resizeMode="cover"
      />
      <View className="flex-1 p-3 justify-center">
        <View className="flex-row items-center mb-1">
          <Text className="text-lg font-semibold text-gray-900 flex-1">
            {name}
          </Text>
          <View className="bg-gray-100 px-2 py-0.5 rounded-full flex-row items-center">
            <Text className="text-xs mr-1">{species === 'dog' ? '🐕' : '🐱'}</Text>
            <Text className="text-xs text-gray-600 capitalize">{species}</Text>
          </View>
        </View>

        {temperament && (
          <Text className="text-sm text-gray-600 mb-1" numberOfLines={1}>
            {temperament.split(',').slice(0, 3).join(', ')}
          </Text>
        )}

        <View className="flex-row items-center">
          {origin && (
            <Text className="text-xs text-gray-500 mr-3">
              📍 {origin}
            </Text>
          )}
          <Text className="text-xs text-gray-500">
            ⏱️ {lifeSpan}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Mini card for grid display
interface BreedMiniCardProps {
  breed: DogBreed | CatBreed | UnifiedBreed;
  onPress?: () => void;
  testID?: string;
}

export function BreedMiniCard({ breed, onPress, testID }: BreedMiniCardProps): JSX.Element {
  let name: string;
  let imageUrl: string | undefined;
  let species: 'dog' | 'cat' = 'dog';

  if (isUnifiedBreed(breed)) {
    name = breed.name;
    imageUrl = breed.imageUrl;
    species = breed.species;
  } else if (isDogBreed(breed)) {
    name = breed.name;
    imageUrl = breed.image?.url;
    species = 'dog';
  } else if (isCatBreed(breed)) {
    name = breed.name;
    imageUrl = breed.image?.url;
    species = 'cat';
  } else {
    return <View />;
  }

  const defaultImage = species === 'dog'
    ? 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'
    : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200';

  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center mr-4"
      testID={testID}
      activeOpacity={0.7}
    >
      <View className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mb-1">
        <Image
          source={{ uri: imageUrl || defaultImage }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <Text className="text-xs text-gray-700 text-center" numberOfLines={1} style={{ width: 64 }}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

export default BreedCard;
