import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Clock, DollarSign, Users } from 'lucide-react-native';
import { useService, useStaffForService, useBooking } from '@/hooks';
import { StaffCard } from '@/components';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const serviceId = Array.isArray(id) ? id[0] : id;

  const { data: service, isLoading } = useService(serviceId);
  const { data: staff } = useStaffForService(serviceId);
  const { setService } = useBooking();

  const handleBookNow = () => {
    setService(serviceId);
    router.push('/book/staff');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0d9488" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Service not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          testID="close-button"
        >
          <X size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-900 ml-2">
          Service Details
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Service Image */}
        {service.image && (
          <Image
            source={{ uri: service.image }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}

        {/* Service Info */}
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {service.name}
          </Text>
          <Text className="text-base text-gray-600 mb-6">
            {service.description}
          </Text>

          {/* Service Details */}
          <View className="flex-row justify-between mb-6">
            <View className="flex-1 bg-gray-50 rounded-xl p-4 mr-2">
              <Clock size={24} color="#0d9488" />
              <Text className="text-sm text-gray-500 mt-2">Duration</Text>
              <Text className="text-lg font-semibold text-gray-900">
                {service.duration} min
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2">
              <DollarSign size={24} color="#0d9488" />
              <Text className="text-sm text-gray-500 mt-2">Price</Text>
              <Text className="text-lg font-semibold text-gray-900">
                ${service.price}
              </Text>
            </View>
          </View>

          {/* Available Staff */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Users size={20} color="#111827" />
              <Text className="text-xl font-bold text-gray-900 ml-2">
                Available Staff
              </Text>
            </View>
            {staff && staff.length > 0 ? (
              staff.map((member) => (
                <StaffCard
                  key={member.id}
                  staff={member}
                  onPress={() => {}}
                  testID={`staff-${member.id}`}
                />
              ))
            ) : (
              <Text className="text-gray-500">No staff available</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View className="px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleBookNow}
          className="bg-primary-600 rounded-xl py-4 items-center"
          testID="book-now-button"
        >
          <Text className="text-white font-semibold text-lg">Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
