import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CreatePostForm } from '../../components';
import { useCreatePost } from '../../hooks';

export default function CreatePostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();

  const handleSubmit = async (content: string, images?: string[]) => {
    try {
      await createPost.mutateAsync({ content, images });
      router.back();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <CreatePostForm
        onSubmit={handleSubmit}
        loading={createPost.isPending}
        testID="create-post-form"
      />
    </View>
  );
}
