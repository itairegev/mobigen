import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react-native';
import { useEvent } from '../../hooks/useEvents';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center">Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = event.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isRegistrationOpen = event.registrationRequired && (!event.capacity || (event.registered || 0) < event.capacity);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Event Image */}
        <Image
          source={{ uri: event.image }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="px-6 py-6">
          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 mb-4">{event.title}</Text>

          {/* Meta Info */}
          <View className="space-y-3 mb-6">
            <View className="flex-row items-center">
              <Calendar size={20} color="#64748b" />
              <Text className="text-base text-gray-700 ml-3">{formattedDate}</Text>
            </View>

            <View className="flex-row items-center">
              <Clock size={20} color="#64748b" />
              <Text className="text-base text-gray-700 ml-3">{event.time}</Text>
            </View>

            <View className="flex-row items-center">
              <MapPin size={20} color="#64748b" />
              <View className="flex-1 ml-3">
                <Text className="text-base text-gray-700 font-semibold">{event.location}</Text>
                {event.address && (
                  <Text className="text-sm text-gray-500 mt-1">{event.address}</Text>
                )}
              </View>
            </View>

            {event.registrationRequired && event.capacity && (
              <View className="flex-row items-center">
                <Users size={20} color="#64748b" />
                <Text className="text-base text-gray-700 ml-3">
                  {event.registered || 0} / {event.capacity} registered
                </Text>
              </View>
            )}
          </View>

          {/* Registration Button */}
          {event.registrationRequired && (
            <View className="mb-6">
              {isRegistrationOpen ? (
                <TouchableOpacity
                  className="bg-primary-600 rounded-xl p-4 flex-row items-center justify-center"
                  testID="register-button"
                >
                  <CheckCircle size={24} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">Register Now</Text>
                </TouchableOpacity>
              ) : (
                <View className="bg-gray-100 rounded-xl p-4">
                  <Text className="text-gray-600 text-center font-semibold">
                    Registration Full
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-3">About This Event</Text>
            <Text className="text-base text-gray-700 leading-6">{event.description}</Text>
          </View>

          {/* Category Badge */}
          <View className="mt-6 bg-primary-50 rounded-lg px-4 py-3">
            <Text className="text-sm text-primary-700 capitalize font-medium">
              Category: {event.category.replace('-', ' ')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
