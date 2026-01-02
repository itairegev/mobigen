import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, Award } from 'lucide-react-native';
import { useGPA, useSubjectGradesSummary } from '../../hooks/useGrades';
import { SubjectGradeSummaryCard } from '../../components/GradeItem';

export default function GradesScreen() {
  const router = useRouter();
  const { data: gpa, refetch: refetchGPA, isLoading: loadingGPA } = useGPA();
  const { data: gradeSummary, refetch: refetchSummary, isLoading: loadingSummary } = useSubjectGradesSummary();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchGPA(), refetchSummary()]);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* GPA Card */}
        <View className="p-4">
          <View className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-xl">
            <View className="flex-row items-center gap-2 mb-2">
              <Award size={24} className="text-white" />
              <Text className="text-white text-lg font-semibold">Overall GPA</Text>
            </View>
            {loadingGPA ? (
              <Text className="text-white/80 text-base">Loading...</Text>
            ) : (
              <>
                <Text className="text-white text-5xl font-bold mb-1">
                  {gpa?.toFixed(2) || '0.00'}
                </Text>
                <Text className="text-white/80 text-sm">
                  Based on {gradeSummary?.length || 0} subjects
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Subject Grades */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Grades by Subject</Text>
          </View>

          {loadingSummary ? (
            <View className="bg-white p-8 rounded-lg border border-gray-200">
              <Text className="text-center text-gray-500">Loading grades...</Text>
            </View>
          ) : gradeSummary && gradeSummary.length > 0 ? (
            gradeSummary.map((summary) => (
              <SubjectGradeSummaryCard
                key={summary.subject.id}
                summary={summary}
                testID={`subject-grade-${summary.subject.id}`}
              />
            ))
          ) : (
            <View className="bg-white p-8 rounded-lg border border-gray-200">
              <Text className="text-center text-gray-500">No grades available</Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View className="px-4 pb-8">
          <View className="bg-white p-4 rounded-lg border border-gray-200">
            <Text className="font-semibold text-gray-900 mb-3">Grade Scale</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">A (90-100)</Text>
                <Text className="text-sm font-medium text-green-600">Excellent</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">B (80-89)</Text>
                <Text className="text-sm font-medium text-blue-600">Good</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">C (70-79)</Text>
                <Text className="text-sm font-medium text-amber-600">Satisfactory</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">D (60-69)</Text>
                <Text className="text-sm font-medium text-orange-600">Needs Improvement</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">F (Below 60)</Text>
                <Text className="text-sm font-medium text-red-600">Failing</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
