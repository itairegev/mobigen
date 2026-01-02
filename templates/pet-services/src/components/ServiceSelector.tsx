import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Service } from '@/types';

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
  testID?: string;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
  testID,
}: ServiceSelectorProps) {
  const serviceTypeLabels = {
    veterinary: 'Veterinary',
    grooming: 'Grooming',
    boarding: 'Boarding',
    training: 'Training',
    daycare: 'Daycare',
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.type]) {
      acc[service.type] = [];
    }
    acc[service.type].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <ScrollView className="flex-1" testID={testID}>
      {Object.entries(groupedServices).map(([type, typeServices]) => (
        <View key={type} className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3 px-4">
            {serviceTypeLabels[type as keyof typeof serviceTypeLabels]}
          </Text>

          {typeServices.map((service) => {
            const isSelected = service.id === selectedServiceId;

            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => onSelect(service.id)}
                className={`mx-4 mb-3 p-4 rounded-xl border-2 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
                testID={`service-${service.id}`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className={`text-base font-semibold flex-1 ${
                    isSelected ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {service.name}
                  </Text>
                  <Text className={`text-lg font-bold ${
                    isSelected ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    ${service.price}
                  </Text>
                </View>

                <Text className="text-sm text-gray-600 mb-2">
                  {service.description}
                </Text>

                <Text className="text-xs text-gray-500">
                  Duration: {service.duration} minutes
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
