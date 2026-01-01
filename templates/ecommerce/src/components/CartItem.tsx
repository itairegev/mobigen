import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { formatCurrency } from '@/utils';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  testID?: string;
}

export function CartItem({ item, onUpdateQuantity, onRemove, testID }: CartItemProps) {
  return (
    <View className="bg-white p-4 rounded-lg mb-3 flex-row" testID={testID}>
      <Image
        source={{ uri: item.product.image }}
        className="w-20 h-20 rounded-lg bg-gray-100"
        resizeMode="cover"
      />

      <View className="flex-1 ml-4">
        <Text className="text-gray-900 font-medium" numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text className="text-primary-500 font-bold mt-1">
          {formatCurrency(item.product.price)}
        </Text>

        <View className="flex-row items-center mt-2">
          <View className="flex-row items-center bg-gray-100 rounded-lg">
            <TouchableOpacity
              className="p-2"
              onPress={() => onUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
              testID={`${testID}-decrease`}
            >
              <Minus size={16} color={item.quantity <= 1 ? '#d1d5db' : '#374151'} />
            </TouchableOpacity>
            <Text className="px-3 font-medium">{item.quantity}</Text>
            <TouchableOpacity
              className="p-2"
              onPress={() => onUpdateQuantity(item.quantity + 1)}
              testID={`${testID}-increase`}
            >
              <Plus size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="ml-auto p-2"
            onPress={onRemove}
            testID={`${testID}-remove`}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
