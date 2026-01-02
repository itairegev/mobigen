import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useJobs } from '@/hooks';
import { StatusSelector } from '@/components';
import type { JobStatus } from '@/types';

export default function UpdateStatusScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedJob, updateStatus, loading } = useJobs();
  const [newStatus, setNewStatus] = useState<JobStatus | null>(null);

  if (!selectedJob) {
    return null;
  }

  const handleSave = async () => {
    if (!newStatus || newStatus === selectedJob.status) {
      router.back();
      return;
    }

    try {
      await updateStatus(id!, newStatus);
      Alert.alert('Success', 'Job status updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update job status');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 flex-1">
          Update Status
        </Text>
      </View>

      <View className="flex-1 p-6">
        {/* Job Title */}
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-base font-semibold text-gray-900">
            {selectedJob.title}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {selectedJob.client.name}
          </Text>
        </View>

        {/* Status Selector */}
        <StatusSelector
          currentStatus={newStatus || selectedJob.status}
          onStatusChange={setNewStatus}
          testID="status-selector"
        />

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !newStatus}
          className={`bg-blue-500 rounded-lg py-4 mt-6 ${
            loading || !newStatus ? 'opacity-50' : ''
          }`}
          testID="save-status-button"
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
