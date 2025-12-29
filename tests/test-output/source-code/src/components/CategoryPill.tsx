import { Text, Pressable } from 'react-native';
import type { Category } from '@/types';

interface CategoryPillProps {
  category: Category;
  isSelected?: boolean;
  onPress?: () => void;
  testID?: string;
}

export function CategoryPill({ category, isSelected = false, onPress, testID }: CategoryPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isSelected ? 'bg-blue-500' : 'bg-gray-100'
      }`}
      testID={testID}
    >
      <Text
        className={`text-sm font-medium ${
          isSelected ? 'text-white' : 'text-gray-700'
        }`}
      >
        {category.icon} {category.name}
      </Text>
    </Pressable>
  );
}
