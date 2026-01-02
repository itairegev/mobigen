import React from 'react';
import { View, Text, Image, type ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '@/hooks';
import type { Testimonial } from '@/types';

interface TestimonialCardProps {
  testimonial: Testimonial;
  style?: ViewStyle;
  testID?: string;
}

export function TestimonialCard({ testimonial, style, testID }: TestimonialCardProps) {
  const { colors } = useTheme();

  return (
    <View
      className="p-5 rounded-xl mb-4"
      style={[{ backgroundColor: colors.card }, style]}
      testID={testID}
    >
      <View className="flex-row mb-3">
        {[...Array(testimonial.rating)].map((_, index) => (
          <Star key={index} size={16} fill="#f59e0b" color="#f59e0b" />
        ))}
      </View>

      <Text className="text-base mb-4 leading-6" style={{ color: colors.text }}>
        "{testimonial.quote}"
      </Text>

      <View className="flex-row items-center">
        {testimonial.avatar && (
          <Image
            source={{ uri: testimonial.avatar }}
            className="w-12 h-12 rounded-full mr-3"
          />
        )}
        <View className="flex-1">
          <Text className="font-semibold" style={{ color: colors.text }}>
            {testimonial.name}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {testimonial.position} at {testimonial.company}
          </Text>
        </View>
      </View>
    </View>
  );
}
