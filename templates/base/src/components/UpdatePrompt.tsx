import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUpdates } from '../hooks/useUpdates';

/**
 * Example component that shows an update prompt when updates are available
 * This can be customized per app or replaced entirely
 */
export function UpdatePrompt() {
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
    autoDownload: false, // Don't auto-download, let user decide
    autoReload: false, // Don't auto-reload, let user decide
  });

  // Don't show anything if no update or already checking
  if (!updateAvailable || isChecking) {
    return null;
  }

  // Show error if something went wrong
  if (error) {
    return (
      <View className="bg-red-100 border border-red-400 rounded-lg p-4 m-4">
        <Text className="text-red-800 font-semibold mb-1">Update Error</Text>
        <Text className="text-red-700 text-sm">{error}</Text>
      </View>
    );
  }

  // Show download prompt
  if (!updateDownloaded) {
    return (
      <View className="bg-blue-100 border border-blue-400 rounded-lg p-4 m-4">
        <Text className="text-blue-800 font-semibold mb-1">Update Available</Text>
        <Text className="text-blue-700 text-sm mb-3">
          A new version of the app is available. Download it now to get the latest features and fixes.
        </Text>
        <TouchableOpacity
          onPress={downloadUpdate}
          disabled={isDownloading}
          className="bg-blue-600 rounded-lg py-2 px-4 flex-row items-center justify-center"
        >
          {isDownloading ? (
            <>
              <ActivityIndicator size="small" color="white" className="mr-2" />
              <Text className="text-white font-semibold">Downloading...</Text>
            </>
          ) : (
            <Text className="text-white font-semibold">Download Update</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Show install prompt
  return (
    <View className="bg-green-100 border border-green-400 rounded-lg p-4 m-4">
      <Text className="text-green-800 font-semibold mb-1">Update Ready</Text>
      <Text className="text-green-700 text-sm mb-3">
        The update has been downloaded. Restart the app to apply the changes.
      </Text>
      <TouchableOpacity
        onPress={applyUpdate}
        className="bg-green-600 rounded-lg py-2 px-4"
      >
        <Text className="text-white font-semibold text-center">Restart App</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Alternative: Silent update with toast notification
 */
export function SilentUpdateHandler() {
  const { updateDownloaded } = useUpdates({
    checkOnMount: true,
    autoDownload: true, // Auto-download updates
    autoReload: true, // Auto-reload when update is ready
  });

  // This component doesn't render anything visible
  // It just handles updates in the background
  return null;
}
