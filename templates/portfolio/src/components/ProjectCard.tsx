import React from 'react';
import { View, Text, Image, TouchableOpacity, type ViewStyle } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/hooks';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  style?: ViewStyle;
  testID?: string;
}

export function ProjectCard({ project, style, testID }: ProjectCardProps) {
  const { colors } = useTheme();

  return (
    <Link href={`/projects/${project.id}`} asChild>
      <TouchableOpacity
        className="mb-4 rounded-xl overflow-hidden"
        style={[{ backgroundColor: colors.card }, style]}
        testID={testID}
      >
        <Image
          source={{ uri: project.thumbnail }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text
              className="text-lg font-bold flex-1"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {project.title}
            </Text>
            {project.featured && (
              <View className="bg-primary-500 px-2 py-1 rounded ml-2">
                <Text className="text-xs text-white font-semibold">Featured</Text>
              </View>
            )}
          </View>

          <Text
            className="text-sm mb-3"
            style={{ color: colors.textSecondary }}
            numberOfLines={2}
          >
            {project.shortDescription}
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {project.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                className="px-2 py-1 rounded"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {project.role} • {project.year}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
