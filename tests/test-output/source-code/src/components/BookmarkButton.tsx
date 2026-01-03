import { Pressable } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useBookmarks } from '@/hooks';

interface BookmarkButtonProps {
  articleId: string;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

export function BookmarkButton({ articleId, size = 'medium', testID }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(articleId);

  const iconSize = size === 'small' ? 16 : size === 'large' ? 28 : 22;

  return (
    <Pressable
      onPress={() => toggleBookmark(articleId)}
      className="p-1"
      testID={testID}
    >
      <Bookmark
        size={iconSize}
        color={bookmarked ? '#2563eb' : '#9ca3af'}
        fill={bookmarked ? '#2563eb' : 'transparent'}
      />
    </Pressable>
  );
}
