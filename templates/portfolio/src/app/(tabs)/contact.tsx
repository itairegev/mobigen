import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Phone, MapPin, Clock, DollarSign } from 'lucide-react-native';
import { useTheme } from '@/hooks';
import { ContactForm, SocialLinks } from '@/components';
import { PERSONAL_INFO } from '@/services';

export default function ContactScreen() {
  const { colors } = useTheme();

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${PERSONAL_INFO.email}`);
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${PERSONAL_INFO.phone}`);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Get In Touch
          </Text>
          <Text className="text-base mb-6" style={{ color: colors.textSecondary }}>
            Have a project in mind? Let's discuss how I can help bring your ideas to life.
          </Text>
        </View>

        {/* Quick Contact Cards */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className="flex-row items-center p-4 rounded-xl mb-3"
            style={{ backgroundColor: colors.card }}
            onPress={handleEmailPress}
            testID="email-button"
          >
            <View
              className="p-3 rounded-lg mr-4"
              style={{ backgroundColor: colors.surface }}
            >
              <Mail size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                Email
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {PERSONAL_INFO.email}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 rounded-xl mb-3"
            style={{ backgroundColor: colors.card }}
            onPress={handlePhonePress}
            testID="phone-button"
          >
            <View
              className="p-3 rounded-lg mr-4"
              style={{ backgroundColor: colors.surface }}
            >
              <Phone size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                Phone
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {PERSONAL_INFO.phone}
              </Text>
            </View>
          </TouchableOpacity>

          <View
            className="flex-row items-center p-4 rounded-xl"
            style={{ backgroundColor: colors.card }}
          >
            <View
              className="p-3 rounded-lg mr-4"
              style={{ backgroundColor: colors.surface }}
            >
              <MapPin size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                Location
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {PERSONAL_INFO.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Availability & Rate */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <View
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <Clock size={20} color={colors.primary} className="mb-2" />
              <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                Availability
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                Available Now
              </Text>
            </View>
            <View
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: colors.surface }}
            >
              <DollarSign size={20} color={colors.primary} className="mb-2" />
              <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                Rate
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {PERSONAL_INFO.hourlyRate}
              </Text>
            </View>
          </View>
        </View>

        {/* Social Links */}
        <View className="px-6 mb-8">
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Connect With Me
          </Text>
          <SocialLinks links={PERSONAL_INFO.socialLinks} size={28} testID="contact-social-links" />
        </View>

        {/* Contact Form */}
        <View className="px-6 pb-8">
          <Text className="text-xl font-bold mb-6" style={{ color: colors.text }}>
            Send a Message
          </Text>
          <ContactForm testID="contact-form" />
        </View>

        {/* Additional Info */}
        <View
          className="mx-6 mb-8 p-6 rounded-xl"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            💡 What to Include in Your Message
          </Text>
          <View className="gap-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Brief description of your project
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Timeline and budget expectations
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Any specific requirements or questions
            </Text>
          </View>
          <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
            I typically respond within 24 hours on business days.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
