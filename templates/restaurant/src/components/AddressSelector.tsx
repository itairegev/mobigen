import { View, Text, TouchableOpacity } from 'react-native';
import { Address } from '@/types';
import { MapPin, Check } from 'lucide-react-native';

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (addressId: string) => void;
  testID?: string;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  testID,
}: AddressSelectorProps) {
  return (
    <View className="mb-4" testID={testID}>
      <Text className="text-lg font-bold text-gray-900 mb-3">
        Delivery Address
      </Text>

      <View className="space-y-3">
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address.id;

          return (
            <TouchableOpacity
              key={address.id}
              onPress={() => onSelectAddress(address.id)}
              className={`p-4 rounded-lg border-2 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
              testID={`${testID}-${address.id}`}
            >
              <View className="flex-row items-start">
                <MapPin
                  size={20}
                  color={isSelected ? '#ff6b35' : '#6b7280'}
                  className="mr-3 mt-0.5"
                />

                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold mb-1 ${
                      isSelected ? 'text-primary-600' : 'text-gray-900'
                    }`}
                  >
                    {address.label}
                  </Text>

                  <Text className="text-gray-600 text-sm">
                    {address.street}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {address.city}, {address.state} {address.zipCode}
                  </Text>

                  {address.deliveryInstructions && (
                    <Text className="text-gray-500 text-xs mt-1 italic">
                      Note: {address.deliveryInstructions}
                    </Text>
                  )}
                </View>

                {isSelected && (
                  <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                    <Check size={16} color="#ffffff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
