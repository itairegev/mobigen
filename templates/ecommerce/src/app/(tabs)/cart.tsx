import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, CartItem } from '@/components';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/utils';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, updateQuantity, removeItem } = useCart();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-6xl mb-4">🛒</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          Your cart is empty
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Add some products to get started
        </Text>
        <Button
          title="Browse Products"
          onPress={() => router.push('/')}
          testID="browse-products-button"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
            onRemove={() => removeItem(item.id)}
            testID={`cart-item-${item.id}`}
          />
        )}
      />

      <View className="bg-white p-4 border-t border-gray-200">
        <View className="flex-row justify-between mb-4">
          <Text className="text-lg text-gray-600">Total</Text>
          <Text className="text-xl font-bold text-gray-900">
            {formatCurrency(total)}
          </Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          testID="checkout-button"
        />
      </View>
    </SafeAreaView>
  );
}
