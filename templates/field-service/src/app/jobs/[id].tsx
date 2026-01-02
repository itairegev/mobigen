import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Edit, Camera } from 'lucide-react-native';
import { useJobs, useTimeLog } from '@/hooks';
import { ClientCard, MapView, TimeTracker } from '@/components';
import { formatDateTimeRange, getStatusLabel, getPriorityLabel } from '@/utils';
import { statusColors, priorityColors } from '@/theme';

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedJob, fetchJobById, loading } = useJobs();
  const { activeEntry, startTimer, stopTimer, getActiveEntryForJob } = useTimeLog();

  const [timerLoading, setTimerLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobById(id);
    }
  }, [id]);

  const handleClockIn = async () => {
    if (!selectedJob) return;

    setTimerLoading(true);
    try {
      await startTimer(selectedJob.id, 'Started work on job');
      Alert.alert('Success', 'Timer started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start timer');
    } finally {
      setTimerLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

    setTimerLoading(true);
    try {
      await stopTimer(activeEntry.id, 'Completed work session');
      Alert.alert('Success', 'Timer stopped successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop timer');
    } finally {
      setTimerLoading(false);
    }
  };

  if (loading || !selectedJob) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const jobActiveEntry = getActiveEntryForJob(selectedJob.id);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 flex-1">
          Job Details
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/jobs/${id}/status`)}
          testID="edit-status-button"
        >
          <Edit size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-6 space-y-4">
          {/* Job Header */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1 mr-2">
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  {selectedJob.title}
                </Text>
                <Text className="text-base text-gray-600 mb-3">
                  {selectedJob.description}
                </Text>
              </View>

              {/* Status Badge */}
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${statusColors[selectedJob.status]}20` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusColors[selectedJob.status] }}
                >
                  {getStatusLabel(selectedJob.status)}
                </Text>
              </View>
            </View>

            {/* Schedule & Priority */}
            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
              <View>
                <Text className="text-xs text-gray-500 mb-1">Scheduled</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatDateTimeRange(
                    selectedJob.scheduledDate,
                    selectedJob.scheduledTime,
                    selectedJob.estimatedDuration
                  )}
                </Text>
              </View>

              {selectedJob.priority !== 'normal' && (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${priorityColors[selectedJob.priority]}20` }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: priorityColors[selectedJob.priority] }}
                  >
                    {getPriorityLabel(selectedJob.priority)}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            {selectedJob.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-3">
                {selectedJob.tags.map((tag) => (
                  <View key={tag} className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-gray-700">{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Notes */}
            {selectedJob.notes && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-500 mb-1">Notes</Text>
                <Text className="text-sm text-gray-700">{selectedJob.notes}</Text>
              </View>
            )}
          </View>

          {/* Time Tracker */}
          <TimeTracker
            activeEntry={jobActiveEntry}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            loading={timerLoading}
            testID="job-time-tracker"
          />

          {/* Client Info */}
          <ClientCard client={selectedJob.client} testID="job-client-card" />

          {/* Location */}
          <MapView location={selectedJob.location} testID="job-map" />

          {/* Photos Button */}
          <TouchableOpacity
            onPress={() => router.push(`/jobs/${id}/photos`)}
            className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center justify-between"
            testID="view-photos-button"
          >
            <View className="flex-row items-center">
              <Camera size={24} color="#3b82f6" />
              <Text className="ml-3 text-base font-semibold text-gray-900">
                Job Photos
              </Text>
            </View>
            <Text className="text-blue-600 font-semibold">View</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
