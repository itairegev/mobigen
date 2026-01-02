import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Activity, Calendar, Dumbbell, Target } from 'lucide-react-native';
import { StatsCard, StreakBadge, Button, Card } from '@/components';
import { useProgress } from '@/hooks';

export default function HomeScreen() {
  const { stats, goals } = useProgress();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900">Welcome Back!</Text>
            <Text className="text-gray-600 mt-1">Ready to crush your fitness goals?</Text>
          </View>

          {/* Streak Badge */}
          <StreakBadge
            streak={stats.streak}
            longestStreak={stats.longestStreak}
            testID="home-streak"
          />

          {/* Quick Stats */}
          <View className="flex-row gap-3 my-6">
            <StatsCard
              title="This Week"
              value={stats.thisWeek}
              icon={Activity}
              iconColor="#10b981"
              subtitle="workouts"
              testID="home-stat-week"
            />
            <StatsCard
              title="This Month"
              value={stats.thisMonth}
              icon={Target}
              iconColor="#3b82f6"
              subtitle="workouts"
              testID="home-stat-month"
            />
          </View>

          {/* Quick Actions */}
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>

            <TouchableOpacity
              onPress={() => router.push('/log-workout')}
              className="bg-primary-500 rounded-lg p-4 mb-3 flex-row items-center"
              testID="home-log-workout-button"
            >
              <Dumbbell size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-base ml-3">
                Log Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/classes')}
              className="bg-secondary-500 rounded-lg p-4 flex-row items-center"
              testID="home-browse-classes-button"
            >
              <Calendar size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-base ml-3">
                Browse Classes
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Active Goals */}
          {goals.length > 0 && (
            <Card className="p-4 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Active Goals</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
                  <Text className="text-primary-600 font-medium">View All</Text>
                </TouchableOpacity>
              </View>

              {goals.slice(0, 2).map((goal) => {
                const progress = Math.min((goal.current / goal.target) * 100, 100);
                return (
                  <View key={goal.id} className="mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm text-gray-700">
                        {goal.type === 'workouts-per-week'
                          ? 'Workouts per Week'
                          : 'Minutes per Week'}
                      </Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        {goal.current} / {goal.target}
                      </Text>
                    </View>
                    <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <View
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
                <Text className="text-primary-600 font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-gray-50 rounded-lg p-4 items-center">
              <Text className="text-gray-600 text-center">
                Your recent workouts will appear here
              </Text>
              <Button
                title="Log Your First Workout"
                onPress={() => router.push('/log-workout')}
                size="sm"
                testID="home-first-workout-button"
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
