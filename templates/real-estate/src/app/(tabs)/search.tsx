import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Filter } from 'lucide-react-native';
import { useSearchProperties, useSearch } from '@/hooks';
import { PropertyCard, Input, FilterPanel } from '@/components';

export default function SearchScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const { query, filters, setQuery, setFilters } = useSearch();
  const { data: properties, isLoading } = useSearchProperties(query, filters);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              placeholder="Search by city, address, or zip code"
              value={query}
              onChangeText={setQuery}
              testID="search-input"
            />
          </View>
          <TouchableOpacity
            className="bg-primary-600 px-4 py-3 rounded-lg items-center justify-center"
            onPress={() => setShowFilters(true)}
            testID="filters-button"
          >
            <Filter size={20} color="#fff" />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-gray-600 mb-4">
            {isLoading ? 'Searching...' : `${properties?.length || 0} properties found`}
          </Text>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : properties && properties.length > 0 ? (
            properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                testID={`search-property-${property.id}`}
              />
            ))
          ) : (
            <View className="py-12 items-center">
              <Text className="text-gray-500 text-center">
                No properties found.{'\n'}Try adjusting your search criteria.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setShowFilters(false)}
          testID="filter-panel"
        />
      </Modal>
    </View>
  );
}
