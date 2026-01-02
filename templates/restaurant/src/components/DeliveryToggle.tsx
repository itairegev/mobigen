import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag, Bike } from 'lucide-react-native';

interface DeliveryToggleProps {
  orderType: 'pickup' | 'delivery';
  onToggle: (type: 'pickup' | 'delivery') => void;
  testID?: string;
}

export function DeliveryToggle({ orderType, onToggle, testID }: DeliveryToggleProps) {
  return (
    <View className="flex-row bg-gray-100 rounded-lg p-1" testID={testID}>
      <TouchableOpacity
        onPress={() => onToggle('pickup')}
        className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
          orderType === 'pickup' ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
        testID={`${testID}-pickup`}
      >
        <ShoppingBag
          size={20}
          color={orderType === 'pickup' ? '#ff6b35' : '#6b7280'}
        />
        <Text
          className={`ml-2 font-semibold ${
            orderType === 'pickup' ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          Pickup
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onToggle('delivery')}
        className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg ${
          orderType === 'delivery' ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
        testID={`${testID}-delivery`}
      >
        <Bike
          size={20}
          color={orderType === 'delivery' ? '#ff6b35' : '#6b7280'}
        />
        <Text
          className={`ml-2 font-semibold ${
            orderType === 'delivery' ? 'text-primary-600' : 'text-gray-600'
          }`}
        >
          Delivery
        </Text>
      </TouchableOpacity>
    </View>
  );
}
