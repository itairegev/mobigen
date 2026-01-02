import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { WorkoutCard } from '@/components';
import { useWorkouts } from '@/hooks';
import { WorkoutCategory } from '@/types';

export default function WorkoutsScreen() {
  const [category, setCategory] = useState<WorkoutCategory>('all');

  const { data: workouts, isLoading } = useWorkouts(
    category === 'all' ? undefined : category
  );

  const categories: WorkoutCategory[] = [
    'all',
    'full-body',
    'upper-body',
    'lower-body',
    'strength',
    'cardio',
    'flexibility',
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Category Filter */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-sm font-medium text-gray-700 mb-3">Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full ${
                  category === cat ? 'bg-primary-500' : 'bg-gray-100'
                }`}
                testID={`filter-category-${cat}`}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    category === cat ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {cat.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Workouts List */}
        <View className="p-6">
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-gray-600 mt-4">Loading workouts...</Text>
            </View>
          ) : workouts && workouts.length > 0 ? (
            <>
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {workouts.length} {workouts.length === 1 ? 'Workout' : 'Workouts'}
              </Text>
              {workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workouts/${workout.id}`)}
                  testID={`workout-card-${workout.id}`}
                />
              ))}
            </>
          ) : (
            <View className="py-20 items-center">
              <Text className="text-gray-600 text-center">
                No workouts found in this category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
