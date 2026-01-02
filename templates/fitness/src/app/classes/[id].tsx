import { View, Text, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar, Clock, Users, MapPin, User as UserIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { Button, Card } from '@/components';
import { useClass } from '@/hooks';
import { useState } from 'react';
import { bookClass } from '@/services/classes';

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: fitnessClass, isLoading } = useClass(id);
  const [booking, setBooking] = useState(false);

  const handleBookClass = async () => {
    if (!fitnessClass) return;

    setBooking(true);
    try {
      const success = await bookClass(fitnessClass.id);
      if (success) {
        Alert.alert(
          'Class Booked!',
          `You've successfully booked ${fitnessClass.name}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Booking Failed', 'This class is full or unavailable');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book class');
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!fitnessClass) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-gray-600 text-center">Class not found</Text>
        <Button title="Go Back" onPress={() => router.back()} testID="back-button" />
      </SafeAreaView>
    );
  }

  const spotsLeft = fitnessClass.capacity - fitnessClass.enrolled;
  const isFull = spotsLeft === 0;

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {fitnessClass.image && (
          <Image
            source={{ uri: fitnessClass.image }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}

        <View className="p-6">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-4">
            <Text className="text-3xl font-bold text-gray-900 flex-1">
              {fitnessClass.name}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${difficultyColors[fitnessClass.difficulty]}`}
            >
              <Text className="text-sm font-medium capitalize">
                {fitnessClass.difficulty}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-gray-700 leading-6 mb-6">{fitnessClass.description}</Text>

          {/* Instructor */}
          <Card className="p-4 mb-6">
            <Text className="text-sm font-medium text-gray-500 mb-3">Instructor</Text>
            <View className="flex-row items-center">
              {fitnessClass.instructorImage ? (
                <Image
                  source={{ uri: fitnessClass.instructorImage }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                  <UserIcon size={24} color="#10b981" />
                </View>
              )}
              <Text className="text-lg font-semibold text-gray-900 ml-3">
                {fitnessClass.instructor}
              </Text>
            </View>
          </Card>

          {/* Details */}
          <Card className="p-4 mb-6">
            <Text className="text-sm font-medium text-gray-500 mb-3">Class Details</Text>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Calendar size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3 flex-1">
                {format(fitnessClass.datetime, 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Clock size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3 flex-1">
                {format(fitnessClass.datetime, 'h:mm a')} ({fitnessClass.duration} minutes)
              </Text>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <MapPin size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3 flex-1">{fitnessClass.location}</Text>
            </View>

            <View className="flex-row items-center py-3">
              <Users
                size={20}
                color={isFull ? '#ef4444' : spotsLeft <= 3 ? '#f59e0b' : '#10b981'}
              />
              <Text className="text-gray-900 ml-3 flex-1">
                {spotsLeft} spots remaining ({fitnessClass.enrolled}/{fitnessClass.capacity})
              </Text>
            </View>
          </Card>

          {/* Booking Button */}
          <Button
            title={isFull ? 'Class Full' : 'Book This Class'}
            onPress={handleBookClass}
            disabled={isFull || booking}
            loading={booking}
            testID="book-class-button"
          />

          {isFull && (
            <View className="mt-4 bg-red-50 rounded-lg p-4">
              <Text className="text-sm text-red-700 text-center">
                This class is currently full. Please check back later or choose another class.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
