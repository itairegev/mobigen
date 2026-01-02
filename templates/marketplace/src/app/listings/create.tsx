import { View, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Input, Button, ImageUploader, PriceInput } from '@/components';
import { useCategories, useCreateListing } from '@/hooks';
import type { ListingCondition } from '@/types';

export default function CreateListingScreen() {
  const router = useRouter();
  const { categories } = useCategories();
  const { createListing, isCreating } = useCreateListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const conditionOptions: { value: ListingCondition; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!title || !description || !price || !categoryId || !location || images.length === 0) {
      Alert.alert('Error', 'Please fill in all fields and add at least one photo');
      return;
    }

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);

      await createListing({
        title,
        description,
        price: parseFloat(price),
        images,
        categoryId,
        category: selectedCategory?.name || '',
        condition,
        location,
        sellerId: 'me',
        seller: {
          id: 'me',
          name: 'Alex Thompson',
          avatar: 'https://i.pravatar.cc/150?img=33',
          rating: 5.0,
          reviewCount: 0,
          joinedDate: new Date(),
          activeListings: 0,
        },
      });

      Alert.alert('Success', 'Your listing has been created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Create Listing</Text>

        <ImageUploader images={images} onChange={setImages} testID="image-uploader" />

        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., iPhone 14 Pro - Space Black"
          testID="title-input"
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your item..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="h-24"
          testID="description-input"
        />

        <PriceInput
          label="Price"
          value={price}
          onChange={setPrice}
          testID="price-input"
        />

        {/* Category Selector */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                className={`px-4 py-2 rounded-lg border ${
                  categoryId === cat.id
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setCategoryId(cat.id)}
                testID={`category-${cat.id}`}
              >
                <Text
                  className={categoryId === cat.id ? 'text-white font-medium' : 'text-gray-700'}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Condition Selector */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Condition</Text>
          <View className="flex-row flex-wrap gap-2">
            {conditionOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`px-4 py-2 rounded-lg border ${
                  condition === opt.value
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setCondition(opt.value)}
                testID={`condition-${opt.value}`}
              >
                <Text
                  className={condition === opt.value ? 'text-white font-medium' : 'text-gray-700'}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., San Francisco, CA"
          testID="location-input"
        />

        <Button
          title="Create Listing"
          onPress={handleSubmit}
          loading={isCreating}
          testID="submit-button"
        />

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
