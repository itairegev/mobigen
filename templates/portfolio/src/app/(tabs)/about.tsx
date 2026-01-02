import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Mail, Phone, Download } from 'lucide-react-native';
import { useTheme } from '@/hooks';
import { SkillBadge, ExperienceItem, SocialLinks } from '@/components';
import {
  PERSONAL_INFO,
  MOCK_SKILLS,
  MOCK_EXPERIENCE,
  MOCK_EDUCATION,
} from '@/services';

export default function AboutScreen() {
  const { colors } = useTheme();

  const skillsByCategory = {
    development: MOCK_SKILLS.filter((s) => s.category === 'development'),
    design: MOCK_SKILLS.filter((s) => s.category === 'design'),
    tools: MOCK_SKILLS.filter((s) => s.category === 'tools'),
    'soft-skills': MOCK_SKILLS.filter((s) => s.category === 'soft-skills'),
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6">
          <View className="flex-row items-center mb-6">
            <Image
              source={{ uri: PERSONAL_INFO.avatar }}
              className="w-20 h-20 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
                {PERSONAL_INFO.name}
              </Text>
              <Text className="text-base mb-2" style={{ color: colors.primary }}>
                {PERSONAL_INFO.title}
              </Text>
              <View
                className="px-2 py-1 rounded self-start"
                style={{ backgroundColor: '#22c55e20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                  Available for work
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-base leading-7 mb-6" style={{ color: colors.text }}>
            {PERSONAL_INFO.bio}
          </Text>

          {/* Contact Info */}
          <View
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center mb-3">
              <MapPin size={18} color={colors.textSecondary} />
              <Text className="ml-3" style={{ color: colors.text }}>
                {PERSONAL_INFO.location}
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Mail size={18} color={colors.textSecondary} />
              <Text className="ml-3" style={{ color: colors.text }}>
                {PERSONAL_INFO.email}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Phone size={18} color={colors.textSecondary} />
              <Text className="ml-3" style={{ color: colors.text }}>
                {PERSONAL_INFO.phone}
              </Text>
            </View>
          </View>

          {/* Social Links */}
          <SocialLinks links={PERSONAL_INFO.socialLinks} testID="social-links" />
        </View>

        {/* Skills */}
        <View className="px-6 py-6" style={{ backgroundColor: colors.surface }}>
          <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
            Skills & Expertise
          </Text>

          {/* Development */}
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Development
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {skillsByCategory.development.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} showLevel testID={`skill-${skill.id}`} />
            ))}
          </View>

          {/* Design */}
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Design
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {skillsByCategory.design.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} showLevel testID={`skill-${skill.id}`} />
            ))}
          </View>

          {/* Tools */}
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Tools & Technologies
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {skillsByCategory.tools.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} showLevel testID={`skill-${skill.id}`} />
            ))}
          </View>

          {/* Soft Skills */}
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Soft Skills
          </Text>
          <View className="flex-row flex-wrap">
            {skillsByCategory['soft-skills'].map((skill) => (
              <SkillBadge key={skill.id} skill={skill} testID={`skill-${skill.id}`} />
            ))}
          </View>
        </View>

        {/* Experience */}
        <View className="px-6 py-8">
          <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
            Work Experience
          </Text>
          {MOCK_EXPERIENCE.map((exp) => (
            <ExperienceItem key={exp.id} experience={exp} testID={`experience-${exp.id}`} />
          ))}
        </View>

        {/* Education */}
        <View className="px-6 pb-8">
          <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
            Education
          </Text>
          {MOCK_EDUCATION.map((edu) => (
            <View
              key={edu.id}
              className="p-5 rounded-xl mb-4"
              style={{ backgroundColor: colors.card }}
              testID={`education-${edu.id}`}
            >
              <Text className="text-lg font-bold mb-1" style={{ color: colors.text }}>
                {edu.degree} in {edu.field}
              </Text>
              <Text className="text-base mb-1" style={{ color: colors.primary }}>
                {edu.institution}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {edu.location}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {edu.startYear} - {edu.endYear || 'Present'}
              </Text>
              {edu.gpa && (
                <Text className="text-sm mt-2" style={{ color: colors.text }}>
                  GPA: {edu.gpa}
                </Text>
              )}
              {edu.honors && edu.honors.length > 0 && (
                <View className="mt-2">
                  {edu.honors.map((honor, index) => (
                    <Text
                      key={index}
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      • {honor}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
