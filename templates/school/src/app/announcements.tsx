import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { AnnouncementCard } from '../components/AnnouncementCard';
import type { AnnouncementCategory } from '../types';

const CATEGORIES: { label: string; value: AnnouncementCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'General', value: 'general' },
  { label: 'Academic', value: 'academic' },
  { label: 'Events', value: 'event' },
  { label: 'Deadlines', value: 'deadline' },
  { label: 'Emergency', value: 'emergency' },
];

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<AnnouncementCategory | 'all'>('all');

  const category = activeCategory === 'all' ? undefined : activeCategory;
  const { data: announcements, refetch, isLoading } = useAnnouncements(category);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0 bg-white border-b border-gray-200 px-4 py-3"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;

          return (
            <Pressable
              key={cat.value}
              onPress={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full mr-2 ${
                isActive ? 'bg-primary-100' : 'bg-gray-100'
              }`}
              testID={`category-${cat.value}`}
            >
              <Text
                className={`font-medium ${
                  isActive ? 'text-primary-700' : 'text-gray-600'
                }`}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Announcements List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {isLoading ? (
          <View className="bg-white p-8 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500">Loading announcements...</Text>
          </View>
        ) : announcements && announcements.length > 0 ? (
          <>
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                testID={`announcement-${announcement.id}`}
              />
            ))}
          </>
        ) : (
          <View className="bg-white p-8 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500 text-base">
              No {activeCategory === 'all' ? '' : activeCategory} announcements
            </Text>
            <Text className="text-center text-gray-400 text-sm mt-2">
              Check back later for updates
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
