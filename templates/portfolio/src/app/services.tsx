import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useTheme } from '@/hooks';
import { MOCK_SERVICES } from '@/services';

export default function ServicesScreen() {
  const { colors } = useTheme();

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={32} color={colors.primary} /> : null;
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Services
          </Text>
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            Comprehensive solutions for your digital needs
          </Text>
        </View>

        {/* Services */}
        <View className="px-6 pb-8">
          {MOCK_SERVICES.map((service) => (
            <View
              key={service.id}
              className="p-6 rounded-xl mb-4"
              style={{ backgroundColor: colors.card }}
              testID={`service-${service.id}`}
            >
              <View className="flex-row items-start mb-4">
                <View
                  className="p-3 rounded-lg mr-4"
                  style={{ backgroundColor: colors.surface }}
                >
                  {getIcon(service.icon)}
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                    {service.title}
                  </Text>
                  {service.pricing && (
                    <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
                      {service.pricing.amount}
                    </Text>
                  )}
                </View>
              </View>

              <Text className="text-base mb-4 leading-6" style={{ color: colors.text }}>
                {service.description}
              </Text>

              <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                What's Included:
              </Text>
              <View className="gap-2 mb-4">
                {service.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center">
                    <View
                      className="w-1.5 h-1.5 rounded-full mr-3"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <Text className="flex-1" style={{ color: colors.textSecondary }}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View className="px-6 pb-8">
          <View
            className="p-8 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-2xl font-bold text-white mb-2 text-center">
              Ready to Start?
            </Text>
            <Text className="text-white text-center mb-6 opacity-90">
              Let's discuss your project and find the perfect solution
            </Text>
            <Link href="/contact" asChild>
              <TouchableOpacity
                className="px-8 py-4 rounded-lg"
                style={{ backgroundColor: 'white' }}
                testID="get-quote-button"
              >
                <Text className="font-semibold" style={{ color: colors.primary }}>
                  Get a Quote
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
