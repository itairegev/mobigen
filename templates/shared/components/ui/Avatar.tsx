import { View, Text, Image, ImageSourcePropType } from 'react-native';

export interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square';
  testID?: string;
}

export function Avatar({
  source,
  name,
  size = 'md',
  variant = 'circle',
  testID,
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };

  const shapeClass = variant === 'circle' ? 'rounded-full' : 'rounded-lg';

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on name
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (source) {
    const imageSource = typeof source === 'string' ? { uri: source } : source;

    return (
      <Image
        source={imageSource}
        className={`${sizeClasses[size]} ${shapeClass}`}
        testID={testID}
      />
    );
  }

  if (name) {
    return (
      <View
        className={`${sizeClasses[size]} ${shapeClass} ${getBackgroundColor(
          name
        )} items-center justify-center`}
        testID={testID}
      >
        <Text className={`${textSizeClasses[size]} text-white font-semibold`}>
          {getInitials(name)}
        </Text>
      </View>
    );
  }

  // Fallback placeholder
  return (
    <View
      className={`${sizeClasses[size]} ${shapeClass} bg-gray-300 items-center justify-center`}
      testID={testID}
    >
      <Text className={`${textSizeClasses[size]} text-gray-600`}>?</Text>
    </View>
  );
}
