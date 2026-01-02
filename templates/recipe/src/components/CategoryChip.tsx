import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

interface CategoryChipProps {
  category: Category;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
}

export function CategoryChip({ category, selected = false, onPress, testID }: CategoryChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-4 py-2 rounded-full mr-2 mb-2 ${
        selected
          ? 'bg-primary-500'
          : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
      }`}
      testID={testID}
      style={selected ? { backgroundColor: category.color } : undefined}
    >
      <Ionicons
        name={category.icon as any}
        size={18}
        color={selected ? '#FFFFFF' : category.color}
      />
      <Text
        className={`ml-2 font-semibold ${
          selected ? 'text-white' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}
