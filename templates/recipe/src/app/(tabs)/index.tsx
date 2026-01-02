import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { RecipeCard, CategoryChip } from '../../components';
import { getFeaturedRecipes, getCategories } from '../../services';
import { Recipe, Category } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipes, cats] = await Promise.all([getFeaturedRecipes(), getCategories()]);
      setFeaturedRecipes(recipes);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to RecipeBook
          </Text>
          <Text className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Discover delicious recipes for every occasion
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-primary-500 rounded-xl p-4 flex-row items-center justify-center"
              onPress={() => router.push('/favorites')}
              testID="home-favorites-btn"
            >
              <Ionicons name="heart" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-secondary-500 rounded-xl p-4 flex-row items-center justify-center"
              onPress={() => router.push('/(tabs)/meal-plan')}
              testID="home-meal-plan-btn"
            >
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Meal Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Browse Categories */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Browse Categories
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/categories')}
              testID="home-see-all-categories-btn"
            >
              <Text className="text-primary-500 font-semibold">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {categories.slice(0, 5).map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                onPress={() => router.push(`/(tabs)/categories?categoryId=${category.id}`)}
                testID={`home-category-${category.id}`}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Recipes */}
        <View className="px-4 pb-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Recipes
          </Text>

          {featuredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
              testID={`home-recipe-${recipe.id}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
