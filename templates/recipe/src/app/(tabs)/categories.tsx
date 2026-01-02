import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { RecipeCard, CategoryChip } from '../../components';
import { getRecipes, getCategories } from '../../services';
import { Recipe, Category } from '../../types';

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    (params.categoryId as string) || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await getRecipes(selectedCategoryId || undefined);
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <View className="flex-1">
        {/* Categories Filter */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Filter by Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                selected={category.id === selectedCategoryId}
                onPress={() => handleCategoryPress(category.id)}
                testID={`category-chip-${category.id}`}
              />
            ))}
          </ScrollView>
        </View>

        {/* Recipe List */}
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedCategory ? selectedCategory.name : 'All Recipes'}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </Text>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          ) : recipes.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="restaurant-outline" size={64} color="#CBD5E0" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                No recipes found in this category
              </Text>
            </View>
          ) : (
            <View className="pb-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() => router.push(`/recipes/${recipe.id}`)}
                  testID={`categories-recipe-${recipe.id}`}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
