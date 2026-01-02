import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image, X } from 'lucide-react-native';

interface CreatePostFormProps {
  onSubmit: (content: string, images?: string[]) => void;
  loading?: boolean;
  testID?: string;
}

export function CreatePostForm({ onSubmit, loading, testID }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content, images.length > 0 ? images : undefined);
      setContent('');
      setImages([]);
    }
  };

  return (
    <View testID={testID} className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700">
      <TextInput
        testID="post-input"
        className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 text-gray-900 dark:text-white mb-3 min-h-[100px]"
        placeholder="Share something with the community..."
        placeholderTextColor="#94a3b8"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      {images.length > 0 && (
        <View className="flex-row gap-2 mb-3">
          {images.map((image, index) => (
            <View key={index} className="relative">
              <View className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded" />
              <TouchableOpacity
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                onPress={() => setImages(images.filter((_, i) => i !== index))}
              >
                <X size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <TouchableOpacity
          testID="add-image-button"
          className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700"
          onPress={() => {
            // Mock image picker
            setImages([...images, 'https://via.placeholder.com/400']);
          }}
        >
          <Image size={18} color="#64748b" />
          <Text className="text-sm text-gray-600 dark:text-gray-400">Add Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="submit-post-button"
          className={`px-6 py-2 rounded-lg ${
            content.trim() && !loading
              ? 'bg-primary-500'
              : 'bg-gray-300 dark:bg-slate-700'
          }`}
          onPress={handleSubmit}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="font-semibold text-white">Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
