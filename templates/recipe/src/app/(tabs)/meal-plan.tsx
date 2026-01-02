import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MealPlanDay } from '../../components';
import { useMealPlan } from '../../hooks';

const DAYS = [
  { name: 'Sunday', dayOfWeek: 0 },
  { name: 'Monday', dayOfWeek: 1 },
  { name: 'Tuesday', dayOfWeek: 2 },
  { name: 'Wednesday', dayOfWeek: 3 },
  { name: 'Thursday', dayOfWeek: 4 },
  { name: 'Friday', dayOfWeek: 5 },
  { name: 'Saturday', dayOfWeek: 6 },
];

export default function MealPlanScreen() {
  const router = useRouter();
  const { currentWeek, removeMeal, clearWeek } = useMealPlan();

  const getMealsForDay = (dayOfWeek: number) => {
    if (!currentWeek) return [];
    return currentWeek.meals.filter((meal) => meal.dayOfWeek === dayOfWeek);
  };

  const handleClearWeek = () => {
    if (!currentWeek || currentWeek.meals.length === 0) return;

    Alert.alert(
      'Clear Meal Plan',
      'Remove all planned meals for this week?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: clearWeek, style: 'destructive' },
      ]
    );
  };

  const handleAddMeal = () => {
    Alert.alert(
      'Add Meal',
      'Browse recipes to add them to your meal plan',
      [
        { text: 'OK', onPress: () => router.push('/(tabs)/categories') },
      ]
    );
  };

  const totalMeals = currentWeek?.meals.length || 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['bottom']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              This Week's Meals
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {totalMeals} {totalMeals === 1 ? 'meal' : 'meals'} planned
            </Text>
          </View>

          {totalMeals > 0 && (
            <TouchableOpacity
              onPress={handleClearWeek}
              className="px-3 py-2 bg-red-500 rounded-lg"
              testID="meal-plan-clear-week-btn"
            >
              <Ionicons name="trash-outline" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Meal Plan */}
        {totalMeals === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="calendar-outline" size={80} color="#CBD5E0" />
            <Text className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
              No meals planned yet
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
              Browse recipes and add them to your weekly meal plan
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/categories')}
              className="mt-6 px-6 py-3 bg-primary-500 rounded-lg"
              testID="meal-plan-browse-recipes-btn"
            >
              <Text className="text-white font-semibold">Browse Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            {DAYS.map((day) => (
              <MealPlanDay
                key={day.dayOfWeek}
                dayName={day.name}
                meals={getMealsForDay(day.dayOfWeek)}
                onAddMeal={handleAddMeal}
                onRemoveMeal={removeMeal}
                onMealPress={(recipeId) => router.push(`/recipes/${recipeId}`)}
                testID={`meal-plan-${day.name.toLowerCase()}`}
              />
            ))}

            <View className="h-6" />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
