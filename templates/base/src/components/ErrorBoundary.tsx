import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI and optionally allows retry.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <View className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Something went wrong
            </Text>
            <Text className="text-gray-600 mb-4 text-center">
              We encountered an unexpected error. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView className="bg-gray-100 rounded-lg p-3 mb-4 max-h-32">
                <Text className="text-xs text-red-600 font-mono">
                  {this.state.error.message}
                </Text>
              </ScrollView>
            )}

            <Pressable
              onPress={this.handleRetry}
              className="bg-blue-500 rounded-lg py-3 px-4 active:bg-blue-600"
              testID="error-boundary-retry"
            >
              <Text className="text-white font-semibold text-center">
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional error fallback component for use with react-query or custom error handling
 */
interface ErrorFallbackProps {
  error?: Error | null;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorFallback({
  error,
  message = 'Something went wrong',
  onRetry,
  compact = false,
}: ErrorFallbackProps): JSX.Element {
  if (compact) {
    return (
      <View className="flex-row items-center justify-center py-4 px-3 bg-red-50 rounded-lg">
        <Text className="text-red-600 flex-1">{message}</Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-red-500 rounded px-3 py-1 ml-2 active:bg-red-600"
            testID="error-fallback-retry-compact"
          >
            <Text className="text-white text-sm font-medium">Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="items-center max-w-xs">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-3xl">⚠️</Text>
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
          {message}
        </Text>

        {__DEV__ && error && (
          <Text className="text-xs text-gray-500 mb-4 text-center">
            {error.message}
          </Text>
        )}

        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-blue-500 rounded-lg py-3 px-6 active:bg-blue-600"
            testID="error-fallback-retry"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default ErrorBoundary;
