import { View, Text } from 'react-native';
import { OrderStatus as OrderStatusType } from '@/types';
import { getOrderStatusDisplay } from '@/services';
import { Check } from 'lucide-react-native';

interface OrderStatusProps {
  status: OrderStatusType;
  orderType: 'pickup' | 'delivery';
  testID?: string;
}

export function OrderStatus({ status, orderType, testID }: OrderStatusProps) {
  const steps = orderType === 'delivery'
    ? [
        { key: 'pending', label: 'Received' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'preparing', label: 'Preparing' },
        { key: 'out-for-delivery', label: 'On the Way' },
        { key: 'delivered', label: 'Delivered' },
      ]
    : [
        { key: 'pending', label: 'Received' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'preparing', label: 'Preparing' },
        { key: 'ready', label: 'Ready' },
        { key: 'completed', label: 'Picked Up' },
      ];

  const statusInfo = getOrderStatusDisplay(status);

  const getStepIndex = (stepKey: string): number => {
    const map: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      ready: 3,
      'out-for-delivery': 3,
      delivered: 4,
      completed: 4,
    };
    return map[stepKey] ?? -1;
  };

  const currentStepIndex = getStepIndex(status);

  return (
    <View className="bg-white rounded-xl p-6" testID={testID}>
      <Text className="text-xl font-bold text-gray-900 mb-2">
        {statusInfo.label}
      </Text>
      <Text className="text-gray-600 mb-6">
        {statusInfo.description}
      </Text>

      <View className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isActive = currentStepIndex === index;

          return (
            <View key={step.key} className="flex-row items-center">
              <View className="relative">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                >
                  {isCompleted && <Check size={20} color="#ffffff" />}
                </View>

                {index < steps.length - 1 && (
                  <View
                    className={`absolute left-1/2 -ml-0.5 top-10 w-0.5 h-8 ${
                      currentStepIndex > index ? 'bg-primary-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </View>

              <View className="ml-4 flex-1">
                <Text
                  className={`text-base font-semibold ${
                    isActive ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
