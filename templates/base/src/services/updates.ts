import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/**
 * OTA Updates Service
 * Handles checking for and applying updates using Expo Updates
 */

export interface UpdateInfo {
  isAvailable: boolean;
  manifest?: Updates.Manifest;
  isDownloaded: boolean;
}

export interface UpdateCheckResult {
  isAvailable: boolean;
  manifest?: Updates.Manifest;
  downloadedBytes?: number;
}

/**
 * Check if the app is running with Expo Updates enabled
 */
export function isUpdatesEnabled(): boolean {
  return Updates.isEnabled;
}

/**
 * Get current update information
 */
export function getCurrentUpdate(): {
  updateId?: string;
  createdAt?: Date;
  isEmbeddedLaunch: boolean;
  isEmergencyLaunch: boolean;
  channel?: string;
  runtimeVersion?: string;
} {
  const currentUpdate = Updates.updateId;
  const createdAt = Updates.createdAt;
  const manifest = Updates.manifest;

  return {
    updateId: currentUpdate || undefined,
    createdAt: createdAt || undefined,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isEmergencyLaunch: Updates.isEmergencyLaunch,
    channel: Updates.channel || undefined,
    runtimeVersion: Updates.runtimeVersion || undefined,
  };
}

/**
 * Check for available updates
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (!Updates.isEnabled) {
    return { isAvailable: false };
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      return {
        isAvailable: true,
        manifest: update.manifest,
      };
    }

    return { isAvailable: false };
  } catch (error) {
    console.error('Failed to check for updates:', error);

    // Track error event
    await trackUpdateEvent({
      eventType: 'download_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return { isAvailable: false };
  }
}

/**
 * Fetch and download available update
 */
export async function fetchUpdate(): Promise<{
  success: boolean;
  manifest?: Updates.Manifest;
  error?: string;
}> {
  if (!Updates.isEnabled) {
    return { success: false, error: 'Updates not enabled' };
  }

  try {
    const startTime = Date.now();

    await trackUpdateEvent({
      eventType: 'download_start',
    });

    const result = await Updates.fetchUpdateAsync();

    const durationMs = Date.now() - startTime;

    if (result.isNew) {
      await trackUpdateEvent({
        eventType: 'download_complete',
        durationMs,
      });

      return {
        success: true,
        manifest: result.manifest,
      };
    }

    return { success: false, error: 'No new update available' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch update:', error);

    await trackUpdateEvent({
      eventType: 'download_error',
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Reload the app to apply downloaded update
 */
export async function reloadApp(): Promise<void> {
  try {
    await trackUpdateEvent({
      eventType: 'apply_start',
    });

    const startTime = Date.now();
    await Updates.reloadAsync();

    const durationMs = Date.now() - startTime;

    await trackUpdateEvent({
      eventType: 'apply_complete',
      durationMs,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to reload app:', error);

    await trackUpdateEvent({
      eventType: 'apply_error',
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

/**
 * Check for updates and download if available
 * Returns true if update is downloaded and ready to apply
 */
export async function checkAndDownloadUpdate(): Promise<{
  updateAvailable: boolean;
  updateDownloaded: boolean;
  manifest?: Updates.Manifest;
  error?: string;
}> {
  // Check for updates
  const checkResult = await checkForUpdates();

  if (!checkResult.isAvailable) {
    return {
      updateAvailable: false,
      updateDownloaded: false,
    };
  }

  // Download the update
  const fetchResult = await fetchUpdate();

  if (!fetchResult.success) {
    return {
      updateAvailable: true,
      updateDownloaded: false,
      error: fetchResult.error,
    };
  }

  return {
    updateAvailable: true,
    updateDownloaded: true,
    manifest: fetchResult.manifest,
  };
}

/**
 * Track update events for analytics
 */
async function trackUpdateEvent(event: {
  eventType: 'download_start' | 'download_complete' | 'download_error' |
             'apply_start' | 'apply_complete' | 'apply_error' | 'rollback';
  errorMessage?: string;
  errorStack?: string;
  durationMs?: number;
}): Promise<void> {
  try {
    const currentUpdate = getCurrentUpdate();

    // Get app version from app.json or Constants
    const appVersion = '1.0.0'; // TODO: Read from app.json

    // TODO: Send to Mobigen analytics API
    // For now, just log to console
    console.log('Update event:', {
      ...event,
      updateId: currentUpdate.updateId,
      platform: Platform.OS,
      appVersion,
      timestamp: new Date().toISOString(),
    });

    // In production, this would send to the API:
    // await fetch('https://api.mobigen.io/v1/ota-updates/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     updateId: currentUpdate.updateId,
    //     eventType: event.eventType,
    //     platform: Platform.OS,
    //     appVersion,
    //     errorMessage: event.errorMessage,
    //     errorStack: event.errorStack,
    //     durationMs: event.durationMs,
    //   }),
    // });
  } catch (error) {
    // Don't throw - tracking errors shouldn't break the app
    console.error('Failed to track update event:', error);
  }
}

/**
 * Set up automatic update checking on app launch
 * Call this in your app's entry point (e.g., App.tsx or _layout.tsx)
 */
export async function initializeUpdates(options?: {
  checkOnLaunch?: boolean;
  showUpdatePrompt?: boolean;
  onUpdateAvailable?: (manifest: Updates.Manifest) => void;
  onUpdateDownloaded?: (manifest: Updates.Manifest) => void;
  onError?: (error: Error) => void;
}): Promise<void> {
  const {
    checkOnLaunch = true,
    showUpdatePrompt = false,
    onUpdateAvailable,
    onUpdateDownloaded,
    onError,
  } = options || {};

  if (!Updates.isEnabled) {
    console.log('Updates are not enabled');
    return;
  }

  // Log current update info
  const currentUpdate = getCurrentUpdate();
  console.log('Current update:', currentUpdate);

  // Check on launch if enabled
  if (checkOnLaunch) {
    try {
      const result = await checkAndDownloadUpdate();

      if (result.updateAvailable) {
        onUpdateAvailable?.(result.manifest!);

        if (result.updateDownloaded) {
          onUpdateDownloaded?.(result.manifest!);

          if (!showUpdatePrompt) {
            // Auto-reload if no prompt is shown
            await reloadApp();
          }
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
      onError?.(error as Error);
    }
  }

  // Set up event listeners
  const eventListener = Updates.addListener((event) => {
    if (event.type === Updates.UpdateEventType.ERROR) {
      console.error('Update error event:', event.message);
      onError?.(new Error(event.message));
    } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      console.log('No update available');
    } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      console.log('Update available');
    }
  });

  // Clean up listener on app unmount (if needed)
  return () => {
    eventListener.remove();
  };
}
