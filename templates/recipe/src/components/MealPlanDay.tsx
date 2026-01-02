import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlannedMeal } from '../types';
import { mealTypeColors } from '../theme/colors';

interface MealPlanDayProps {
  dayName: string;
  meals: PlannedMeal[];
  onAddMeal: () => void;
  onRemoveMeal: (mealId: string) => void;
  onMealPress: (recipeId: string) => void;
  testID?: string;
}

export function MealPlanDay({
  dayName,
  meals,
  onAddMeal,
  onRemoveMeal,
  onMealPress,
  testID,
}: MealPlanDayProps) {
  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ];

  const getMealForType = (type: string) => {
    return meals.find((m) => m.mealType === type);
  };

  return (
    <View className="mb-6" testID={testID}>
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
        {dayName}
      </Text>

      <View className="space-y-2">
        {mealTypes.map((mealType) => {
          const meal = getMealForType(mealType);

          return (
            <View
              key={mealType}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: mealTypeColors[mealType] }}
                  />
                  <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                    {mealType}
                  </Text>
                </View>

                {!meal && (
                  <TouchableOpacity
                    onPress={onAddMeal}
                    className="p-1"
                    testID={`${testID}-add-${mealType}`}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                  </TouchableOpacity>
                )}
              </View>

              {meal ? (
                <TouchableOpacity
                  onPress={() => onMealPress(meal.recipeId)}
                  className="flex-row items-center"
                >
                  <Image
                    source={{ uri: meal.recipeImage }}
                    className="w-16 h-16 rounded-lg mr-3"
                    resizeMode="cover"
                  />

                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {meal.recipeName}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      {meal.servings} servings
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => onRemoveMeal(meal.id)}
                    className="p-2"
                    testID={`${testID}-remove-${mealType}`}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF5350" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <Text className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No meal planned
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
