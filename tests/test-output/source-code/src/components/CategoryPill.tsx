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
      style={{
        backgroundColor: isSelected 
          ? (category.color || '#2563eb')
          : '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
      }}
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
