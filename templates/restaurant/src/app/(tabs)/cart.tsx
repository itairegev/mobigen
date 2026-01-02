import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCart } from '@/hooks';
import { CartItem, CartSummary } from '@/components';
import { ShoppingCart } from 'lucide-react-native';

export default function CartScreen() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const tax = subtotal * 0.09; // 9% tax
  const deliveryFee = 3.99; // Fixed delivery fee
  const total = subtotal + tax + deliveryFee;

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <ShoppingCart size={64} color="#d1d5db" />
          <Text className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            Your cart is empty
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Add items from the menu to get started
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/menu')}
            className="bg-primary-500 px-8 py-4 rounded-xl"
            testID="browse-menu-button"
          >
            <Text className="text-white font-semibold text-base">
              Browse Menu
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              Your Cart
            </Text>
            <TouchableOpacity
              onPress={clearCart}
              testID="clear-cart-button"
            >
              <Text className="text-primary-600 font-semibold">
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 mt-1">
            {items.length} item{items.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Cart Items */}
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
              onRemove={() => removeItem(item.id)}
              testID={`cart-item-${item.id}`}
            />
          ))}

          <View className="h-4" />

          {/* Order Summary */}
          <CartSummary
            subtotal={subtotal}
            tax={tax}
            tip={0}
            deliveryFee={deliveryFee}
            total={total}
            testID="cart-summary"
          />

          <View className="h-24" />
        </ScrollView>

        {/* Checkout Button */}
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => router.push('/checkout')}
            className="bg-primary-500 py-4 rounded-xl"
            testID="checkout-button"
          >
            <Text className="text-white font-bold text-center text-base">
              Proceed to Checkout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
