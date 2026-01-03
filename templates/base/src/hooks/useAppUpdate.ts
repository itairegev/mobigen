import { useState, useEffect, useCallback } from 'react';
import * as Updates from 'expo-updates';

/**
 * Status of the app update process
 */
export type UpdateStatus =
  | 'idle'           // No update check in progress
  | 'checking'       // Checking for updates
  | 'downloading'    // Downloading update
  | 'ready'          // Update downloaded and ready to apply
  | 'error';         // Error occurred

/**
 * Return type of useAppUpdate hook
 */
export interface UseAppUpdateReturn {
  /** Current status of the update process */
  status: UpdateStatus;

  /** Whether an update is available */
  isUpdateAvailable: boolean;

  /** Whether an update has been downloaded and is ready to apply */
  isUpdateReady: boolean;

  /** Current update manifest (if available) */
  manifest?: Updates.Manifest;

  /** Error message if status is 'error' */
  error?: string;

  /** Current update information */
  currentUpdate: {
    updateId?: string;
    createdAt?: Date;
    isEmbeddedLaunch: boolean;
  };

  /** Manually check for updates */
  checkForUpdate: () => Promise<void>;

  /** Download available update */
  downloadUpdate: () => Promise<void>;

  /** Apply downloaded update (reload app) */
  applyUpdate: () => Promise<void>;

  /** Reset error state */
  clearError: () => void;
}

/**
 * Options for useAppUpdate hook
 */
export interface UseAppUpdateOptions {
  /**
   * Check for updates when component mounts
   * @default true
   */
  checkOnMount?: boolean;

  /**
   * Automatically download updates when available
   * @default false
   */
  autoDownload?: boolean;

  /**
   * Automatically reload app when update is downloaded
   * @default false
   */
  autoReload?: boolean;

  /**
   * Callback when update becomes available
   */
  onUpdateAvailable?: (manifest: Updates.Manifest) => void;

  /**
   * Callback when update download completes
   */
  onUpdateDownloaded?: (manifest: Updates.Manifest) => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing app updates
 *
 * Provides a comprehensive interface for checking, downloading, and applying
 * OTA updates using Expo Updates.
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const {
 *     status,
 *     isUpdateAvailable,
 *     isUpdateReady,
 *     checkForUpdate,
 *     downloadUpdate,
 *     applyUpdate,
 *   } = useAppUpdate({
 *     checkOnMount: true,
 *     autoDownload: false,
 *   });
 *
 *   if (isUpdateReady) {
 *     return (
 *       <View>
 *         <Text>Update ready!</Text>
 *         <Button title="Restart" onPress={applyUpdate} />
 *       </View>
 *     );
 *   }
 *
 *   return <MyAppContent />;
 * }
 * ```
 */
export function useAppUpdate(options: UseAppUpdateOptions = {}): UseAppUpdateReturn {
  const {
    checkOnMount = true,
    autoDownload = false,
    autoReload = false,
    onUpdateAvailable,
    onUpdateDownloaded,
    onError,
  } = options;

  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [manifest, setManifest] = useState<Updates.Manifest | undefined>();
  const [error, setError] = useState<string | undefined>();

  // Get current update information
  const getCurrentUpdateInfo = useCallback(() => {
    return {
      updateId: Updates.updateId || undefined,
      createdAt: Updates.createdAt || undefined,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    };
  }, []);

  /**
   * Check for available updates
   */
  const checkForUpdate = useCallback(async () => {
    if (!Updates.isEnabled) {
      setError('Updates are not enabled');
      setStatus('error');
      return;
    }

    setStatus('checking');
    setError(undefined);

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setIsUpdateAvailable(true);
        setManifest(update.manifest);
        setStatus('idle');

        onUpdateAvailable?.(update.manifest);

        // Auto-download if enabled
        if (autoDownload) {
          await downloadUpdate();
        }
      } else {
        setIsUpdateAvailable(false);
        setStatus('idle');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check for updates';
      setError(errorMessage);
      setStatus('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [autoDownload, onUpdateAvailable, onError]);

  /**
   * Download available update
   */
  const downloadUpdate = useCallback(async () => {
    if (!Updates.isEnabled) {
      setError('Updates are not enabled');
      setStatus('error');
      return;
    }

    setStatus('downloading');
    setError(undefined);

    try {
      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        setIsUpdateReady(true);
        setManifest(result.manifest);
        setStatus('ready');

        onUpdateDownloaded?.(result.manifest);

        // Auto-reload if enabled
        if (autoReload) {
          await applyUpdate();
        }
      } else {
        setIsUpdateAvailable(false);
        setStatus('idle');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download update';
      setError(errorMessage);
      setStatus('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [autoReload, onUpdateDownloaded, onError]);

  /**
   * Apply downloaded update (reload app)
   */
  const applyUpdate = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reload app';
      setError(errorMessage);
      setStatus('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [onError]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(undefined);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  /**
   * Check for updates on mount if enabled
   */
  useEffect(() => {
    if (checkOnMount && Updates.isEnabled) {
      checkForUpdate();
    }
  }, [checkOnMount]); // Only run on mount

  /**
   * Set up event listeners for update events
   */
  useEffect(() => {
    if (!Updates.isEnabled) {
      return;
    }

    const eventListener = Updates.addListener((event) => {
      if (event.type === Updates.UpdateEventType.ERROR) {
        setError(event.message);
        setStatus('error');
        onError?.(new Error(event.message));
      } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
        setIsUpdateAvailable(false);
        if (status === 'checking') {
          setStatus('idle');
        }
      } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        setIsUpdateAvailable(true);
      }
    });

    return () => {
      eventListener.remove();
    };
  }, [status, onError]);

  return {
    status,
    isUpdateAvailable,
    isUpdateReady,
    manifest,
    error,
    currentUpdate: getCurrentUpdateInfo(),
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    clearError,
  };
}

/**
 * Simple hook that just returns whether updates are enabled
 * Useful for conditional rendering
 */
export function useUpdatesEnabled(): boolean {
  return Updates.isEnabled;
}

/**
 * Hook that returns current update information
 * Useful for displaying version info in settings
 */
export function useCurrentUpdate() {
  return {
    updateId: Updates.updateId || undefined,
    createdAt: Updates.createdAt || undefined,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isEmergencyLaunch: Updates.isEmergencyLaunch,
    channel: Updates.channel || undefined,
    runtimeVersion: Updates.runtimeVersion || undefined,
  };
}
