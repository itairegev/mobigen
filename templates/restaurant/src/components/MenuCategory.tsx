import { TouchableOpacity, Text } from 'react-native';

interface MenuCategoryProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
  testID?: string;
}

export function MenuCategory({ name, isActive, onPress, testID }: MenuCategoryProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-5 py-3 rounded-full mr-3 ${
        isActive ? 'bg-primary-500' : 'bg-gray-100'
      }`}
      testID={testID}
    >
      <Text
        className={`font-semibold ${
          isActive ? 'text-white' : 'text-gray-700'
        }`}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}
