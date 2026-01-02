import { useState } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { Card, Input, Button } from '@/components';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Message Sent!',
      'An agent will contact you shortly.',
      [{ text: 'OK' }]
    );

    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-gray-900 font-bold text-2xl mb-2">Contact an Agent</Text>
        <Text className="text-gray-600 mb-6">
          Have questions? We're here to help!
        </Text>

        <Card className="p-4 mb-4">
          <Input
            label="Full Name *"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            testID="contact-name"
          />
          <Input
            label="Email *"
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            testID="contact-email"
          />
          <Input
            label="Phone"
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            testID="contact-phone"
          />
          <Input
            label="Message *"
            placeholder="Tell us about your needs..."
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            testID="contact-message"
          />
        </Card>

        <Button
          title="Send Message"
          onPress={handleSubmit}
          testID="contact-submit"
        />
      </View>
    </ScrollView>
  );
}
