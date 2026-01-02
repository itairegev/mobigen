import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Mail, User } from 'lucide-react-native';
import { format } from 'date-fns';

// Mock message threads data
const MOCK_MESSAGE_THREADS = [
  {
    id: 'thread-1',
    subject: 'Question about Assignment 5',
    participants: [
      { id: '1', name: 'Mrs. Johnson', role: 'teacher' as const, avatar: '👩‍🏫' },
      { id: '2', name: 'You', role: 'student' as const, avatar: '👤' },
    ],
    lastMessage: 'I\'ll be available during office hours tomorrow to discuss this.',
    lastMessageAt: '2024-01-15T14:30:00Z',
    unreadCount: 1,
  },
  {
    id: 'thread-2',
    subject: 'Parent-Teacher Conference Scheduling',
    participants: [
      { id: '3', name: 'Ms. Davis', role: 'teacher' as const, avatar: '👩‍🏫' },
      { id: '4', name: 'Parent', role: 'parent' as const, avatar: '👨' },
    ],
    lastMessage: 'Tuesday at 4 PM works perfectly. See you then!',
    lastMessageAt: '2024-01-14T16:00:00Z',
    unreadCount: 0,
  },
  {
    id: 'thread-3',
    subject: 'Lab Report Feedback',
    participants: [
      { id: '5', name: 'Dr. Martinez', role: 'teacher' as const, avatar: '👨‍🔬' },
      { id: '2', name: 'You', role: 'student' as const, avatar: '👤' },
    ],
    lastMessage: 'Great observations! Just remember to include units in all measurements.',
    lastMessageAt: '2024-01-13T10:15:00Z',
    unreadCount: 0,
  },
  {
    id: 'thread-4',
    subject: 'Project Extension Request',
    participants: [
      { id: '6', name: 'Mr. Anderson', role: 'teacher' as const, avatar: '👨‍💻' },
      { id: '2', name: 'You', role: 'student' as const, avatar: '👤' },
    ],
    lastMessage: 'I can give you until Friday. Make sure to submit by end of day.',
    lastMessageAt: '2024-01-12T09:45:00Z',
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-4">
          {MOCK_MESSAGE_THREADS.map((thread) => {
            const teacher = thread.participants.find((p) => p.role === 'teacher');

            return (
              <Pressable
                key={thread.id}
                className={`bg-white p-4 rounded-lg border mb-3 ${
                  thread.unreadCount > 0 ? 'border-primary-300 border-l-4' : 'border-gray-200'
                }`}
                testID={`message-thread-${thread.id}`}
              >
                <View className="flex-row items-start gap-3">
                  <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                    <Text className="text-2xl">{teacher?.avatar || '👤'}</Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-semibold text-gray-900 flex-1" numberOfLines={1}>
                        {thread.subject}
                      </Text>
                      {thread.unreadCount > 0 && (
                        <View className="w-5 h-5 rounded-full bg-primary-600 items-center justify-center ml-2">
                          <Text className="text-white text-xs font-bold">
                            {thread.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-sm text-gray-600 mb-2">{teacher?.name || 'Unknown'}</Text>

                    <Text
                      className={`text-sm mb-2 ${
                        thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}
                      numberOfLines={2}
                    >
                      {thread.lastMessage}
                    </Text>

                    <Text className="text-xs text-gray-400">
                      {format(new Date(thread.lastMessageAt), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Compose Button */}
        <View className="p-4">
          <Pressable className="bg-primary-600 p-4 rounded-lg flex-row items-center justify-center gap-2">
            <Mail size={20} className="text-white" />
            <Text className="text-white font-semibold text-base">New Message</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
