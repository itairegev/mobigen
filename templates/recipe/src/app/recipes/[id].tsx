import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { IngredientList, StepByStep, NutritionInfo } from '../../components';
import { getRecipeById } from '../../services';
import { Recipe } from '../../types';
import { useFavorites, useShoppingList, useMealPlan } from '../../hooks';
import { difficultyColors } from '../../theme/colors';

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(0);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addIngredientsFromRecipe } = useShoppingList();
  const { addMeal } = useMealPlan();

  const favorite = recipe ? isFavorite(recipe.id) : false;

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await getRecipeById(recipeId);
      if (data) {
        setRecipe(data);
        setServings(data.servings);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShopping = () => {
    if (!recipe) return;

    addIngredientsFromRecipe(recipe);
    Alert.alert(
      'Added to Shopping List',
      `${recipe.ingredients.length} ingredients added to your shopping list`,
      [
        { text: 'OK' },
        { text: 'View List', onPress: () => router.push('/(tabs)/shopping') },
      ]
    );
  };

  const handleAddToMealPlan = () => {
    if (!recipe) return;

    Alert.alert(
      'Add to Meal Plan',
      'This feature will allow you to add this recipe to a specific day and meal type',
      [{ text: 'OK' }]
    );
  };

  const adjustServings = (delta: number) => {
    if (!recipe) return;
    const newServings = Math.max(1, servings + delta);
    setServings(newServings);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 px-4">
        <Ionicons name="alert-circle-outline" size={64} color="#CBD5E0" />
        <Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
          Recipe not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 bg-primary-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <View className="relative">
          <Image
            source={{ uri: recipe.image }}
            className="w-full h-64"
            resizeMode="cover"
          />

          <TouchableOpacity
            onPress={() => toggleFavorite(recipe.id)}
            className="absolute top-4 right-4 bg-white/90 rounded-full p-3"
            testID="recipe-detail-favorite-btn"
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={28}
              color={favorite ? '#FF6B35' : '#333'}
            />
          </TouchableOpacity>

          {recipe.difficulty && (
            <View
              className="absolute bottom-4 left-4 px-4 py-2 rounded-full"
              style={{ backgroundColor: difficultyColors[recipe.difficulty] }}
            >
              <Text className="text-white text-sm font-semibold capitalize">
                {recipe.difficulty}
              </Text>
            </View>
          )}
        </View>

        {/* Recipe Info */}
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {recipe.name}
          </Text>
          <Text className="text-base text-gray-600 dark:text-gray-300 leading-6">
            {recipe.description}
          </Text>

          {/* Meta Info */}
          <View className="flex-row items-center justify-between mt-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
            <View className="items-center">
              <Ionicons name="timer-outline" size={24} color="#FF6B35" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {recipe.totalTime} min
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Total Time</Text>
            </View>

            <View className="items-center">
              <Ionicons name="people-outline" size={24} color="#FF6B35" />
              <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {servings} servings
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">Servings</Text>
            </View>

            {recipe.rating && (
              <View className="items-center">
                <Ionicons name="star" size={24} color="#FFE66D" />
                <Text className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {recipe.rating.toFixed(1)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {recipe.reviewCount} reviews
                </Text>
              </View>
            )}
          </View>

          {/* Servings Adjuster */}
          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-sm text-gray-600 dark:text-gray-400 mr-3">
              Adjust servings:
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <TouchableOpacity
                onPress={() => adjustServings(-1)}
                className="px-4 py-2"
                testID="recipe-detail-decrease-servings"
              >
                <Ionicons name="remove" size={20} color="#FF6B35" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900 dark:text-white px-4">
                {servings}
              </Text>
              <TouchableOpacity
                onPress={() => adjustServings(1)}
                className="px-4 py-2"
                testID="recipe-detail-increase-servings"
              >
                <Ionicons name="add" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mt-6">
            <TouchableOpacity
              onPress={handleAddToShopping}
              className="flex-1 bg-secondary-500 rounded-lg py-3 flex-row items-center justify-center"
              testID="recipe-detail-add-to-shopping"
            >
              <Ionicons name="cart" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add to Shopping</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddToMealPlan}
              className="flex-1 bg-accent-500 rounded-lg py-3 flex-row items-center justify-center"
              testID="recipe-detail-add-to-meal-plan"
            >
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Meal Plan</Text>
            </TouchableOpacity>
          </View>

          {/* Ingredients */}
          <IngredientList
            ingredients={recipe.ingredients}
            servings={servings}
            originalServings={recipe.servings}
            testID="recipe-detail-ingredients"
          />

          {/* Instructions */}
          <StepByStep steps={recipe.steps} testID="recipe-detail-steps" />

          {/* Nutrition */}
          {recipe.nutrition && (
            <NutritionInfo
              nutrition={recipe.nutrition}
              servings={servings}
              originalServings={recipe.servings}
              testID="recipe-detail-nutrition"
            />
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Tags
              </Text>
              <View className="flex-row flex-wrap">
                {recipe.tags.map((tag) => (
                  <View
                    key={tag}
                    className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-sm text-gray-700 dark:text-gray-300">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
