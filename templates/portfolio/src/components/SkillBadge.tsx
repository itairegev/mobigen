import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks';
import type { Skill } from '@/types';

interface SkillBadgeProps {
  skill: Skill;
  showLevel?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function SkillBadge({ skill, showLevel = false, style, testID }: SkillBadgeProps) {
  const { colors } = useTheme();

  const getLevelColor = (level: Skill['level']) => {
    switch (level) {
      case 'expert':
        return '#22c55e';
      case 'advanced':
        return '#3b82f6';
      case 'intermediate':
        return '#f59e0b';
      case 'beginner':
        return '#94a3b8';
    }
  };

  return (
    <View
      className="px-3 py-2 rounded-lg mr-2 mb-2"
      style={[{ backgroundColor: colors.surface }, style]}
      testID={testID}
    >
      <View className="flex-row items-center">
        <Text className="font-medium" style={{ color: colors.text }}>
          {skill.name}
        </Text>
        {showLevel && (
          <View
            className="ml-2 w-2 h-2 rounded-full"
            style={{ backgroundColor: getLevelColor(skill.level) }}
          />
        )}
      </View>
      {skill.yearsOfExperience && (
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          {skill.yearsOfExperience} years
        </Text>
      )}
    </View>
  );
}
