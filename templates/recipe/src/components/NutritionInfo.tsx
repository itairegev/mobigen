import { View, Text } from 'react-native';
import { NutritionInfo as NutritionInfoType } from '../types';

interface NutritionInfoProps {
  nutrition: NutritionInfoType;
  servings?: number;
  originalServings?: number;
  testID?: string;
}

export function NutritionInfo({
  nutrition,
  servings = 1,
  originalServings = 1,
  testID,
}: NutritionInfoProps) {
  const adjustValue = (value: number) => {
    if (servings === originalServings) return value;
    return Math.round((value * servings) / originalServings);
  };

  const items = [
    { label: 'Calories', value: adjustValue(nutrition.calories), unit: '' },
    { label: 'Protein', value: adjustValue(nutrition.protein), unit: 'g' },
    { label: 'Carbs', value: adjustValue(nutrition.carbs), unit: 'g' },
    { label: 'Fat', value: adjustValue(nutrition.fat), unit: 'g' },
  ];

  if (nutrition.fiber) {
    items.push({ label: 'Fiber', value: adjustValue(nutrition.fiber), unit: 'g' });
  }

  if (nutrition.sugar) {
    items.push({ label: 'Sugar', value: adjustValue(nutrition.sugar), unit: 'g' });
  }

  return (
    <View className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" testID={testID}>
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
        Nutrition Facts
      </Text>

      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Per serving ({servings} {servings === 1 ? 'serving' : 'servings'})
      </Text>

      <View className="flex-row flex-wrap">
        {items.map((item, index) => (
          <View
            key={item.label}
            className="w-1/3 mb-3"
            testID={`${testID}-${item.label.toLowerCase()}`}
          >
            <Text className="text-2xl font-bold text-primary-500">
              {item.value}
              {item.unit}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
