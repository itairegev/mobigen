import type { CodeGenContext } from '@mobigen/connectors-core';

/**
 * Generate OneSignal service template
 */
export function onesignalServiceTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated OneSignal service for ${ctx.projectConfig.appName}
// Generated on ${new Date().toISOString()}
// DO NOT EDIT - This file is managed by Mobigen

import OneSignal, {
  OSNotification,
  NotificationWillDisplayEvent,
  NotificationClickEvent,
} from 'react-native-onesignal';
import type {
  DeviceState,
  NotificationReceivedEvent,
  OpenedNotification,
  Tags,
} from '../types/onesignal';

// OneSignal App ID from environment
export const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '${ctx.credentials.appId}';

/**
 * Initialize OneSignal SDK
 * Call this once when your app starts (typically in App.tsx or _layout.tsx)
 *
 * @param options - Optional configuration
 */
export function initializeOneSignal(options?: {
  /** Enable verbose logging for debugging */
  logLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Prompt for push permission on initialization (iOS only) */
  promptForPushNotificationsWithUserResponse?: boolean;
}) {
  // Set log level (0 = None, 6 = Verbose)
  if (options?.logLevel !== undefined) {
    OneSignal.Debug.setLogLevel(options.logLevel);
  }

  // Initialize with App ID
  OneSignal.initialize(ONESIGNAL_APP_ID);

  // iOS: Prompt for push permission if requested
  if (options?.promptForPushNotificationsWithUserResponse) {
    OneSignal.Notifications.requestPermission(true);
  }

  console.log(\`[OneSignal] Initialized with App ID: \${ONESIGNAL_APP_ID}\`);
}

/**
 * Link OneSignal device to your user system
 * Call this after user login to associate push notifications with your user ID
 *
 * @param userId - Your internal user ID
 */
export function setExternalUserId(userId: string): void {
  OneSignal.login(userId);
  console.log(\`[OneSignal] Set external user ID: \${userId}\`);
}

/**
 * Remove external user ID (e.g., on logout)
 */
export function removeExternalUserId(): void {
  OneSignal.logout();
  console.log('[OneSignal] Removed external user ID');
}

/**
 * Set a single tag for user segmentation
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export function sendTag(key: string, value: string): void {
  OneSignal.User.addTag(key, value);
  console.log(\`[OneSignal] Added tag: \${key} = \${value}\`);
}

/**
 * Set multiple tags at once
 *
 * @param tags - Object with tag key-value pairs
 */
export function sendTags(tags: Tags): void {
  OneSignal.User.addTags(tags);
  console.log(\`[OneSignal] Added tags:\`, tags);
}

/**
 * Remove a tag
 *
 * @param key - Tag key to remove
 */
export function deleteTag(key: string): void {
  OneSignal.User.removeTag(key);
  console.log(\`[OneSignal] Removed tag: \${key}\`);
}

/**
 * Get current device state (subscription status, user ID, push token, etc.)
 *
 * @returns Device state information
 */
export async function getDeviceState(): Promise<DeviceState> {
  const pushSubscription = OneSignal.User.pushSubscription;
  const userId = OneSignal.User.onesignalId;

  return {
    userId: userId || undefined,
    pushToken: pushSubscription.token || undefined,
    isPushDisabled: !pushSubscription.optedIn,
    subscribed: pushSubscription.optedIn,
    notificationPermissionStatus: await getNotificationPermissionStatus(),
  };
}

/**
 * Get notification permission status
 */
async function getNotificationPermissionStatus(): Promise<number> {
  const hasPermission = await OneSignal.Notifications.getPermissionAsync();
  return hasPermission ? 1 : 0; // 1 = authorized, 0 = denied/not determined
}

/**
 * Request push notification permission (iOS)
 * On Android, permission is granted by default
 *
 * @param fallbackToSettings - If true and permission denied, prompt user to go to Settings
 * @returns Permission granted status
 */
export async function promptForPushNotification(
  fallbackToSettings: boolean = false
): Promise<boolean> {
  const granted = await OneSignal.Notifications.requestPermission(fallbackToSettings);
  console.log(\`[OneSignal] Permission \${granted ? 'granted' : 'denied'}\`);
  return granted;
}

/**
 * Set handler for notification opened (user tapped notification)
 *
 * @param handler - Callback function
 */
export function setNotificationOpenedHandler(
  handler: (notification: OpenedNotification) => void
): void {
  OneSignal.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
    const notification: OpenedNotification = {
      notificationId: event.notification.notificationId,
      action: {
        type: event.result.actionId || 'Opened',
        actionId: event.result.actionId,
      },
      notification: {
        title: event.notification.title || '',
        body: event.notification.body || '',
        additionalData: event.notification.additionalData,
        launchURL: event.notification.launchURL,
        actionButtons: event.notification.actionButtons,
      },
    };

    handler(notification);
  });
}

/**
 * Set handler for notification received while app is in foreground
 *
 * @param handler - Callback function that controls if notification should be displayed
 */
export function setNotificationWillShowInForegroundHandler(
  handler: (notification: NotificationReceivedEvent) => boolean
): void {
  OneSignal.Notifications.addEventListener(
    'foregroundWillDisplay',
    (event: NotificationWillDisplayEvent) => {
      const notification: NotificationReceivedEvent = {
        notificationId: event.notification.notificationId,
        title: event.notification.title || '',
        body: event.notification.body || '',
        additionalData: event.notification.additionalData,
        launchURL: event.notification.launchURL,
      };

      // Call handler to determine if notification should be shown
      const shouldDisplay = handler(notification);

      if (!shouldDisplay) {
        // Prevent notification from displaying
        event.preventDefault();
      }
      // If shouldDisplay is true, notification will show normally
    }
  );
}

/**
 * Add alias for user (email, phone, custom ID, etc.)
 *
 * @param label - Alias label (e.g., 'email', 'phone')
 * @param id - Alias value
 */
export function addAlias(label: string, id: string): void {
  OneSignal.User.addAlias(label, id);
  console.log(\`[OneSignal] Added alias: \${label} = \${id}\`);
}

/**
 * Remove alias
 *
 * @param label - Alias label to remove
 */
export function removeAlias(label: string): void {
  OneSignal.User.removeAlias(label);
  console.log(\`[OneSignal] Removed alias: \${label}\`);
}

/**
 * Disable push notifications for this device
 */
export function disablePush(): void {
  OneSignal.User.pushSubscription.optOut();
  console.log('[OneSignal] Push notifications disabled');
}

/**
 * Enable push notifications for this device
 */
export function enablePush(): void {
  OneSignal.User.pushSubscription.optIn();
  console.log('[OneSignal] Push notifications enabled');
}

/**
 * Send an outcome event (conversion tracking)
 *
 * @param name - Outcome name
 * @param value - Optional value
 */
export function sendOutcome(name: string, value?: number): void {
  if (value !== undefined) {
    OneSignal.Session.addOutcome(name, value);
  } else {
    OneSignal.Session.addOutcome(name);
  }
  console.log(\`[OneSignal] Sent outcome: \${name}\${value ? \` = \${value}\` : ''}\`);
}

/**
 * Trigger an In-App Message
 *
 * @param triggerId - Trigger ID configured in OneSignal dashboard
 */
export function addTrigger(triggerId: string, value: string | number | boolean): void {
  OneSignal.InAppMessages.addTrigger(triggerId, value.toString());
  console.log(\`[OneSignal] Added in-app message trigger: \${triggerId} = \${value}\`);
}

/**
 * Remove an In-App Message trigger
 *
 * @param triggerId - Trigger ID to remove
 */
export function removeTrigger(triggerId: string): void {
  OneSignal.InAppMessages.removeTrigger(triggerId);
  console.log(\`[OneSignal] Removed in-app message trigger: \${triggerId}\`);
}

/**
 * Clear all In-App Message triggers
 */
export function clearTriggers(): void {
  OneSignal.InAppMessages.clearTriggers();
  console.log('[OneSignal] Cleared all in-app message triggers');
}

/**
 * Pause In-App Messages
 */
export function pauseInAppMessages(): void {
  OneSignal.InAppMessages.setPaused(true);
  console.log('[OneSignal] In-app messages paused');
}

/**
 * Resume In-App Messages
 */
export function resumeInAppMessages(): void {
  OneSignal.InAppMessages.setPaused(false);
  console.log('[OneSignal] In-app messages resumed');
}
`;
}
