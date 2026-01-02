import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAssignments } from '../../hooks/useAssignments';
import { AssignmentCard } from '../../components/AssignmentCard';
import type { AssignmentStatus } from '../../types';

const TABS: { label: string; value: AssignmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Graded', value: 'graded' },
];

export default function HomeworkScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AssignmentStatus | 'all'>('all');

  const status = activeTab === 'all' ? undefined : activeTab;
  const { data: assignments, refetch, isLoading } = useAssignments(status);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusCount = (status: AssignmentStatus | 'all') => {
    if (!assignments) return 0;
    if (status === 'all') return assignments.length;
    return assignments.filter((a) => a.status === status).length;
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0 bg-white border-b border-gray-200 px-4 py-3"
      >
        {TABS.map((tab) => {
          const count = getStatusCount(tab.value);
          const isActive = activeTab === tab.value;

          return (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-full mr-2 ${
                isActive ? 'bg-primary-100' : 'bg-gray-100'
              }`}
              testID={`tab-${tab.value}`}
            >
              <Text
                className={`font-medium ${
                  isActive ? 'text-primary-700' : 'text-gray-600'
                }`}
              >
                {tab.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Assignments List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {isLoading ? (
          <View className="bg-white p-8 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500">Loading assignments...</Text>
          </View>
        ) : assignments && assignments.length > 0 ? (
          <>
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onPress={() => router.push(`/homework/${assignment.id}`)}
                testID={`assignment-${assignment.id}`}
              />
            ))}
          </>
        ) : (
          <View className="bg-white p-8 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500 text-base">
              No {activeTab === 'all' ? '' : activeTab} assignments
            </Text>
            <Text className="text-center text-gray-400 text-sm mt-2">
              You're all caught up! 🎉
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
