import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleProp } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Animated skeleton loading placeholder
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps): JSX.Element {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Card-style loading skeleton
 */
export function CardSkeleton(): JSX.Element {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row">
        <Skeleton width={80} height={80} borderRadius={12} />
        <View className="flex-1 ml-3 justify-center">
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="30%" height={14} />
        </View>
      </View>
    </View>
  );
}

/**
 * List item loading skeleton
 */
export function ListItemSkeleton(): JSX.Element {
  return (
    <View className="flex-row items-center py-3 px-4 border-b border-gray-100">
      <Skeleton width={48} height={48} borderRadius={24} />
      <View className="flex-1 ml-3">
        <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Article/content loading skeleton
 */
export function ArticleSkeleton(): JSX.Element {
  return (
    <View className="p-4">
      <Skeleton width="100%" height={200} borderRadius={12} style={{ marginBottom: 16 }} />
      <Skeleton width="80%" height={24} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 16 }} />

      <View className="flex-row items-center">
        <Skeleton width={32} height={32} borderRadius={16} />
        <View className="ml-2">
          <Skeleton width={100} height={12} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={10} />
        </View>
      </View>
    </View>
  );
}

/**
 * Grid item loading skeleton
 */
export function GridItemSkeleton(): JSX.Element {
  return (
    <View className="flex-1 m-1">
      <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
      <Skeleton width="50%" height={12} />
    </View>
  );
}

/**
 * Profile loading skeleton
 */
export function ProfileSkeleton(): JSX.Element {
  return (
    <View className="items-center py-6">
      <Skeleton width={100} height={100} borderRadius={50} style={{ marginBottom: 16 }} />
      <Skeleton width={150} height={20} style={{ marginBottom: 8 }} />
      <Skeleton width={100} height={14} style={{ marginBottom: 16 }} />

      <View className="flex-row justify-center gap-6">
        <View className="items-center">
          <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
        <View className="items-center">
          <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
        <View className="items-center">
          <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
}

/**
 * Generate multiple skeletons for a list
 */
interface SkeletonListProps {
  count?: number;
  type?: 'card' | 'list' | 'article' | 'grid';
}

export function SkeletonList({ count = 5, type = 'list' }: SkeletonListProps): JSX.Element {
  const SkeletonComponent = {
    card: CardSkeleton,
    list: ListItemSkeleton,
    article: ArticleSkeleton,
    grid: GridItemSkeleton,
  }[type];

  return (
    <View className={type === 'grid' ? 'flex-row flex-wrap' : ''}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
}

/**
 * Full screen loading state
 */
interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <View className="items-center">
        <View className="w-16 h-16 mb-4">
          <Skeleton width={64} height={64} borderRadius={32} />
        </View>
        <Skeleton width={120} height={16} />
      </View>
    </View>
  );
}

export default Skeleton;
