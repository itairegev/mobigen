import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MessageCircle, Heart, Share2 } from 'lucide-react-native';

// Mock community posts
const MOCK_POSTS = [
  {
    id: '1',
    userName: 'Sarah Chen',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    content: 'Just finished the AI episode! The discussion about multi-modal systems was fascinating. Anyone else excited about the future of AI?',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 5,
    episodeTitle: 'The Future of AI: Beyond ChatGPT',
  },
  {
    id: '2',
    userName: 'Michael Rodriguez',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    content: 'The quantum computing explanation was so clear! Finally understand how qubits work. Thanks for making complex topics accessible.',
    timestamp: '5 hours ago',
    likes: 18,
    comments: 3,
    episodeTitle: 'Quantum Computing Explained',
  },
  {
    id: '3',
    userName: 'Emily Watson',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    content: 'Love the new series on design! The typography episode changed how I think about font choices.',
    timestamp: '1 day ago',
    likes: 32,
    comments: 8,
    episodeTitle: 'The Art of Typography',
  },
];

export default function CommunityScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="p-6 bg-primary-500">
        <Text className="text-2xl font-bold text-white mb-2">Community</Text>
        <Text className="text-primary-100">
          Join the conversation with fellow listeners
        </Text>
      </View>

      {/* Posts */}
      <View className="p-4">
        {MOCK_POSTS.map((post) => (
          <View
            key={post.id}
            className="mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
            testID={`post-${post.id}`}
          >
            {/* User Info */}
            <View className="flex-row items-center mb-3">
              <Image
                source={{ uri: post.userAvatar }}
                className="w-10 h-10 rounded-full"
              />
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900 dark:text-white">
                  {post.userName}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {post.timestamp}
                </Text>
              </View>
            </View>

            {/* Content */}
            <Text className="text-gray-800 dark:text-gray-200 mb-3 leading-5">
              {post.content}
            </Text>

            {/* Episode Reference */}
            {post.episodeTitle && (
              <View className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Related Episode
                </Text>
                <Text className="text-sm font-medium text-gray-900 dark:text-white">
                  {post.episodeTitle}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row items-center space-x-6 pt-3 border-t border-gray-100 dark:border-gray-700">
              <TouchableOpacity className="flex-row items-center">
                <Heart size={18} color="#9ca3af" />
                <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <MessageCircle size={18} color="#9ca3af" />
                <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                  {post.comments}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center">
                <Share2 size={18} color="#9ca3af" />
                <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Coming Soon Notice */}
        <View className="mt-4 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <Text className="text-center text-primary-700 dark:text-primary-300 font-medium">
            More community features coming soon!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
