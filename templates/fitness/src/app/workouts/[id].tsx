import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Clock, Flame, Dumbbell } from 'lucide-react-native';
import { Button, Card, ExerciseItem } from '@/components';
import { useWorkout, useExercises } from '@/hooks';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isLoading: loadingWorkout } = useWorkout(id);
  const { data: allExercises, isLoading: loadingExercises } = useExercises();

  const isLoading = loadingWorkout || loadingExercises;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  if (!workout || !allExercises) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-gray-600 text-center">Workout not found</Text>
        <Button title="Go Back" onPress={() => router.back()} testID="back-button" />
      </SafeAreaView>
    );
  }

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    advanced: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {workout.image && (
          <Image
            source={{ uri: workout.image }}
            className="w-full h-56"
            resizeMode="cover"
          />
        )}

        <View className="p-6">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-4">
            <Text className="text-3xl font-bold text-gray-900 flex-1">
              {workout.name}
            </Text>
            <View
              className={`px-3 py-1 rounded-full border ${difficultyColors[workout.difficulty]}`}
            >
              <Text className="text-sm font-medium capitalize">{workout.difficulty}</Text>
            </View>
          </View>

          {/* Description */}
          <Text className="text-gray-700 leading-6 mb-6">{workout.description}</Text>

          {/* Stats */}
          <View className="flex-row gap-3 mb-6">
            <Card className="flex-1 p-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-gray-600">Duration</Text>
                <Clock size={18} color="#10b981" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">{workout.duration}</Text>
              <Text className="text-xs text-gray-500">minutes</Text>
            </Card>

            <Card className="flex-1 p-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-gray-600">Exercises</Text>
                <Dumbbell size={18} color="#3b82f6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                {workout.exercises.length}
              </Text>
              <Text className="text-xs text-gray-500">total</Text>
            </Card>

            {workout.caloriesBurned && (
              <Card className="flex-1 p-4">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm text-gray-600">Calories</Text>
                  <Flame size={18} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                  {workout.caloriesBurned}
                </Text>
                <Text className="text-xs text-gray-500">approx</Text>
              </Card>
            )}
          </View>

          {/* Exercises */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Exercises</Text>

            {workout.exercises.map((workoutExercise, index) => {
              const exercise = allExercises.find((e) => e.id === workoutExercise.exerciseId);
              if (!exercise) return null;

              return (
                <ExerciseItem
                  key={`${exercise.id}-${index}`}
                  exercise={exercise}
                  sets={workoutExercise.sets}
                  reps={workoutExercise.reps}
                  duration={workoutExercise.duration}
                  onPress={() => router.push(`/exercises/${exercise.id}`)}
                  testID={`exercise-item-${index}`}
                />
              );
            })}
          </View>

          {/* Action Buttons */}
          <Button
            title="Start This Workout"
            onPress={() => router.push('/log-workout')}
            testID="start-workout-button"
          />

          <View className="mt-4 bg-primary-50 rounded-lg p-4">
            <Text className="text-sm text-primary-700 text-center">
              Tap an exercise to view detailed instructions and technique
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
