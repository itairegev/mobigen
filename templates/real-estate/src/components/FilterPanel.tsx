import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from './Button';
import { Input } from './Input';
import type { PropertyType, PropertyStatus } from '@/types';

interface FilterPanelProps {
  filters: {
    type: PropertyType[];
    status?: PropertyStatus;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
  onFilterChange: (filters: any) => void;
  onClose: () => void;
  testID?: string;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: 'for-sale', label: 'For Sale' },
  { value: 'for-rent', label: 'For Rent' },
];

export function FilterPanel({ filters, onFilterChange, onClose, testID }: FilterPanelProps) {
  const toggleType = (type: PropertyType) => {
    const types = filters.type.includes(type)
      ? filters.type.filter((t) => t !== type)
      : [...filters.type, type];
    onFilterChange({ ...filters, type: types });
  };

  const setStatus = (status: PropertyStatus) => {
    onFilterChange({ ...filters, status: filters.status === status ? undefined : status });
  };

  return (
    <View className="flex-1 bg-white" testID={testID}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-xl font-bold">Filters</Text>
        <TouchableOpacity onPress={onClose} testID={`${testID}-close`}>
          <X size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Status */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-2 rounded-full border ${
                  filters.status === option.value
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setStatus(option.value)}
                testID={`${testID}-status-${option.value}`}
              >
                <Text
                  className={
                    filters.status === option.value ? 'text-white' : 'text-gray-700'
                  }
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Property Type */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Property Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                className={`px-4 py-2 rounded-full border ${
                  filters.type.includes(type.value)
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => toggleType(type.value)}
                testID={`${testID}-type-${type.value}`}
              >
                <Text
                  className={
                    filters.type.includes(type.value) ? 'text-white' : 'text-gray-700'
                  }
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Price Range</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                placeholder="Min"
                keyboardType="numeric"
                value={filters.priceMin?.toString() || ''}
                onChangeText={(text) =>
                  onFilterChange({
                    ...filters,
                    priceMin: text ? parseInt(text, 10) : undefined,
                  })
                }
                testID={`${testID}-price-min`}
              />
            </View>
            <View className="flex-1">
              <Input
                placeholder="Max"
                keyboardType="numeric"
                value={filters.priceMax?.toString() || ''}
                onChangeText={(text) =>
                  onFilterChange({
                    ...filters,
                    priceMax: text ? parseInt(text, 10) : undefined,
                  })
                }
                testID={`${testID}-price-max`}
              />
            </View>
          </View>
        </View>

        {/* Bedrooms */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Minimum Bedrooms</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                className={`px-4 py-2 rounded-full border ${
                  filters.bedrooms === num
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() =>
                  onFilterChange({
                    ...filters,
                    bedrooms: filters.bedrooms === num ? undefined : num,
                  })
                }
                testID={`${testID}-bedrooms-${num}`}
              >
                <Text
                  className={filters.bedrooms === num ? 'text-white' : 'text-gray-700'}
                >
                  {num}+
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bathrooms */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Minimum Bathrooms</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4].map((num) => (
              <TouchableOpacity
                key={num}
                className={`px-4 py-2 rounded-full border ${
                  filters.bathrooms === num
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() =>
                  onFilterChange({
                    ...filters,
                    bathrooms: filters.bathrooms === num ? undefined : num,
                  })
                }
                testID={`${testID}-bathrooms-${num}`}
              >
                <Text
                  className={filters.bathrooms === num ? 'text-white' : 'text-gray-700'}
                >
                  {num}+
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-200">
        <Button
          title="Apply Filters"
          onPress={onClose}
          testID={`${testID}-apply`}
        />
      </View>
    </View>
  );
}
