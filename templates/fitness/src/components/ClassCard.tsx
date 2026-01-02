import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Users, MapPin } from 'lucide-react-native';
import { FitnessClass } from '@/types';
import { format } from 'date-fns';
import { Card } from './Card';

interface ClassCardProps {
  fitnessClass: FitnessClass;
  onPress: () => void;
  testID?: string;
}

export function ClassCard({ fitnessClass, onPress, testID }: ClassCardProps) {
  const spotsLeft = fitnessClass.capacity - fitnessClass.enrolled;
  const isAlmostFull = spotsLeft <= 3;
  const isFull = spotsLeft === 0;

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <TouchableOpacity onPress={onPress} testID={testID}>
      <Card className="mb-4 overflow-hidden">
        {fitnessClass.image && (
          <Image
            source={{ uri: fitnessClass.image }}
            className="w-full h-40"
            resizeMode="cover"
          />
        )}

        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-gray-900 flex-1">
              {fitnessClass.name}
            </Text>
            <View className={`px-2 py-1 rounded-full ${difficultyColors[fitnessClass.difficulty]}`}>
              <Text className="text-xs font-medium capitalize">
                {fitnessClass.difficulty}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 mb-3 leading-5" numberOfLines={2}>
            {fitnessClass.description}
          </Text>

          <View className="flex-row items-center mb-2">
            {fitnessClass.instructorImage && (
              <Image
                source={{ uri: fitnessClass.instructorImage }}
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <Text className="text-sm text-gray-700 font-medium">
              {fitnessClass.instructor}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Calendar size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {format(fitnessClass.datetime, 'MMM d, h:mm a')}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {fitnessClass.duration} min
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MapPin size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {fitnessClass.location}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Users
                size={16}
                color={isFull ? '#ef4444' : isAlmostFull ? '#f59e0b' : '#10b981'}
              />
              <Text
                className={`text-sm font-medium ml-1 ${
                  isFull
                    ? 'text-red-600'
                    : isAlmostFull
                    ? 'text-yellow-600'
                    : 'text-primary-600'
                }`}
              >
                {spotsLeft} spots left
              </Text>
            </View>
          </View>

          {isFull && (
            <View className="mt-3 bg-red-50 rounded-lg p-2">
              <Text className="text-sm text-red-700 text-center font-medium">
                Class is Full
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}
