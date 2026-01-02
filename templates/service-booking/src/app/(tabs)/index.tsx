import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sparkles, Clock, Award, ArrowRight } from 'lucide-react-native';
import { useServices, useCategories } from '@/hooks';
import { ServiceCard } from '@/components';

export default function HomeScreen() {
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: categories } = useCategories();

  const featuredServices = services?.slice(0, 3) || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Hero Section */}
        <View className="bg-primary-600 px-6 py-8">
          <Text className="text-white text-3xl font-bold mb-2">
            Book Your Next Appointment
          </Text>
          <Text className="text-primary-100 text-base">
            Professional services at your fingertips
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-around px-6 py-6 bg-white">
          <View className="items-center">
            <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mb-2">
              <Sparkles size={24} color="#0d9488" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">50+</Text>
            <Text className="text-sm text-gray-600">Services</Text>
          </View>
          <View className="items-center">
            <View className="w-12 h-12 bg-secondary-100 rounded-full items-center justify-center mb-2">
              <Award size={24} color="#9333ea" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">4.9</Text>
            <Text className="text-sm text-gray-600">Rating</Text>
          </View>
          <View className="items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
              <Clock size={24} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">24/7</Text>
            <Text className="text-sm text-gray-600">Booking</Text>
          </View>
        </View>

        {/* Categories */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Categories</Text>
            <TouchableOpacity
              onPress={() => router.push('/services')}
              testID="view-all-categories"
            >
              <Text className="text-primary-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {categories?.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => router.push('/services')}
                className="bg-white rounded-xl p-4 mr-3 shadow-sm items-center w-28"
                testID={`category-${category.id}`}
              >
                <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mb-2">
                  <Scissors size={24} color="#0d9488" />
                </View>
                <Text className="text-sm font-medium text-gray-900 text-center">
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Services */}
        <View className="px-6 pb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Popular Services
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/services')}
              testID="view-all-services"
            >
              <Text className="text-primary-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          {servicesLoading ? (
            <Text className="text-gray-500 text-center py-8">Loading...</Text>
          ) : (
            <>
              {featuredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => router.push(`/services/${service.id}`)}
                  testID={`service-${service.id}`}
                />
              ))}
              <TouchableOpacity
                onPress={() => router.push('/services')}
                className="bg-primary-600 rounded-xl py-4 flex-row items-center justify-center"
                testID="browse-all-services"
              >
                <Text className="text-white font-semibold text-base mr-2">
                  Browse All Services
                </Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Scissors({ size, color }: { size: number; color: string }) {
  return <View style={{ width: size, height: size, backgroundColor: color }} />;
}
