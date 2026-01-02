import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useOrder } from '@/hooks';
import { OrderStatus, CartSummary } from '@/components';
import { formatRelativeTime, formatTimeUntil, formatCurrency } from '@/utils';
import { Clock, MapPin } from 'lucide-react-native';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(
    order.status
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View className="bg-white px-6 py-6 mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Order #{order.id}
          </Text>
          <Text className="text-gray-600">
            Placed {formatRelativeTime(order.placedAt)}
          </Text>

          {/* Estimated Time */}
          {isActive && order.estimatedTime && (
            <View className="flex-row items-center mt-4 bg-primary-50 p-4 rounded-lg">
              <Clock size={24} color="#ff6b35" />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-gray-600 mb-1">
                  Estimated {order.type === 'delivery' ? 'Delivery' : 'Pickup'}
                </Text>
                <Text className="text-lg font-bold text-primary-600">
                  {formatTimeUntil(order.estimatedTime)}
                </Text>
              </View>
            </View>
          )}

          {/* Delivery Address */}
          {order.type === 'delivery' && order.address && (
            <View className="flex-row items-start mt-4 bg-gray-50 p-4 rounded-lg">
              <MapPin size={20} color="#6b7280" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  Delivery Address
                </Text>
                <Text className="text-sm text-gray-600">
                  {order.address.street}
                </Text>
                <Text className="text-sm text-gray-600">
                  {order.address.city}, {order.address.state} {order.address.zipCode}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Status */}
        <View className="mb-4">
          <OrderStatus
            status={order.status}
            orderType={order.type}
            testID="order-status"
          />
        </View>

        {/* Order Items */}
        <View className="bg-white px-6 py-6 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Order Items
          </Text>

          {order.items.map((item, index) => (
            <View
              key={item.id}
              className={`flex-row py-4 ${
                index < order.items.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <Image
                source={{ uri: item.image }}
                className="w-16 h-16 rounded-lg"
                resizeMode="cover"
              />

              <View className="flex-1 ml-4">
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="text-base font-semibold text-gray-900 flex-1 pr-2">
                    {item.name}
                  </Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>

                <Text className="text-sm text-gray-500 mb-1">
                  Qty: {item.quantity}
                </Text>

                {item.modifiers && item.modifiers.length > 0 && (
                  <View className="mt-1">
                    {item.modifiers.map((modifier) => (
                      <Text
                        key={`${modifier.groupId}-${modifier.modifierId}`}
                        className="text-xs text-gray-500"
                      >
                        + {modifier.modifierName}
                        {modifier.price > 0 && ` (${formatCurrency(modifier.price)})`}
                      </Text>
                    ))}
                  </View>
                )}

                {item.specialInstructions && (
                  <Text className="text-xs text-gray-500 italic mt-1">
                    Note: {item.specialInstructions}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Order Summary
          </Text>
          <CartSummary
            subtotal={order.subtotal}
            tax={order.tax}
            tip={order.tip}
            deliveryFee={order.deliveryFee}
            total={order.total}
            testID="order-summary"
          />
        </View>

        {order.customerNotes && (
          <View className="bg-white px-6 py-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-2">
              Customer Notes
            </Text>
            <Text className="text-gray-600">
              {order.customerNotes}
            </Text>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
