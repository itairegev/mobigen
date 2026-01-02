import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, type ViewStyle } from 'react-native';
import { Send, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks';
import { useContact } from '@/hooks';
import { validateEmail } from '@/utils';

interface ContactFormProps {
  style?: ViewStyle;
  testID?: string;
}

export function ContactForm({ style, testID }: ContactFormProps) {
  const { colors } = useTheme();
  const { submit, isLoading, success } = useContact();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    submit(
      { name, email, subject, message },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setSubject('');
          setMessage('');
        },
      }
    );
  };

  if (success) {
    return (
      <View
        className="p-6 rounded-xl items-center"
        style={[{ backgroundColor: colors.card }, style]}
        testID="success-message"
      >
        <CheckCircle size={48} color="#22c55e" />
        <Text className="text-lg font-bold mt-4 mb-2" style={{ color: colors.text }}>
          Message Sent!
        </Text>
        <Text className="text-center" style={{ color: colors.textSecondary }}>
          Thank you for reaching out. I'll get back to you as soon as possible.
        </Text>
      </View>
    );
  }

  return (
    <View style={style} testID={testID}>
      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
          Name *
        </Text>
        <TextInput
          className="p-4 rounded-lg text-base"
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          editable={!isLoading}
          testID="name-input"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
          Email *
        </Text>
        <TextInput
          className="p-4 rounded-lg text-base"
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          placeholder="your.email@example.com"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          testID="email-input"
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
          Subject
        </Text>
        <TextInput
          className="p-4 rounded-lg text-base"
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          placeholder="What's this about?"
          placeholderTextColor={colors.textSecondary}
          value={subject}
          onChangeText={setSubject}
          editable={!isLoading}
          testID="subject-input"
        />
      </View>

      <View className="mb-6">
        <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
          Message *
        </Text>
        <TextInput
          className="p-4 rounded-lg text-base"
          style={{
            backgroundColor: colors.surface,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            height: 150,
          }}
          placeholder="Tell me about your project..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isLoading}
          testID="message-input"
        />
      </View>

      <TouchableOpacity
        className="flex-row items-center justify-center p-4 rounded-lg"
        style={{ backgroundColor: isLoading ? colors.border : colors.primary }}
        onPress={handleSubmit}
        disabled={isLoading}
        testID="submit-button"
      >
        <Send size={20} color="#ffffff" />
        <Text className="text-white font-semibold ml-2 text-base">
          {isLoading ? 'Sending...' : 'Send Message'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
