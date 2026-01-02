import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Clock, Flame, Save } from 'lucide-react-native';
import { Button, Card } from '@/components';
import { useProgress } from '@/hooks';
import { WorkoutLog } from '@/types';

export default function LogWorkoutScreen() {
  const { addWorkoutLog } = useProgress();
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Missing Info', 'Please enter a workout name');
      return;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid duration');
      return;
    }

    setSaving(true);

    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      workoutName: workoutName.trim(),
      date: new Date(),
      duration: parseInt(duration),
      caloriesBurned: calories ? parseInt(calories) : undefined,
      notes: notes.trim() || undefined,
      exercises: [],
    };

    addWorkoutLog(newLog);

    Alert.alert(
      'Workout Logged!',
      'Great job completing your workout! 💪',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );

    setSaving(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Log Your Workout</Text>
            <Text className="text-gray-600 mt-1">
              Track your progress and stay motivated
            </Text>
          </View>

          {/* Workout Name */}
          <Card className="p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Workout Name *
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder="e.g., Morning Run, Leg Day, etc."
              value={workoutName}
              onChangeText={setWorkoutName}
              testID="workout-name-input"
            />
          </Card>

          {/* Duration */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700">Duration (minutes) *</Text>
              <Clock size={20} color="#10b981" />
            </View>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder="30"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              testID="duration-input"
            />
          </Card>

          {/* Calories */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700">
                Calories Burned (optional)
              </Text>
              <Flame size={20} color="#f59e0b" />
            </View>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder="300"
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
              testID="calories-input"
            />
            <Text className="text-xs text-gray-500 mt-2">
              Estimate based on your activity level and heart rate
            </Text>
          </Card>

          {/* Notes */}
          <Card className="p-4 mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              placeholder="How did you feel? Any observations?"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="notes-input"
            />
          </Card>

          {/* Info Card */}
          <Card className="p-4 mb-6 bg-primary-50 border-primary-200">
            <Text className="text-sm font-semibold text-primary-900 mb-2">
              💡 Quick Tip
            </Text>
            <Text className="text-sm text-primary-800 leading-5">
              Logging your workouts helps you track progress, maintain motivation, and build
              consistency. Even a short 15-minute workout counts!
            </Text>
          </Card>

          {/* Buttons */}
          <View className="gap-3">
            <Button
              title="Save Workout"
              onPress={handleSave}
              loading={saving}
              testID="save-workout-button"
            />

            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              testID="cancel-button"
            />
          </View>

          {/* Stats Preview */}
          <View className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-sm font-semibold text-gray-900 mb-3">
              What you'll achieve:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-green-50 rounded-lg px-3 py-2">
                <Text className="text-xs text-green-700 font-medium">
                  ✓ Progress tracked
                </Text>
              </View>
              <View className="bg-blue-50 rounded-lg px-3 py-2">
                <Text className="text-xs text-blue-700 font-medium">
                  ✓ Streak maintained
                </Text>
              </View>
              <View className="bg-purple-50 rounded-lg px-3 py-2">
                <Text className="text-xs text-purple-700 font-medium">
                  ✓ Goals updated
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
