import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useProjects } from '@/hooks';
import { ProjectCard } from '@/components';
import type { ProjectCategory } from '@/types';

const CATEGORIES: { label: string; value: ProjectCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Web', value: 'web' },
  { label: 'Design', value: 'design' },
  { label: 'Branding', value: 'branding' },
  { label: 'Photography', value: 'photography' },
];

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const { data: projects, isLoading } = useProjects();

  const filteredProjects =
    selectedCategory === 'all'
      ? projects
      : projects?.filter((p) => p.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Portfolio
          </Text>
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            A showcase of my recent work and projects
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-6"
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.value}
              className="mr-3 px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  selectedCategory === category.value ? colors.primary : colors.surface,
              }}
              onPress={() => setSelectedCategory(category.value)}
              testID={`category-${category.value}`}
            >
              <Text
                className="font-semibold"
                style={{
                  color:
                    selectedCategory === category.value ? '#ffffff' : colors.text,
                }}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Projects */}
        <View className="px-6 pb-6">
          {isLoading ? (
            <Text style={{ color: colors.textSecondary }}>Loading projects...</Text>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <>
              <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </Text>
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  testID={`project-${project.id}`}
                />
              ))}
            </>
          ) : (
            <View className="py-12 items-center">
              <Text className="text-lg" style={{ color: colors.textSecondary }}>
                No projects found in this category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
