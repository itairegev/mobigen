import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem as ShoppingItemType } from '../types';

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: () => void;
  onRemove: () => void;
  testID?: string;
}

export function ShoppingItem({ item, onToggle, onRemove, testID }: ShoppingItemProps) {
  return (
    <View
      className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      testID={testID}
    >
      <TouchableOpacity onPress={onToggle} className="mr-3">
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={28}
          color={item.checked ? '#4ECDC4' : '#6B4423'}
        />
      </TouchableOpacity>

      <View className="flex-1">
        <Text
          className={`text-base ${
            item.checked
              ? 'text-gray-400 dark:text-gray-500 line-through'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          <Text className="font-semibold">
            {item.amount > 0 && `${item.amount} `}
            {item.unit !== 'whole' && item.unit}
            {item.amount > 0 && ' '}
          </Text>
          {item.name}
        </Text>

        {item.recipeName && (
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            from {item.recipeName}
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onRemove}
        className="p-2"
        testID={`${testID}-remove-btn`}
      >
        <Ionicons name="trash-outline" size={20} color="#EF5350" />
      </TouchableOpacity>
    </View>
  );
}
