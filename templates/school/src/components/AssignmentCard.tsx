import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BookOpen, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react-native';
import type { Assignment } from '../types';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface AssignmentCardProps {
  assignment: Assignment;
  onPress?: () => void;
  testID?: string;
}

export function AssignmentCard({ assignment, onPress, testID }: AssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = isPast(dueDate) && assignment.status !== 'submitted' && assignment.status !== 'graded';

  const getStatusColor = () => {
    if (isOverdue || assignment.status === 'overdue') return 'bg-red-50 border-red-200';
    if (assignment.status === 'submitted') return 'bg-green-50 border-green-200';
    if (assignment.status === 'in-progress') return 'bg-blue-50 border-blue-200';
    if (assignment.status === 'graded') return 'bg-purple-50 border-purple-200';
    return 'bg-white border-gray-200';
  };

  const getStatusBadge = () => {
    if (isOverdue || assignment.status === 'overdue') {
      return (
        <View className="bg-red-100 px-2 py-1 rounded-full flex-row items-center gap-1">
          <AlertCircle size={12} className="text-red-700" />
          <Text className="text-xs font-medium text-red-700">Overdue</Text>
        </View>
      );
    }
    if (assignment.status === 'submitted') {
      return (
        <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center gap-1">
          <CheckCircle2 size={12} className="text-green-700" />
          <Text className="text-xs font-medium text-green-700">Submitted</Text>
        </View>
      );
    }
    if (assignment.status === 'graded') {
      return (
        <View className="bg-purple-100 px-2 py-1 rounded-full">
          <Text className="text-xs font-medium text-purple-700">
            {assignment.earnedPoints}/{assignment.points} pts
          </Text>
        </View>
      );
    }
    return null;
  };

  const getTypeIcon = () => {
    switch (assignment.type) {
      case 'quiz':
      case 'test':
        return <FileText size={18} className="text-amber-600" />;
      case 'project':
        return <BookOpen size={18} className="text-purple-600" />;
      default:
        return <BookOpen size={18} className="text-blue-600" />;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className={`p-4 rounded-lg border ${getStatusColor()} mb-3`}
      testID={testID}
    >
      <View className="flex-row items-start gap-3">
        {getTypeIcon()}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
              {assignment.title}
            </Text>
            {getStatusBadge()}
          </View>

          <View
            className="px-2 py-0.5 rounded mb-2"
            style={{ backgroundColor: assignment.subjectColor + '20', alignSelf: 'flex-start' }}
          >
            <Text className="text-xs font-medium" style={{ color: assignment.subjectColor }}>
              {assignment.subjectName}
            </Text>
          </View>

          {assignment.description && (
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {assignment.description}
            </Text>
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Clock size={14} className="text-gray-500" />
              <Text className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Due {formatDistanceToNow(dueDate, { addSuffix: true })}
              </Text>
            </View>

            <Text className="text-xs text-gray-500">
              {assignment.points} pts
            </Text>
          </View>

          {assignment.feedback && (
            <View className="mt-2 p-2 bg-blue-50 rounded">
              <Text className="text-xs text-blue-900">
                Feedback: {assignment.feedback}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
