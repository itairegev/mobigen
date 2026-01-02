import { TouchableOpacity, View, Text, Image } from 'react-native';
import { MenuItem as MenuItemType } from '@/types';
import { formatCurrency } from '@/utils';

interface MenuItemProps {
  item: MenuItemType;
  onPress: () => void;
  testID?: string;
}

export function MenuItem({ item, onPress, testID }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      testID={testID}
    >
      <Image
        source={{ uri: item.image }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {!item.available && (
        <View className="absolute top-3 right-3 bg-red-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-semibold">Unavailable</Text>
        </View>
      )}

      {item.featured && (
        <View className="absolute top-3 left-3 bg-primary-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-semibold">Featured</Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-lg font-bold text-gray-900 flex-1 pr-2">
            {item.name}
          </Text>
          <Text className="text-lg font-bold text-primary-600">
            {formatCurrency(item.price)}
          </Text>
        </View>

        <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
          {item.description}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row flex-wrap gap-2">
            {item.dietaryTags?.map((tag) => (
              <View
                key={tag}
                className="bg-green-100 px-2 py-1 rounded-full"
              >
                <Text className="text-green-700 text-xs font-medium capitalize">
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          {item.prepTime && (
            <Text className="text-gray-500 text-xs">
              {item.prepTime} min
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
