import type { CodeGenContext } from '@mobigen/connectors-core';

/**
 * Generate OneSignal hooks template
 */
export function onesignalHookTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated OneSignal hooks for ${ctx.projectConfig.appName}
// Generated on ${new Date().toISOString()}
// DO NOT EDIT - This file is managed by Mobigen

import { useState, useEffect, useCallback } from 'react';
import {
  getDeviceState,
  setExternalUserId,
  removeExternalUserId,
  sendTag,
  sendTags,
  deleteTag,
  promptForPushNotification,
  setNotificationOpenedHandler,
  setNotificationWillShowInForegroundHandler,
  disablePush,
  enablePush,
  addTrigger,
  removeTrigger,
} from '../services/onesignal';
import type {
  DeviceState,
  NotificationReceivedEvent,
  OpenedNotification,
  Tags,
} from '../types/onesignal';

/**
 * Hook for OneSignal device state and basic operations
 *
 * @example
 * const { deviceState, isLoading, loginUser, logoutUser, updateTags } = useOneSignal();
 */
export function useOneSignal() {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load device state on mount
  useEffect(() => {
    loadDeviceState();
  }, []);

  const loadDeviceState = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const state = await getDeviceState();
      setDeviceState(state);
    } catch (err: any) {
      setError(err.message || 'Failed to load device state');
      console.error('[OneSignal Hook] Failed to load device state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Link user to OneSignal (call after login)
   */
  const loginUser = useCallback(async (userId: string) => {
    try {
      setError(null);
      setExternalUserId(userId);
      await loadDeviceState();
    } catch (err: any) {
      setError(err.message || 'Failed to login user');
      console.error('[OneSignal Hook] Failed to login user:', err);
    }
  }, []);

  /**
   * Remove user link (call on logout)
   */
  const logoutUser = useCallback(async () => {
    try {
      setError(null);
      removeExternalUserId();
      await loadDeviceState();
    } catch (err: any) {
      setError(err.message || 'Failed to logout user');
      console.error('[OneSignal Hook] Failed to logout user:', err);
    }
  }, []);

  /**
   * Update user tags for segmentation
   */
  const updateTags = useCallback(async (tags: Tags) => {
    try {
      setError(null);
      sendTags(tags);
      await loadDeviceState();
    } catch (err: any) {
      setError(err.message || 'Failed to update tags');
      console.error('[OneSignal Hook] Failed to update tags:', err);
    }
  }, []);

  /**
   * Update a single tag
   */
  const updateTag = useCallback(async (key: string, value: string) => {
    try {
      setError(null);
      sendTag(key, value);
      await loadDeviceState();
    } catch (err: any) {
      setError(err.message || 'Failed to update tag');
      console.error('[OneSignal Hook] Failed to update tag:', err);
    }
  }, []);

  /**
   * Remove a tag
   */
  const removeTag = useCallback(async (key: string) => {
    try {
      setError(null);
      deleteTag(key);
      await loadDeviceState();
    } catch (err: any) {
      setError(err.message || 'Failed to remove tag');
      console.error('[OneSignal Hook] Failed to remove tag:', err);
    }
  }, []);

  /**
   * Refresh device state
   */
  const refresh = useCallback(() => {
    loadDeviceState();
  }, []);

  return {
    deviceState,
    isLoading,
    error,
    loginUser,
    logoutUser,
    updateTags,
    updateTag,
    removeTag,
    refresh,
  };
}

/**
 * Hook for managing push notification permission
 *
 * @example
 * const { hasPermission, requestPermission, isRequesting } = usePushPermission();
 */
export function usePushPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const state = await getDeviceState();
      setHasPermission(state.notificationPermissionStatus === 1);
    } catch (err) {
      console.error('[OneSignal Hook] Failed to check permission:', err);
    }
  };

  /**
   * Request push notification permission
   */
  const requestPermission = useCallback(async (fallbackToSettings = false): Promise<boolean> => {
    try {
      setIsRequesting(true);
      const granted = await promptForPushNotification(fallbackToSettings);
      setHasPermission(granted);
      return granted;
    } catch (err: any) {
      console.error('[OneSignal Hook] Failed to request permission:', err);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return {
    hasPermission,
    requestPermission,
    isRequesting,
    refresh: checkPermission,
  };
}

/**
 * Hook for handling notification events
 *
 * @param options - Event handlers
 *
 * @example
 * useNotificationHandler({
 *   onNotificationOpened: (notification) => {
 *     // Handle notification tap
 *     console.log('Notification opened:', notification);
 *   },
 *   onNotificationReceived: (notification) => {
 *     // Return true to show notification, false to hide
 *     return true;
 *   },
 * });
 */
export function useNotificationHandler(options: {
  /** Called when user taps a notification */
  onNotificationOpened?: (notification: OpenedNotification) => void;

  /** Called when notification received in foreground. Return true to show, false to hide. */
  onNotificationReceived?: (notification: NotificationReceivedEvent) => boolean;
}) {
  useEffect(() => {
    // Set up opened handler
    if (options.onNotificationOpened) {
      setNotificationOpenedHandler(options.onNotificationOpened);
    }

    // Set up foreground handler
    if (options.onNotificationReceived) {
      setNotificationWillShowInForegroundHandler(options.onNotificationReceived);
    }
  }, [options.onNotificationOpened, options.onNotificationReceived]);
}

/**
 * Hook for managing user tags
 *
 * @example
 * const { tags, addTag, removeTag, setMultipleTags } = useTags();
 */
export function useTags() {
  const [tags, setTags] = useState<Tags>({});
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Add a single tag
   */
  const addTag = useCallback(async (key: string, value: string) => {
    try {
      setIsUpdating(true);
      sendTag(key, value);
      setTags(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('[OneSignal Hook] Failed to add tag:', err);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Remove a tag
   */
  const removeTag = useCallback(async (key: string) => {
    try {
      setIsUpdating(true);
      deleteTag(key);
      setTags(prev => {
        const newTags = { ...prev };
        delete newTags[key];
        return newTags;
      });
    } catch (err) {
      console.error('[OneSignal Hook] Failed to remove tag:', err);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Set multiple tags at once
   */
  const setMultipleTags = useCallback(async (newTags: Tags) => {
    try {
      setIsUpdating(true);
      sendTags(newTags);
      setTags(prev => ({ ...prev, ...newTags }));
    } catch (err) {
      console.error('[OneSignal Hook] Failed to set tags:', err);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    tags,
    addTag,
    removeTag,
    setMultipleTags,
    isUpdating,
  };
}

/**
 * Hook for managing push subscription state
 *
 * @example
 * const { isSubscribed, subscribe, unsubscribe } = usePushSubscription();
 */
export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      setIsLoading(true);
      const state = await getDeviceState();
      setIsSubscribed(state.subscribed);
    } catch (err) {
      console.error('[OneSignal Hook] Failed to check subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    try {
      enablePush();
      setIsSubscribed(true);
    } catch (err) {
      console.error('[OneSignal Hook] Failed to subscribe:', err);
    }
  }, []);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    try {
      disablePush();
      setIsSubscribed(false);
    } catch (err) {
      console.error('[OneSignal Hook] Failed to unsubscribe:', err);
    }
  }, []);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
    refresh: checkSubscription,
  };
}

/**
 * Hook for managing In-App Message triggers
 *
 * @example
 * const { setTrigger, removeTrigger } = useInAppMessages();
 */
export function useInAppMessages() {
  const [triggers, setTriggers] = useState<Record<string, string | number | boolean>>({});

  /**
   * Set an in-app message trigger
   */
  const setTrigger = useCallback((key: string, value: string | number | boolean) => {
    addTrigger(key, value);
    setTriggers(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Remove an in-app message trigger
   */
  const removeTrigger_ = useCallback((key: string) => {
    removeTrigger(key);
    setTriggers(prev => {
      const newTriggers = { ...prev };
      delete newTriggers[key];
      return newTriggers;
    });
  }, []);

  return {
    triggers,
    setTrigger,
    removeTrigger: removeTrigger_,
  };
}
`;
}
