import { TouchableOpacity, View, Text } from 'react-native';
import { Order } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/utils';
import { getOrderStatusDisplay } from '@/services';
import { ChevronRight } from 'lucide-react-native';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  testID?: string;
}

export function OrderCard({ order, onPress, testID }: OrderCardProps) {
  const statusInfo = getOrderStatusDisplay(order.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      testID={testID}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 mb-1">
            Order #{order.id}
          </Text>
          <Text className="text-sm text-gray-500">
            {formatRelativeTime(order.placedAt)}
          </Text>
        </View>

        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: statusInfo.color + '20' }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-600 mb-1">
          {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.type === 'delivery' ? 'Delivery' : 'Pickup'}
        </Text>
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {order.items.map((item) => item.name).join(', ')}
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
        <Text className="text-lg font-bold text-gray-900">
          {formatCurrency(order.total)}
        </Text>

        <View className="flex-row items-center">
          <Text className="text-primary-600 font-semibold mr-1">
            View Details
          </Text>
          <ChevronRight size={20} color="#ff6b35" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
