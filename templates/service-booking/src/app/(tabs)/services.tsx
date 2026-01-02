import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useServices, useCategories } from '@/hooks';
import { ServiceCard } from '@/components';

export default function ServicesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: services, isLoading } = useServices(selectedCategory);
  const { data: categories } = useCategories();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Category Filter */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(undefined)}
            className={`px-4 py-2 rounded-full mr-2 ${
              !selectedCategory ? 'bg-primary-600' : 'bg-gray-100'
            }`}
            testID="category-all"
          >
            <Text
              className={`font-medium ${
                !selectedCategory ? 'text-white' : 'text-gray-700'
              }`}
            >
              All Services
            </Text>
          </TouchableOpacity>
          {categories?.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === category.id ? 'bg-primary-600' : 'bg-gray-100'
              }`}
              testID={`category-filter-${category.id}`}
            >
              <Text
                className={`font-medium ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Services List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0d9488" />
            <Text className="text-gray-500 mt-4">Loading services...</Text>
          </View>
        ) : services && services.length > 0 ? (
          <>
            <Text className="text-gray-600 mb-4">
              {services.length} service{services.length !== 1 ? 's' : ''} available
            </Text>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => router.push(`/services/${service.id}`)}
                testID={`service-card-${service.id}`}
              />
            ))}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-center">
              No services found in this category
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
