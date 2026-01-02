import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem as CartItemType } from '@/types';
import { formatCurrency } from '@/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  testID?: string;
}

export function CartItem({ item, onUpdateQuantity, onRemove, testID }: CartItemProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm" testID={testID}>
      <View className="flex-row">
        <Image
          source={{ uri: item.image }}
          className="w-20 h-20 rounded-lg"
          resizeMode="cover"
        />

        <View className="flex-1 ml-4">
          <Text className="text-base font-bold text-gray-900 mb-1">
            {item.name}
          </Text>

          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
            <View className="mb-2">
              {item.selectedModifiers.map((modifier) => (
                <Text
                  key={`${modifier.groupId}-${modifier.modifierId}`}
                  className="text-xs text-gray-600"
                >
                  + {modifier.modifierName}
                  {modifier.price > 0 && ` (${formatCurrency(modifier.price)})`}
                </Text>
              ))}
            </View>
          )}

          {item.specialInstructions && (
            <Text className="text-xs text-gray-500 italic mb-2">
              Note: {item.specialInstructions}
            </Text>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-primary-600">
              {formatCurrency(item.subtotal)}
            </Text>

            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.quantity - 1)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                testID={`${testID}-decrease`}
              >
                {item.quantity === 1 ? (
                  <Trash2 size={16} color="#ef4444" />
                ) : (
                  <Minus size={16} color="#374151" />
                )}
              </TouchableOpacity>

              <Text className="text-base font-semibold text-gray-900 w-8 text-center">
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() => onUpdateQuantity(item.quantity + 1)}
                className="w-8 h-8 bg-primary-500 rounded-full items-center justify-center"
                testID={`${testID}-increase`}
              >
                <Plus size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
