import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, TrendingUp, Briefcase } from 'lucide-react-native';
import { useJobs } from '@/hooks';
import { JobCard, JobStats } from '@/components';
import { getJobStats } from '@/services/jobs';
import type { JobStats as JobStatsType } from '@/types';
import { formatDate } from '@/utils';

export default function HomeScreen() {
  const router = useRouter();
  const { jobs, loading, fetchJobs } = useJobs();
  const [stats, setStats] = useState<JobStatsType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayJobs = jobs.filter((job) => job.scheduledDate === today);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchJobs({ date: today }),
      loadStats(),
    ]);
  };

  const loadStats = async () => {
    try {
      const data = await getJobStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-blue-600 px-6 py-6 rounded-b-3xl">
          <Text className="text-white text-3xl font-bold mb-2">
            Good {getGreeting()}!
          </Text>
          <View className="flex-row items-center">
            <Calendar size={18} color="white" />
            <Text className="text-white/90 ml-2 text-base">
              {formatDate(today)}
            </Text>
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Stats */}
          {stats && (
            <View className="mb-6">
              <JobStats stats={stats} testID="home-stats" />
            </View>
          )}

          {/* Today's Jobs */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Today's Schedule
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/jobs')}
                testID="view-all-jobs-button"
              >
                <Text className="text-blue-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {loading && todayJobs.length === 0 ? (
              <View className="bg-white rounded-lg p-8 items-center">
                <Text className="text-gray-500">Loading jobs...</Text>
              </View>
            ) : todayJobs.length > 0 ? (
              todayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => router.push(`/jobs/${job.id}`)}
                  testID={`job-card-${job.id}`}
                />
              ))
            ) : (
              <View className="bg-white rounded-lg p-8 items-center">
                <Calendar size={48} color="#9ca3af" />
                <Text className="text-gray-500 text-center mt-3">
                  No jobs scheduled for today
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <QuickActionCard
                icon={<Briefcase size={24} color="#3b82f6" />}
                title="All Jobs"
                onPress={() => router.push('/jobs')}
                testID="quick-action-jobs"
              />
              <QuickActionCard
                icon={<TrendingUp size={24} color="#22c55e" />}
                title="Time Log"
                onPress={() => router.push('/timelog')}
                testID="quick-action-timelog"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  testID?: string;
}

function QuickActionCard({ icon, title, onPress, testID }: QuickActionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-white rounded-lg p-4 border border-gray-200 items-center"
      testID={testID}
    >
      <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-2">
        {icon}
      </View>
      <Text className="text-sm font-semibold text-gray-900">{title}</Text>
    </TouchableOpacity>
  );
}
