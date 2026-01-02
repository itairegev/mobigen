import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calculator, Calendar } from 'lucide-react-native';
import { useFeaturedProperties } from '@/hooks';
import { PropertyCard } from '@/components';

export default function HomeScreen() {
  const router = useRouter();
  const { data: properties, isLoading } = useFeaturedProperties();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-gray-900 font-bold text-3xl mb-2">Find Your Dream Home</Text>
        <Text className="text-gray-600 mb-6">
          Discover the perfect property for you and your family
        </Text>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 bg-primary-600 p-4 rounded-lg flex-row items-center justify-center"
            onPress={() => router.push('/search')}
            testID="home-search-button"
          >
            <Text className="text-white font-semibold">Search Properties</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 bg-white p-4 rounded-lg border border-gray-200 items-center"
            onPress={() => router.push('/calculator')}
            testID="home-calculator-button"
          >
            <Calculator size={24} color="#16a34a" />
            <Text className="text-gray-900 font-medium mt-2">Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white p-4 rounded-lg border border-gray-200 items-center"
            onPress={() => router.push('/schedule-tour')}
            testID="home-tours-button"
          >
            <Calendar size={24} color="#16a34a" />
            <Text className="text-gray-900 font-medium mt-2">My Tours</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Properties */}
        <View className="mb-4">
          <Text className="text-gray-900 font-bold text-xl mb-4">Featured Properties</Text>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : (
            properties?.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                testID={`featured-property-${property.id}`}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
