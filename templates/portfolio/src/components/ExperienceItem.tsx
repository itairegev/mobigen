import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import { useTheme } from '@/hooks';
import { formatDateRange } from '@/utils';
import type { Experience } from '@/types';

interface ExperienceItemProps {
  experience: Experience;
  style?: ViewStyle;
  testID?: string;
}

export function ExperienceItem({ experience, style, testID }: ExperienceItemProps) {
  const { colors } = useTheme();

  return (
    <View
      className="p-5 rounded-xl mb-4"
      style={[{ backgroundColor: colors.card }, style]}
      testID={testID}
    >
      <View className="flex-row items-start mb-3">
        <View
          className="p-3 rounded-lg mr-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Briefcase size={24} color={colors.primary} />
        </View>

        <View className="flex-1">
          <Text className="text-lg font-bold mb-1" style={{ color: colors.text }}>
            {experience.title}
          </Text>
          <Text className="text-base mb-1" style={{ color: colors.primary }}>
            {experience.company}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {experience.location} • {experience.type}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {formatDateRange(experience.startDate, experience.endDate, experience.current)}
          </Text>
        </View>
      </View>

      <Text className="text-base mb-3 leading-6" style={{ color: colors.text }}>
        {experience.description}
      </Text>

      {experience.achievements.length > 0 && (
        <View className="mb-3">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Key Achievements:
          </Text>
          {experience.achievements.map((achievement, index) => (
            <View key={index} className="flex-row mb-1">
              <Text style={{ color: colors.primary }}>• </Text>
              <Text className="flex-1 text-sm" style={{ color: colors.textSecondary }}>
                {achievement}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row flex-wrap gap-2">
        {experience.skills.slice(0, 6).map((skill, index) => (
          <View
            key={index}
            className="px-2 py-1 rounded"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              {skill}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
