import { FlatList, RefreshControl, View, Text } from 'react-native';
import { ReactNode } from 'react';

export interface FeedItem {
  id: string;
  [key: string]: any;
}

export interface FeedListProps<T extends FeedItem> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  emptyState?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  testID?: string;
}

export function FeedList<T extends FeedItem>({
  data,
  renderItem,
  onRefresh,
  onLoadMore,
  refreshing = false,
  loading = false,
  hasMore = false,
  emptyState,
  header,
  footer,
  testID,
}: FeedListProps<T>) {
  const handleEndReached = () => {
    if (hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  };

  const renderFooter = () => {
    if (loading && data.length > 0) {
      return (
        <View className="py-4">
          <Text className="text-center text-gray-500">Loading more...</Text>
        </View>
      );
    }
    if (footer) {
      return <View>{footer}</View>;
    }
    return null;
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={item => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={header ? <View>{header}</View> : null}
      ListFooterComponent={renderFooter()}
      ListEmptyComponent={
        emptyState ? (
          <View>{emptyState}</View>
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500 text-center">No items to display</Text>
          </View>
        )
      }
      className="flex-1 bg-gray-50"
      testID={testID}
    />
  );
}
