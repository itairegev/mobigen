import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  testID?: string;
}

export function Card({ children, testID, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      testID={testID}
      {...props}
    >
      {children}
    </View>
  );
}
