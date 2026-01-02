import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useTestimonials } from '@/hooks';
import { TestimonialCard } from '@/components';

export default function TestimonialsScreen() {
  const { colors } = useTheme();
  const { data: testimonials, isLoading } = useTestimonials();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Client Testimonials
          </Text>
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            What clients say about working with me
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 py-6 mb-6" style={{ backgroundColor: colors.surface }}>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                40+
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Happy Clients
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                5.0
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Average Rating
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                95%
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Client Retention
              </Text>
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View className="px-6 pb-8">
          {isLoading ? (
            <Text style={{ color: colors.textSecondary }}>Loading testimonials...</Text>
          ) : (
            testimonials?.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                testID={`testimonial-${testimonial.id}`}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
