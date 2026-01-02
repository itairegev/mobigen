import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { useTours } from '@/hooks';
import { formatDate, formatTime } from '@/utils';

interface TourSchedulerProps {
  propertyId: string;
  testID?: string;
}

const AVAILABLE_TIMES = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function TourScheduler({ propertyId, testID }: TourSchedulerProps) {
  const router = useRouter();
  const { addTour } = useTours();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!selectedTime || !name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    addTour({
      propertyId,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      name,
      email,
      phone,
      message,
    });

    Alert.alert(
      'Tour Scheduled!',
      'Your tour has been scheduled. We will contact you shortly to confirm.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const availableDays = getNextDays(14);

  return (
    <View testID={testID}>
      <Card className="p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <Calendar size={20} color="#16a34a" />
          <Text className="text-gray-900 font-semibold ml-2">Select Date</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {availableDays.map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={date.toISOString()}
                className={`px-4 py-2 rounded-lg border ${
                  isSelected
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setSelectedDate(date)}
                testID={`${testID}-date-${date.toISOString().split('T')[0]}`}
              >
                <Text className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text
                  className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}
                >
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Card className="p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <Clock size={20} color="#16a34a" />
          <Text className="text-gray-900 font-semibold ml-2">Select Time</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {AVAILABLE_TIMES.map((time) => {
            const isSelected = time === selectedTime;
            return (
              <TouchableOpacity
                key={time}
                className={`px-4 py-2 rounded-lg border ${
                  isSelected
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setSelectedTime(time)}
                testID={`${testID}-time-${time}`}
              >
                <Text className={isSelected ? 'text-white' : 'text-gray-900'}>
                  {formatTime(time)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Card className="p-4 mb-4">
        <Text className="text-gray-900 font-semibold mb-3">Your Information</Text>
        <Input
          label="Full Name *"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          testID={`${testID}-name`}
        />
        <Input
          label="Email *"
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          testID={`${testID}-email`}
        />
        <Input
          label="Phone *"
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          testID={`${testID}-phone`}
        />
        <Input
          label="Message (Optional)"
          placeholder="Any special requests or questions?"
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          testID={`${testID}-message`}
        />
      </Card>

      <Button
        title="Schedule Tour"
        onPress={handleSubmit}
        testID={`${testID}-submit`}
      />
    </View>
  );
}
