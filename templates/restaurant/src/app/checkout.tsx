import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCart, usePlaceOrder } from '@/hooks';
import { DeliveryToggle, AddressSelector, TipSelector, CartSummary } from '@/components';
import { getAddresses } from '@/services';
import { useQuery } from '@tanstack/react-query';

export default function CheckoutScreen() {
  const { items, subtotal, clearCart } = useCart();
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });
  const { mutate: placeOrder, isPending } = usePlaceOrder();

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(addresses?.[0]?.id);
  const [tip, setTip] = useState(0);
  const [customerNotes, setCustomerNotes] = useState('');

  const tax = subtotal * 0.09; // 9% tax
  const deliveryFee = orderType === 'delivery' ? 3.99 : 0;
  const total = subtotal + tax + deliveryFee + tip;

  const handlePlaceOrder = () => {
    if (orderType === 'delivery' && !selectedAddressId) {
      Alert.alert('Address Required', 'Please select a delivery address');
      return;
    }

    placeOrder(
      {
        items,
        type: orderType,
        addressId: selectedAddressId,
        tip,
        customerNotes,
      },
      {
        onSuccess: (order) => {
          clearCart();
          Alert.alert(
            'Order Placed!',
            `Your order #${order.id} has been placed successfully.`,
            [
              {
                text: 'View Order',
                onPress: () => router.replace(`/orders/${order.id}`),
              },
            ]
          );
        },
        onError: (error) => {
          Alert.alert('Error', 'Failed to place order. Please try again.');
        },
      }
    );
  };

  if (items.length === 0) {
    router.replace('/cart');
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Order Type */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Order Type
            </Text>
            <DeliveryToggle
              orderType={orderType}
              onToggle={setOrderType}
              testID="delivery-toggle"
            />
          </View>

          {/* Delivery Address */}
          {orderType === 'delivery' && addresses && (
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
              testID="address-selector"
            />
          )}

          {/* Tip */}
          <TipSelector
            subtotal={subtotal}
            selectedTip={tip}
            onSelectTip={setTip}
            testID="tip-selector"
          />

          {/* Customer Notes */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Order Notes (Optional)
            </Text>
            <TextInput
              value={customerNotes}
              onChangeText={setCustomerNotes}
              placeholder="Any special instructions for the restaurant?"
              multiline
              numberOfLines={3}
              className="bg-white rounded-lg p-4 text-gray-900 border border-gray-200"
              testID="customer-notes-input"
            />
          </View>

          {/* Order Summary */}
          <CartSummary
            subtotal={subtotal}
            tax={tax}
            tip={tip}
            deliveryFee={deliveryFee}
            total={total}
            testID="checkout-summary"
          />

          <View className="h-24" />
        </ScrollView>

        {/* Place Order Button */}
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isPending}
            className={`py-4 rounded-xl ${
              isPending ? 'bg-gray-300' : 'bg-primary-500'
            }`}
            testID="place-order-button"
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-center text-base">
                Place Order
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
