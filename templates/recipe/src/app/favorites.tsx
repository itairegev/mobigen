import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { RecipeCard } from '../components';
import { getRecipes } from '../services';
import { Recipe } from '../types';
import { useFavorites } from '../hooks';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [favoriteIds]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const allRecipes = await getRecipes();
      const favoriteRecipes = allRecipes.filter((recipe) =>
        favoriteIds.includes(recipe.id)
      );
      setRecipes(favoriteRecipes);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <View className="flex-1">
        {recipes.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="heart-outline" size={80} color="#CBD5E0" />
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
              No favorite recipes yet
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
              Tap the heart icon on recipes to add them to your favorites
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}
            </Text>

            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => router.push(`/recipes/${recipe.id}`)}
                testID={`favorites-recipe-${recipe.id}`}
              />
            ))}

            <View className="h-6" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
