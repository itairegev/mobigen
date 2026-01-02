import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, Calendar, FileText, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react-native';
import { useAssignment } from '../../hooks/useAssignments';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: assignment, isLoading } = useAssignment(id!);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Loading assignment...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-4">
        <Text className="text-gray-900 text-lg font-semibold mb-2">Assignment not found</Text>
        <Text className="text-gray-500 text-center mb-4">
          This assignment may have been removed or you may not have access to it.
        </Text>
        <Pressable onPress={() => router.back()} className="bg-primary-600 px-6 py-3 rounded-lg">
          <Text className="text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const dueDate = new Date(assignment.dueDate);
  const isOverdue = isPast(dueDate) && assignment.status !== 'submitted' && assignment.status !== 'graded';

  const getStatusBadge = () => {
    if (isOverdue || assignment.status === 'overdue') {
      return (
        <View className="bg-red-100 px-3 py-1.5 rounded-full flex-row items-center gap-2">
          <AlertCircle size={16} className="text-red-700" />
          <Text className="text-sm font-medium text-red-700">Overdue</Text>
        </View>
      );
    }
    if (assignment.status === 'submitted') {
      return (
        <View className="bg-green-100 px-3 py-1.5 rounded-full flex-row items-center gap-2">
          <CheckCircle2 size={16} className="text-green-700" />
          <Text className="text-sm font-medium text-green-700">Submitted</Text>
        </View>
      );
    }
    if (assignment.status === 'graded') {
      return (
        <View className="bg-purple-100 px-3 py-1.5 rounded-full">
          <Text className="text-sm font-medium text-purple-700">
            Graded: {assignment.earnedPoints}/{assignment.points} pts
          </Text>
        </View>
      );
    }
    return (
      <View className="bg-blue-100 px-3 py-1.5 rounded-full">
        <Text className="text-sm font-medium text-blue-700 capitalize">
          {assignment.status.replace('-', ' ')}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View
          className="px-3 py-1 rounded mb-3"
          style={{ backgroundColor: assignment.subjectColor + '20', alignSelf: 'flex-start' }}
        >
          <Text className="text-sm font-medium" style={{ color: assignment.subjectColor }}>
            {assignment.subjectName}
          </Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-3">{assignment.title}</Text>

        {getStatusBadge()}
      </View>

      {/* Due Date */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-6">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Calendar size={18} className="text-gray-500" />
              <Text className="text-xs text-gray-500 uppercase font-medium">Due Date</Text>
            </View>
            <Text className={`text-base font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {format(dueDate, 'EEEE, MMM d, yyyy')}
            </Text>
            <Text className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
              {formatDistanceToNow(dueDate, { addSuffix: true })}
            </Text>
          </View>

          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <FileText size={18} className="text-gray-500" />
              <Text className="text-xs text-gray-500 uppercase font-medium">Points</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">{assignment.points}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {assignment.description && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-xs text-gray-500 uppercase font-medium mb-2">Description</Text>
          <Text className="text-base text-gray-900 leading-6">{assignment.description}</Text>
        </View>
      )}

      {/* Instructions */}
      {assignment.instructions && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-xs text-gray-500 uppercase font-medium mb-2">Instructions</Text>
          <Text className="text-base text-gray-900 leading-6">{assignment.instructions}</Text>
        </View>
      )}

      {/* Attachments */}
      {assignment.attachments && assignment.attachments.length > 0 && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-xs text-gray-500 uppercase font-medium mb-3">Attachments</Text>
          {assignment.attachments.map((attachment) => (
            <View
              key={attachment.id}
              className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2"
            >
              <Paperclip size={20} className="text-blue-600" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {(attachment.size / 1024).toFixed(0)} KB
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Submission Info */}
      {assignment.submittedAt && (
        <View className="bg-green-50 p-4 border-b border-green-100">
          <View className="flex-row items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <Text className="text-sm font-semibold text-green-900">Submitted</Text>
          </View>
          <Text className="text-sm text-green-700">
            {format(new Date(assignment.submittedAt), 'EEEE, MMM d, yyyy \'at\' h:mm a')}
          </Text>
        </View>
      )}

      {/* Feedback */}
      {assignment.feedback && (
        <View className="bg-blue-50 p-4 border-b border-blue-100">
          <Text className="text-xs text-blue-700 uppercase font-medium mb-2">Teacher Feedback</Text>
          <Text className="text-base text-blue-900 leading-6">{assignment.feedback}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="p-4 gap-3">
        {assignment.status === 'pending' || assignment.status === 'in-progress' ? (
          <>
            <Pressable
              className="bg-primary-600 p-4 rounded-lg flex-row items-center justify-center gap-2"
              testID="submit-assignment"
            >
              <CheckCircle2 size={20} className="text-white" />
              <Text className="text-white font-semibold text-base">Submit Assignment</Text>
            </Pressable>

            <Pressable
              className="bg-gray-100 p-4 rounded-lg flex-row items-center justify-center gap-2"
            >
              <Paperclip size={20} className="text-gray-700" />
              <Text className="text-gray-700 font-semibold text-base">Attach Files</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            className="bg-gray-100 p-4 rounded-lg flex-row items-center justify-center gap-2"
          >
            <FileText size={20} className="text-gray-700" />
            <Text className="text-gray-700 font-semibold text-base">View Submission</Text>
          </Pressable>
        )}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
