import { useState, useEffect, useCallback } from 'react';
import * as Updates from 'expo-updates';
import {
  checkForUpdates,
  fetchUpdate,
  reloadApp,
  getCurrentUpdate,
  isUpdatesEnabled,
} from '../services/updates';

export interface UseUpdatesOptions {
  checkOnMount?: boolean;
  autoDownload?: boolean;
  autoReload?: boolean;
}

export interface UseUpdatesState {
  isChecking: boolean;
  isDownloading: boolean;
  updateAvailable: boolean;
  updateDownloaded: boolean;
  currentUpdate: ReturnType<typeof getCurrentUpdate>;
  manifest?: Updates.Manifest;
  error?: string;
}

/**
 * Hook for managing OTA updates in React components
 */
export function useUpdates(options?: UseUpdatesOptions) {
  const {
    checkOnMount = true,
    autoDownload = true,
    autoReload = false,
  } = options || {};

  const [state, setState] = useState<UseUpdatesState>({
    isChecking: false,
    isDownloading: false,
    updateAvailable: false,
    updateDownloaded: false,
    currentUpdate: getCurrentUpdate(),
  });

  /**
   * Check for available updates
   */
  const checkForUpdate = useCallback(async () => {
    if (!isUpdatesEnabled()) {
      setState((prev) => ({
        ...prev,
        error: 'Updates are not enabled',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isChecking: true,
      error: undefined,
    }));

    try {
      const result = await checkForUpdates();

      setState((prev) => ({
        ...prev,
        isChecking: false,
        updateAvailable: result.isAvailable,
        manifest: result.manifest,
      }));

      // Auto-download if enabled and update is available
      if (result.isAvailable && autoDownload) {
        await downloadUpdate();
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [autoDownload]);

  /**
   * Download available update
   */
  const downloadUpdate = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isDownloading: true,
      error: undefined,
    }));

    try {
      const result = await fetchUpdate();

      setState((prev) => ({
        ...prev,
        isDownloading: false,
        updateDownloaded: result.success,
        manifest: result.manifest,
        error: result.error,
      }));

      // Auto-reload if enabled and update is downloaded
      if (result.success && autoReload) {
        await applyUpdate();
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDownloading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [autoReload]);

  /**
   * Apply downloaded update (reload app)
   */
  const applyUpdate = useCallback(async () => {
    try {
      await reloadApp();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  /**
   * Refresh current update info
   */
  const refreshCurrentUpdate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentUpdate: getCurrentUpdate(),
    }));
  }, []);

  /**
   * Check on mount if enabled
   */
  useEffect(() => {
    if (checkOnMount) {
      checkForUpdate();
    }
  }, [checkOnMount, checkForUpdate]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    if (!isUpdatesEnabled()) {
      return;
    }

    const eventListener = Updates.addListener((event) => {
      if (event.type === Updates.UpdateEventType.ERROR) {
        setState((prev) => ({
          ...prev,
          error: event.message,
        }));
      } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
        setState((prev) => ({
          ...prev,
          updateAvailable: false,
        }));
      } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        setState((prev) => ({
          ...prev,
          updateAvailable: true,
        }));
      }
    });

    return () => {
      eventListener.remove();
    };
  }, []);

  return {
    ...state,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    refreshCurrentUpdate,
  };
}
