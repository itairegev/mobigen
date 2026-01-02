import { View, Text, Image, TouchableOpacity } from 'react-native';
import { CartItem as CartItemType } from './CartProvider';

export interface CartItemComponentProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  testID?: string;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  testID,
}: CartItemComponentProps) {
  const calculateItemTotal = () => {
    const baseTotal = item.price * item.quantity;
    const modifiersTotal =
      (item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0) *
      item.quantity;
    return baseTotal + modifiersTotal;
  };

  return (
    <View
      className="bg-white rounded-lg p-4 mb-3 flex-row border border-gray-200"
      testID={testID}
    >
      {/* Image */}
      {item.image && (
        <Image
          source={{ uri: item.image }}
          className="w-20 h-20 rounded-lg mr-3"
        />
      )}

      {/* Details */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {item.name}
        </Text>

        {item.variant && (
          <Text className="text-sm text-gray-500 mb-1">{item.variant}</Text>
        )}

        {item.modifiers && item.modifiers.length > 0 && (
          <View className="mb-2">
            {item.modifiers.map(modifier => (
              <Text key={modifier.id} className="text-xs text-gray-500">
                + {modifier.name} (+${modifier.price.toFixed(2)})
              </Text>
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between mt-2">
          {/* Quantity controls */}
          <View className="flex-row items-center bg-gray-100 rounded-lg">
            <TouchableOpacity
              onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="px-3 py-1"
              testID={`${testID}-decrease`}
            >
              <Text className="text-lg font-semibold text-gray-700">−</Text>
            </TouchableOpacity>

            <Text className="px-3 text-base font-medium text-gray-900">
              {item.quantity}
            </Text>

            <TouchableOpacity
              onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="px-3 py-1"
              testID={`${testID}-increase`}
            >
              <Text className="text-lg font-semibold text-gray-700">+</Text>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Text className="text-lg font-semibold text-gray-900">
            ${calculateItemTotal().toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Remove button */}
      <TouchableOpacity
        onPress={() => onRemove(item.id)}
        className="ml-2 p-1"
        testID={`${testID}-remove`}
      >
        <Text className="text-red-500 text-xl">×</Text>
      </TouchableOpacity>
    </View>
  );
}
