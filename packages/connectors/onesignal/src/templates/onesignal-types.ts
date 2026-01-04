import type { CodeGenContext } from '@mobigen/connectors-core';

/**
 * Generate OneSignal types template
 */
export function onesignalTypesTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated OneSignal types for ${ctx.projectConfig.appName}
// Generated on ${new Date().toISOString()}
// DO NOT EDIT - This file is managed by Mobigen

/**
 * OneSignal device state
 */
export interface DeviceState {
  /** OneSignal user ID */
  userId?: string;

  /** Push token for this device */
  pushToken?: string;

  /** Is push disabled for this device? */
  isPushDisabled: boolean;

  /** Is user subscribed to push? */
  subscribed: boolean;

  /** Notification permission status (0 = not determined, 1 = authorized, 2 = denied) */
  notificationPermissionStatus: number;
}

/**
 * Notification received while app is in foreground
 */
export interface NotificationReceivedEvent {
  /** Notification ID */
  notificationId: string;

  /** Notification title */
  title: string;

  /** Notification body */
  body: string;

  /** Additional data attached to notification */
  additionalData?: Record<string, any>;

  /** Launch URL (deep link) */
  launchURL?: string;
}

/**
 * Notification that was opened (user tapped)
 */
export interface OpenedNotification {
  /** Notification ID */
  notificationId: string;

  /** Action that was taken */
  action: {
    /** Action type */
    type: string;

    /** Action button ID (if button was tapped) */
    actionId?: string;
  };

  /** Notification details */
  notification: {
    /** Notification title */
    title: string;

    /** Notification body */
    body: string;

    /** Additional data */
    additionalData?: Record<string, any>;

    /** Launch URL (deep link) */
    launchURL?: string;

    /** Action buttons */
    actionButtons?: Array<{
      id: string;
      text: string;
      icon?: string;
    }>;
  };
}

/**
 * User tags for segmentation
 */
export interface Tags {
  [key: string]: string;
}

/**
 * Notification permission status
 */
export enum NotificationPermission {
  /** Permission not requested yet */
  NotDetermined = 0,

  /** Permission granted */
  Authorized = 1,

  /** Permission denied */
  Denied = 2,

  /** Provisional permission (iOS 12+) */
  Provisional = 3,

  /** Permission status unknown */
  Ephemeral = 4,
}

/**
 * In-App Message action types
 */
export enum InAppMessageActionType {
  Click = 'click',
  Display = 'display',
  Dismiss = 'dismiss',
}

/**
 * Push subscription state
 */
export interface PushSubscriptionState {
  /** Is user opted in to push? */
  optedIn: boolean;

  /** Push subscription ID */
  id?: string;

  /** Push token */
  token?: string;
}

/**
 * External user ID state
 */
export interface ExternalUserIdState {
  /** External user ID (your user ID) */
  externalId?: string;
}

/**
 * Email subscription state
 */
export interface EmailSubscriptionState {
  /** Email address */
  email?: string;

  /** Is subscribed to email? */
  subscribed: boolean;
}

/**
 * SMS subscription state
 */
export interface SMSSubscriptionState {
  /** Phone number */
  number?: string;

  /** Is subscribed to SMS? */
  subscribed: boolean;
}
`;
}
