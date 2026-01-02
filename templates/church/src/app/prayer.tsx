import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X } from 'lucide-react-native';
import { usePrayerRequests, useSubmitPrayer, usePrayFor } from '../hooks/usePrayers';
import { PrayerCard } from '../components';
import { PrayerCategory } from '../types';

export default function PrayerScreen() {
  const { data: prayers, isLoading } = usePrayerRequests();
  const submitPrayer = useSubmitPrayer();
  const prayFor = usePrayFor();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('other');
  const [isPrivate, setIsPrivate] = useState(false);

  const categories: PrayerCategory[] = [
    'health',
    'family',
    'financial',
    'spiritual',
    'relationships',
    'guidance',
    'gratitude',
    'other',
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await submitPrayer.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        isPrivate,
      });

      setModalVisible(false);
      setTitle('');
      setDescription('');
      setCategory('other');
      setIsPrivate(false);

      Alert.alert(
        'Prayer Submitted',
        'Your prayer request has been submitted. Our community will be praying for you.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit prayer request. Please try again.');
    }
  };

  const handlePray = async (prayerId: string) => {
    try {
      await prayFor.mutateAsync(prayerId);
    } catch (error) {
      Alert.alert('Error', 'Failed to record prayer. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Prayer Requests</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Pray for others and submit your own requests
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center"
              testID="add-prayer-button"
            >
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayers List */}
        <ScrollView className="flex-1 px-6 py-4">
          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator size="large" color="#1e40af" />
            </View>
          ) : prayers && prayers.length > 0 ? (
            prayers.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onPray={() => handlePray(prayer.id)}
                testID={`prayer-${prayer.id}`}
              />
            ))
          ) : (
            <View className="py-8 items-center">
              <Text className="text-gray-500 text-center">
                No prayer requests yet. Be the first to submit one!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Submit Prayer Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">New Prayer Request</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                testID="close-modal-button"
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView className="flex-1 px-6 py-6">
              {/* Title */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Brief summary of your prayer request"
                  className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-900"
                  testID="prayer-title-input"
                />
              </View>

              {/* Description */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Description *</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Share more details about your prayer request"
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-900"
                  style={{ minHeight: 100 }}
                  testID="prayer-description-input"
                />
              </View>

              {/* Category */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
                <View className="flex-row flex-wrap -mx-1">
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`m-1 px-3 py-2 rounded-full ${
                        category === cat ? 'bg-primary-600' : 'bg-gray-100'
                      }`}
                      testID={`category-${cat}`}
                    >
                      <Text
                        className={`text-sm capitalize ${
                          category === cat ? 'text-white font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Privacy */}
              <TouchableOpacity
                onPress={() => setIsPrivate(!isPrivate)}
                className="flex-row items-center mb-6"
                testID="privacy-toggle"
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                    isPrivate ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                  }`}
                >
                  {isPrivate && <Text className="text-white font-bold">✓</Text>}
                </View>
                <View className="flex-1">
                  <Text className="text-base text-gray-900 font-medium">Keep this prayer private</Text>
                  <Text className="text-sm text-gray-500">
                    Only church leaders will see this request
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitPrayer.isPending}
                className={`bg-primary-600 rounded-xl p-4 ${
                  submitPrayer.isPending ? 'opacity-50' : ''
                }`}
                testID="submit-prayer-button"
              >
                <Text className="text-white text-center font-bold text-lg">
                  {submitPrayer.isPending ? 'Submitting...' : 'Submit Prayer Request'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
