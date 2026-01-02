import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import type { Grade, SubjectGradesSummary } from '../types';
import { format } from 'date-fns';

interface GradeItemProps {
  grade: Grade;
  onPress?: () => void;
  testID?: string;
}

export function GradeItem({ grade, onPress, testID }: GradeItemProps) {
  const getGradeColor = () => {
    if (grade.percentage >= 90) return 'text-green-600';
    if (grade.percentage >= 80) return 'text-blue-600';
    if (grade.percentage >= 70) return 'text-amber-600';
    if (grade.percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBgColor = () => {
    if (grade.percentage >= 90) return 'bg-green-50';
    if (grade.percentage >= 80) return 'bg-blue-50';
    if (grade.percentage >= 70) return 'bg-amber-50';
    if (grade.percentage >= 60) return 'bg-orange-50';
    return 'bg-red-50';
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between p-4 bg-white border border-gray-200 rounded-lg mb-2"
      testID={testID}
    >
      <View className="flex-1">
        {grade.assignmentName && (
          <Text className="font-medium text-gray-900 mb-1" numberOfLines={1}>
            {grade.assignmentName}
          </Text>
        )}

        <View
          className="px-2 py-0.5 rounded mb-1"
          style={{ backgroundColor: grade.subjectColor + '20', alignSelf: 'flex-start' }}
        >
          <Text className="text-xs font-medium" style={{ color: grade.subjectColor }}>
            {grade.subjectName}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-500 capitalize">
            {grade.category}
          </Text>
          <Text className="text-xs text-gray-500">•</Text>
          <Text className="text-xs text-gray-500">
            {format(new Date(grade.gradedDate), 'MMM d, yyyy')}
          </Text>
        </View>

        {grade.feedback && (
          <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
            {grade.feedback}
          </Text>
        )}
      </View>

      <View className="items-end gap-1">
        <View className={`px-3 py-1.5 rounded-lg ${getGradeBgColor()}`}>
          <Text className={`text-lg font-bold ${getGradeColor()}`}>
            {grade.letterGrade}
          </Text>
        </View>
        <Text className="text-xs text-gray-600">
          {grade.score}/{grade.maxScore}
        </Text>
        <Text className={`text-xs font-medium ${getGradeColor()}`}>
          {grade.percentage.toFixed(0)}%
        </Text>
      </View>
    </Pressable>
  );
}

interface SubjectGradeSummaryCardProps {
  summary: SubjectGradesSummary;
  onPress?: () => void;
  testID?: string;
}

export function SubjectGradeSummaryCard({ summary, onPress, testID }: SubjectGradeSummaryCardProps) {
  const getGradeColor = () => {
    if (summary.average >= 90) return 'text-green-600';
    if (summary.average >= 80) return 'text-blue-600';
    if (summary.average >= 70) return 'text-amber-600';
    if (summary.average >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = () => {
    if (summary.trend === 'up') return <TrendingUp size={16} className="text-green-600" />;
    if (summary.trend === 'down') return <TrendingDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  return (
    <Pressable
      onPress={onPress}
      className="p-4 bg-white border border-gray-200 rounded-lg mb-3"
      testID={testID}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 mb-1">
            {summary.subject.name}
          </Text>
          <Text className="text-xs text-gray-500">
            {summary.subject.teacher} • {summary.subject.room}
          </Text>
        </View>

        <View className="items-end gap-1">
          <View className="flex-row items-center gap-1">
            <Text className={`text-2xl font-bold ${getGradeColor()}`}>
              {summary.letterGrade}
            </Text>
            {getTrendIcon()}
          </View>
          <Text className={`text-xs font-medium ${getGradeColor()}`}>
            {summary.average.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mt-2">
        <Text className="text-xs text-gray-500">
          {summary.grades.length} grade{summary.grades.length !== 1 ? 's' : ''}
        </Text>
        <View
          className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden"
        >
          <View
            className={`h-full ${
              summary.average >= 90 ? 'bg-green-500' :
              summary.average >= 80 ? 'bg-blue-500' :
              summary.average >= 70 ? 'bg-amber-500' :
              summary.average >= 60 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${summary.average}%` }}
          />
        </View>
      </View>
    </Pressable>
  );
}
