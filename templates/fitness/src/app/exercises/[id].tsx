import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Dumbbell, Target, Wrench } from 'lucide-react-native';
import { Button, Card } from '@/components';
import { useExercise } from '@/hooks';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading } = useExercise(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-gray-600 text-center">Exercise not found</Text>
        <Button title="Go Back" onPress={() => router.back()} testID="back-button" />
      </SafeAreaView>
    );
  }

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  const categoryColors = {
    strength: 'bg-blue-50 text-blue-700',
    cardio: 'bg-red-50 text-red-700',
    flexibility: 'bg-purple-50 text-purple-700',
    balance: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {exercise.image && (
          <Image
            source={{ uri: exercise.image }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}

        <View className="p-6">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-4">
            <Text className="text-3xl font-bold text-gray-900 flex-1">
              {exercise.name}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${difficultyColors[exercise.difficulty]}`}
            >
              <Text className="text-sm font-medium capitalize">{exercise.difficulty}</Text>
            </View>
          </View>

          {/* Category */}
          <View className={`self-start px-3 py-1 rounded-full mb-4 ${categoryColors[exercise.category]}`}>
            <Text className="text-sm font-medium capitalize">{exercise.category}</Text>
          </View>

          {/* Description */}
          <Text className="text-gray-700 leading-6 mb-6">{exercise.description}</Text>

          {/* Muscle Groups */}
          <Card className="p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <Target size={20} color="#10b981" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Targeted Muscles
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {exercise.muscleGroups.map((muscle, index) => (
                <View key={index} className="bg-primary-50 rounded-full px-3 py-2">
                  <Text className="text-sm text-primary-700 font-medium">{muscle}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Equipment */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <Card className="p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <Wrench size={20} color="#3b82f6" />
                <Text className="text-base font-semibold text-gray-900 ml-2">
                  Equipment Needed
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {exercise.equipment.map((item, index) => (
                  <View key={index} className="bg-secondary-50 rounded-full px-3 py-2">
                    <Text className="text-sm text-secondary-700 font-medium">{item}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Instructions */}
          <Card className="p-4 mb-6">
            <View className="flex-row items-center mb-4">
              <Dumbbell size={20} color="#10b981" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                How to Perform
              </Text>
            </View>

            {exercise.instructions.map((instruction, index) => (
              <View key={index} className="flex-row mb-3">
                <View className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center mr-3">
                  <Text className="text-white text-sm font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-gray-700 leading-6">{instruction}</Text>
              </View>
            ))}
          </Card>

          {/* Tips */}
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <Text className="text-sm font-semibold text-yellow-900 mb-2">
              💡 Pro Tips
            </Text>
            <Text className="text-sm text-yellow-800 leading-5">
              • Always warm up before performing this exercise
              {'\n'}• Focus on proper form over weight or speed
              {'\n'}• Control the movement in both directions
              {'\n'}• Breathe consistently throughout the exercise
            </Text>
          </Card>

          <Button
            title="Add to Workout"
            onPress={() => console.log('Add to workout')}
            testID="add-to-workout-button"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
