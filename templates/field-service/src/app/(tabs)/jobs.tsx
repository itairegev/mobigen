import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Filter } from 'lucide-react-native';
import { useJobs } from '@/hooks';
import { JobCard } from '@/components';
import type { JobStatus } from '@/types';

const STATUS_FILTERS: Array<{ label: string; value: JobStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

export default function JobsScreen() {
  const router = useRouter();
  const { jobs, loading, fetchJobs } = useJobs();
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [activeFilter]);

  const loadJobs = async () => {
    const filter = activeFilter !== 'all' ? { status: activeFilter } : undefined;
    await fetchJobs(filter);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const filteredJobs = jobs;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200 px-4 py-3"
      >
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-full mr-2 ${
              activeFilter === filter.value
                ? 'bg-blue-500'
                : 'bg-gray-100'
            }`}
            testID={`filter-${filter.value}`}
          >
            <Text
              className={`font-semibold ${
                activeFilter === filter.value
                  ? 'text-white'
                  : 'text-gray-600'
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jobs List */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && filteredJobs.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-gray-500">Loading jobs...</Text>
          </View>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push(`/jobs/${job.id}`)}
              testID={`job-card-${job.id}`}
            />
          ))
        ) : (
          <View className="bg-white rounded-lg p-8 items-center">
            <Filter size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-center mt-3">
              No jobs found
            </Text>
            {activeFilter !== 'all' && (
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                className="mt-4"
              >
                <Text className="text-blue-600 font-semibold">Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
