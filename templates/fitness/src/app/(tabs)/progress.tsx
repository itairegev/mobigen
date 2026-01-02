import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Clock, Flame, TrendingUp } from 'lucide-react-native';
import { StatsCard, StreakBadge, GoalProgress, ProgressChart } from '@/components';
import { useProgress } from '@/hooks';

export default function ProgressScreen() {
  const { stats, goals, workoutLogs } = useProgress();

  // Mock weekly data for chart
  const weeklyData = [
    { week: 'Mon', workouts: 1, minutes: 58, calories: 450 },
    { week: 'Tue', workouts: 1, minutes: 26, calories: 280 },
    { week: 'Wed', workouts: 0, minutes: 0, calories: 0 },
    { week: 'Thu', workouts: 1, minutes: 32, calories: 200 },
    { week: 'Fri', workouts: 0, minutes: 0, calories: 0 },
    { week: 'Sat', workouts: 0, minutes: 0, calories: 0 },
    { week: 'Sun', workouts: 0, minutes: 0, calories: 0 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900">Your Progress</Text>
            <Text className="text-gray-600 mt-1">Track your fitness journey</Text>
          </View>

          {/* Streak */}
          <StreakBadge
            streak={stats.streak}
            longestStreak={stats.longestStreak}
            testID="progress-streak"
          />

          {/* Overview Stats */}
          <View className="my-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Overview</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatsCard
                title="Total Workouts"
                value={stats.totalWorkouts}
                icon={Activity}
                iconColor="#10b981"
                testID="stat-total-workouts"
              />
              <StatsCard
                title="Total Minutes"
                value={stats.totalMinutes}
                icon={Clock}
                iconColor="#3b82f6"
                testID="stat-total-minutes"
              />
              <StatsCard
                title="Calories Burned"
                value={stats.totalCalories.toLocaleString()}
                icon={Flame}
                iconColor="#f59e0b"
                testID="stat-total-calories"
              />
              <StatsCard
                title="Avg Duration"
                value={`${Math.round(stats.averageWorkoutDuration)} min`}
                icon={TrendingUp}
                iconColor="#8b5cf6"
                testID="stat-avg-duration"
              />
            </View>
          </View>

          {/* Weekly Chart */}
          <View className="mb-6">
            <ProgressChart data={weeklyData} testID="weekly-chart" />
          </View>

          {/* Goals */}
          {goals.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Active Goals
              </Text>
              {goals.map((goal) => (
                <GoalProgress key={goal.id} goal={goal} testID={`goal-${goal.id}`} />
              ))}
            </View>
          )}

          {/* Recent Workouts */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Recent Workouts
            </Text>
            {workoutLogs.length > 0 ? (
              workoutLogs.slice(0, 5).map((log) => (
                <View
                  key={log.id}
                  className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-gray-900">
                      {log.workoutName}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {log.date.toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center">
                      <Clock size={16} color="#6b7280" />
                      <Text className="text-sm text-gray-600 ml-1">
                        {log.duration} min
                      </Text>
                    </View>
                    {log.caloriesBurned && (
                      <View className="flex-row items-center">
                        <Flame size={16} color="#f59e0b" />
                        <Text className="text-sm text-gray-600 ml-1">
                          {log.caloriesBurned} cal
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-white rounded-xl p-6 items-center">
                <Text className="text-gray-600 text-center">
                  No workouts logged yet. Start tracking your progress!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
