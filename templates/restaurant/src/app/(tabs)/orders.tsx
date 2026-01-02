import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOrders, useActiveOrders } from '@/hooks';
import { OrderCard } from '@/components';
import { ClipboardList } from 'lucide-react-native';

export default function OrdersScreen() {
  const { data: allOrders, isLoading: loadingAll } = useOrders();
  const { data: activeOrders, isLoading: loadingActive } = useActiveOrders();

  if (loadingAll || loadingActive) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!allOrders || allOrders.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <ClipboardList size={64} color="#d1d5db" />
          <Text className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            No orders yet
          </Text>
          <Text className="text-gray-600 text-center">
            Your order history will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Active Orders */}
        {activeOrders && activeOrders.length > 0 && (
          <View className="bg-white px-6 py-4 mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Active Orders
            </Text>
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/orders/${order.id}`)}
                testID={`active-order-${order.id}`}
              />
            ))}
          </View>
        )}

        {/* Past Orders */}
        <View className="px-6 py-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            {activeOrders && activeOrders.length > 0 ? 'Past Orders' : 'All Orders'}
          </Text>
          {allOrders
            .filter((order) => {
              const isActive = activeOrders?.some((active) => active.id === order.id);
              return !isActive;
            })
            .map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/orders/${order.id}`)}
                testID={`order-${order.id}`}
              />
            ))}
        </View>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
