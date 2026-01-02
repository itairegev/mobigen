import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertCircle, Megaphone, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import type { Announcement } from '../types';
import { format } from 'date-fns';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress?: () => void;
  testID?: string;
}

export function AnnouncementCard({ announcement, onPress, testID }: AnnouncementCardProps) {
  const getPriorityColor = () => {
    switch (announcement.priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getPriorityBadgeColor = () => {
    switch (announcement.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getIcon = () => {
    if (announcement.priority === 'urgent') {
      return <AlertCircle size={20} className="text-red-600" />;
    }
    return <Megaphone size={20} className="text-blue-600" />;
  };

  return (
    <Pressable
      onPress={onPress}
      className={`p-4 rounded-lg border ${getPriorityColor()} mb-3 ${
        !announcement.read ? 'border-l-4 border-l-primary-500' : ''
      }`}
      testID={testID}
    >
      <View className="flex-row items-start gap-3">
        {getIcon()}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
              {announcement.title}
            </Text>
            {!announcement.read && (
              <View className="w-2 h-2 rounded-full bg-primary-500 ml-2" />
            )}
          </View>

          <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
            {announcement.content}
          </Text>

          <View className="flex-row items-center gap-4 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Clock size={14} className="text-gray-500" />
              <Text className="text-xs text-gray-500">
                {format(new Date(announcement.postedAt), 'MMM d, h:mm a')}
              </Text>
            </View>

            <View className={`px-2 py-0.5 rounded-full ${getPriorityBadgeColor()}`}>
              <Text className="text-xs font-medium capitalize">
                {announcement.category}
              </Text>
            </View>

            <Text className="text-xs text-gray-500">
              {announcement.postedBy}
            </Text>
          </View>

          {announcement.attachments && announcement.attachments.length > 0 && (
            <View className="mt-2 flex-row items-center gap-1">
              <Text className="text-xs text-blue-600">
                {announcement.attachments.length} attachment{announcement.attachments.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
