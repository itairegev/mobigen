import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Clock, DollarSign } from 'lucide-react-native';
import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  testID?: string;
}

export function ServiceCard({ service, onPress, testID }: ServiceCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      testID={testID}
    >
      {service.image && (
        <Image
          source={{ uri: service.image }}
          className="w-full h-48"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {service.name}
        </Text>
        <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
          {service.description}
        </Text>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Clock size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">
              {service.duration} min
            </Text>
          </View>
          <View className="flex-row items-center">
            <DollarSign size={16} color="#0d9488" />
            <Text className="text-lg font-bold text-primary-600">
              {service.price}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
