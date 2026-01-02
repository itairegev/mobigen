import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../types';
import { difficultyColors } from '../theme/colors';
import { useFavorites } from '../hooks';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  testID?: string;
}

export function RecipeCard({ recipe, onPress, testID }: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(recipe.id);

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4"
      testID={testID}
    >
      <View className="relative">
        <Image
          source={{ uri: recipe.image }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={handleFavoritePress}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
          testID={`${testID}-favorite-btn`}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={favorite ? '#FF6B35' : '#333'}
          />
        </TouchableOpacity>

        {recipe.difficulty && (
          <View
            className="absolute bottom-3 left-3 px-3 py-1 rounded-full"
            style={{ backgroundColor: difficultyColors[recipe.difficulty] }}
          >
            <Text className="text-white text-xs font-semibold capitalize">
              {recipe.difficulty}
            </Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {recipe.name}
        </Text>
        <Text
          className="text-sm text-gray-600 dark:text-gray-300 mb-3"
          numberOfLines={2}
        >
          {recipe.description}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#6B4423" />
              <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                {recipe.totalTime} min
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={16} color="#6B4423" />
              <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                {recipe.servings} servings
              </Text>
            </View>
          </View>

          {recipe.rating && (
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#FFE66D" />
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                {recipe.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
