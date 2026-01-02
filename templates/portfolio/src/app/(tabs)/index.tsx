import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Star, Briefcase, Users } from 'lucide-react-native';
import { useTheme, useFeaturedProjects, useTestimonials } from '@/hooks';
import { ProjectCard, TestimonialCard } from '@/components';
import { PERSONAL_INFO } from '@/services';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { data: featuredProjects, isLoading: projectsLoading } = useFeaturedProjects();
  const { data: testimonials, isLoading: testimonialsLoading } = useTestimonials();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-6 pt-8 pb-6">
          <View className="flex-row items-center mb-6">
            <Image
              source={{ uri: PERSONAL_INFO.avatar }}
              className="w-24 h-24 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.text }}>
                {PERSONAL_INFO.name}
              </Text>
              <Text className="text-base" style={{ color: colors.primary }}>
                {PERSONAL_INFO.title}
              </Text>
            </View>
          </View>

          <Text
            className="text-lg mb-4 leading-7"
            style={{ color: colors.textSecondary }}
          >
            {PERSONAL_INFO.tagline}
          </Text>

          <View className="flex-row gap-3">
            <Link href="/portfolio" asChild>
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-4 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                testID="view-portfolio-button"
              >
                <Briefcase size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">View Portfolio</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/contact" asChild>
              <TouchableOpacity
                className="flex-1 py-4 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                testID="hire-me-button"
              >
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Hire Me
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Stats */}
        <View className="px-6 py-6" style={{ backgroundColor: colors.surface }}>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                8+
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Years Experience
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                50+
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Projects Completed
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold mb-1" style={{ color: colors.primary }}>
                40+
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Happy Clients
              </Text>
            </View>
          </View>
        </View>

        {/* Featured Work */}
        <View className="px-6 py-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Featured Work
            </Text>
            <Link href="/portfolio" asChild>
              <TouchableOpacity className="flex-row items-center" testID="view-all-projects">
                <Text className="mr-1" style={{ color: colors.primary }}>
                  View All
                </Text>
                <ArrowRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </Link>
          </View>

          {projectsLoading ? (
            <Text style={{ color: colors.textSecondary }}>Loading projects...</Text>
          ) : (
            featuredProjects?.map((project) => (
              <ProjectCard key={project.id} project={project} testID={`project-${project.id}`} />
            ))
          )}
        </View>

        {/* Testimonials Preview */}
        <View className="px-6 pb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Client Testimonials
            </Text>
            <Link href="/testimonials" asChild>
              <TouchableOpacity className="flex-row items-center" testID="view-all-testimonials">
                <Text className="mr-1" style={{ color: colors.primary }}>
                  View All
                </Text>
                <ArrowRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </Link>
          </View>

          {testimonialsLoading ? (
            <Text style={{ color: colors.textSecondary }}>Loading testimonials...</Text>
          ) : (
            testimonials?.slice(0, 2).map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                testID={`testimonial-${testimonial.id}`}
              />
            ))
          )}
        </View>

        {/* CTA Section */}
        <View
          className="mx-6 mb-8 p-8 rounded-xl items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Users size={48} color="#ffffff" className="mb-4" />
          <Text className="text-2xl font-bold text-white mb-2 text-center">
            Let's Work Together
          </Text>
          <Text className="text-white text-center mb-6 opacity-90">
            Have a project in mind? I'd love to hear about it.
          </Text>
          <Link href="/contact" asChild>
            <TouchableOpacity
              className="px-8 py-4 rounded-lg"
              style={{ backgroundColor: 'white' }}
              testID="get-in-touch-button"
            >
              <Text className="font-semibold" style={{ color: colors.primary }}>
                Get In Touch
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
