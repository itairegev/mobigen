import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient } from '../types';
import { useState } from 'react';

interface IngredientListProps {
  ingredients: Ingredient[];
  servings: number;
  originalServings: number;
  testID?: string;
}

export function IngredientList({
  ingredients,
  servings,
  originalServings,
  testID,
}: IngredientListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleIngredient = (id: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const adjustAmount = (amount: number) => {
    if (servings === originalServings) return amount;
    return (amount * servings) / originalServings;
  };

  const formatAmount = (amount: number, unit: string) => {
    const adjusted = adjustAmount(amount);

    // Handle whole units
    if (unit === 'whole' || unit === 'pinch') {
      return adjusted === 0 ? '' : Math.round(adjusted).toString();
    }

    // Handle fractions for common cooking measurements
    if (adjusted < 1 && (unit === 'cup' || unit === 'tbsp' || unit === 'tsp')) {
      // Common fractions
      if (Math.abs(adjusted - 0.25) < 0.05) return '¼';
      if (Math.abs(adjusted - 0.33) < 0.05) return '⅓';
      if (Math.abs(adjusted - 0.5) < 0.05) return '½';
      if (Math.abs(adjusted - 0.67) < 0.05) return '⅔';
      if (Math.abs(adjusted - 0.75) < 0.05) return '¾';
    }

    // Regular decimal formatting
    if (Number.isInteger(adjusted)) {
      return adjusted.toString();
    }

    return adjusted.toFixed(2).replace(/\.?0+$/, '');
  };

  return (
    <View className="mt-4" testID={testID}>
      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        Ingredients
      </Text>

      {ingredients.map((ingredient, index) => {
        const isChecked = checkedItems.has(ingredient.id);

        return (
          <TouchableOpacity
            key={ingredient.id}
            onPress={() => toggleIngredient(ingredient.id)}
            className="flex-row items-start py-3 border-b border-gray-200 dark:border-gray-700"
            testID={`${testID}-item-${index}`}
          >
            <View className="mt-1 mr-3">
              <Ionicons
                name={isChecked ? 'checkbox' : 'square-outline'}
                size={24}
                color={isChecked ? '#4ECDC4' : '#6B4423'}
              />
            </View>

            <View className="flex-1">
              <Text
                className={`text-base ${
                  isChecked
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                <Text className="font-semibold">
                  {formatAmount(ingredient.amount, ingredient.unit)}
                  {ingredient.amount > 0 && ' '}
                  {ingredient.unit !== 'whole' && ingredient.unit}
                </Text>
                {' '}
                {ingredient.name}
              </Text>

              {ingredient.notes && (
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {ingredient.notes}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
