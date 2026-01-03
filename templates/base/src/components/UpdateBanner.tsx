import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useUpdates } from '../hooks/useUpdates';

export interface UpdateBannerProps {
  /**
   * Position of the banner
   * @default 'top'
   */
  position?: 'top' | 'bottom';

  /**
   * Whether the banner can be dismissed
   * @default true
   */
  dismissible?: boolean;

  /**
   * Custom colors
   */
  colors?: {
    available?: string;
    downloading?: string;
    ready?: string;
    error?: string;
  };

  /**
   * Auto-download updates when available
   * @default true
   */
  autoDownload?: boolean;

  /**
   * Callback when update is applied
   */
  onUpdateApplied?: () => void;

  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
}

/**
 * UpdateBanner Component
 *
 * Displays a banner when app updates are available, with options to
 * download and apply the update. Supports different states:
 * - Checking for updates
 * - Update available (with download button)
 * - Downloading (with progress)
 * - Update ready (with apply button)
 * - Error state
 *
 * @example
 * ```tsx
 * // In your root layout or main screen
 * <UpdateBanner position="top" autoDownload={true} />
 * ```
 */
export function UpdateBanner({
  position = 'top',
  dismissible = true,
  colors,
  autoDownload = true,
  onUpdateApplied,
  onDismiss,
}: UpdateBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    isChecking,
    isDownloading,
    updateAvailable,
    updateDownloaded,
    error,
    downloadUpdate,
    applyUpdate,
  } = useUpdates({
    checkOnMount: true,
    autoDownload,
    autoReload: false, // Never auto-reload, always show prompt
  });

  // Don't show if dismissed or no update
  if (isDismissed || (!updateAvailable && !error && !isChecking)) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleApplyUpdate = async () => {
    await applyUpdate();
    onUpdateApplied?.();
  };

  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  // Error state
  if (error) {
    return (
      <View
        className={`absolute left-0 right-0 ${positionClass} z-50`}
        style={{ elevation: 10 }}
      >
        <View
          className="mx-4 mt-4 rounded-lg p-4 shadow-lg"
          style={{ backgroundColor: colors?.error || '#FEE2E2' }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-red-900 font-semibold text-base mb-1">
                Update Error
              </Text>
              <Text className="text-red-800 text-sm">{error}</Text>
            </View>
            {dismissible && (
              <TouchableOpacity
                onPress={handleDismiss}
                className="ml-2 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text className="text-red-900 text-lg font-bold">×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Checking state
  if (isChecking) {
    return (
      <View
        className={`absolute left-0 right-0 ${positionClass} z-50`}
        style={{ elevation: 10 }}
      >
        <View className="mx-4 mt-4 bg-gray-100 rounded-lg p-4 shadow-lg">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#6B7280" />
            <Text className="text-gray-700 text-sm ml-3">
              Checking for updates...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Download state
  if (updateAvailable && !updateDownloaded) {
    return (
      <View
        className={`absolute left-0 right-0 ${positionClass} z-50`}
        style={{ elevation: 10 }}
      >
        <View
          className="mx-4 mt-4 rounded-lg p-4 shadow-lg"
          style={{ backgroundColor: colors?.available || '#DBEAFE' }}
        >
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-blue-900 font-semibold text-base mb-1">
                Update Available
              </Text>
              <Text className="text-blue-800 text-sm">
                A new version is ready. {isDownloading ? 'Downloading...' : 'Download to get the latest features.'}
              </Text>
            </View>
            {dismissible && !isDownloading && (
              <TouchableOpacity
                onPress={handleDismiss}
                className="ml-2 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text className="text-blue-900 text-lg font-bold">×</Text>
              </TouchableOpacity>
            )}
          </View>

          {isDownloading ? (
            <View>
              <View className="flex-row items-center justify-center py-2">
                <ActivityIndicator size="small" color="#1E40AF" className="mr-2" />
                <Text className="text-blue-900 font-medium">Downloading...</Text>
              </View>
              {/* Progress bar */}
              <View className="h-2 bg-blue-200 rounded-full overflow-hidden mt-2">
                <View className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={downloadUpdate}
              className="bg-blue-600 rounded-lg py-3 px-4 active:bg-blue-700"
            >
              <Text className="text-white font-semibold text-center text-base">
                Download Update
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Ready to apply state
  if (updateDownloaded) {
    return (
      <View
        className={`absolute left-0 right-0 ${positionClass} z-50`}
        style={{ elevation: 10 }}
      >
        <View
          className="mx-4 mt-4 rounded-lg p-4 shadow-lg"
          style={{ backgroundColor: colors?.ready || '#D1FAE5' }}
        >
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-green-900 font-semibold text-base mb-1">
                Update Ready ✓
              </Text>
              <Text className="text-green-800 text-sm">
                Restart the app to apply the update and get the latest features.
              </Text>
            </View>
            {dismissible && (
              <TouchableOpacity
                onPress={handleDismiss}
                className="ml-2 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text className="text-green-900 text-lg font-bold">×</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleApplyUpdate}
              className="flex-1 bg-green-600 rounded-lg py-3 px-4 active:bg-green-700"
            >
              <Text className="text-white font-semibold text-center text-base">
                Restart Now
              </Text>
            </TouchableOpacity>
            {dismissible && (
              <TouchableOpacity
                onPress={handleDismiss}
                className="bg-green-100 rounded-lg py-3 px-4 active:bg-green-200"
              >
                <Text className="text-green-900 font-semibold text-center text-base">
                  Later
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return null;
}

/**
 * CompactUpdateBanner Component
 *
 * A more compact version of the update banner that takes less space
 */
export function CompactUpdateBanner(props: Omit<UpdateBannerProps, 'dismissible'>) {
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    isDownloading,
    updateAvailable,
    updateDownloaded,
    downloadUpdate,
    applyUpdate,
  } = useUpdates({
    checkOnMount: true,
    autoDownload: props.autoDownload ?? true,
    autoReload: false,
  });

  if (isDismissed || !updateAvailable) {
    return null;
  }

  const position = props.position || 'top';
  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <View
      className={`absolute left-0 right-0 ${positionClass} z-50`}
      style={{ elevation: 10 }}
    >
      <View className="bg-blue-600 px-4 py-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-sm flex-1">
            {updateDownloaded ? 'Update ready' : isDownloading ? 'Downloading...' : 'Update available'}
          </Text>

          {updateDownloaded ? (
            <TouchableOpacity onPress={applyUpdate} className="ml-2">
              <Text className="text-white font-semibold">Restart</Text>
            </TouchableOpacity>
          ) : !isDownloading ? (
            <TouchableOpacity onPress={downloadUpdate} className="ml-2">
              <Text className="text-white font-semibold">Download</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator size="small" color="white" />
          )}

          <TouchableOpacity
            onPress={() => setIsDismissed(true)}
            className="ml-3 p-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-white text-lg font-bold">×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
