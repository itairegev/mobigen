/**
 * Notification Channel Types
 *
 * Common interface for all notification channels.
 */

import type { TriggeredAlert } from '../rules';

/**
 * Notification channel interface
 */
export interface NotificationChannel {
  /**
   * Send a single alert notification
   */
  send(alert: TriggeredAlert): Promise<void>;

  /**
   * Send multiple alerts in batch (optional)
   */
  sendBatch?(alerts: TriggeredAlert[]): Promise<void>;

  /**
   * Test the notification channel (optional)
   */
  test?(): Promise<boolean>;
}

/**
 * Channel configuration by type
 */
export type ChannelConfig =
  | { type: 'slack'; config: import('./slack').SlackConfig }
  | { type: 'email'; config: import('./email').EmailConfig }
  | { type: 'webhook'; config: WebhookConfig }
  | { type: 'console'; config?: ConsoleConfig };

/**
 * Webhook notification configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;

  /** HTTP method */
  method?: 'POST' | 'PUT';

  /** Custom headers */
  headers?: Record<string, string>;

  /** Request timeout in ms */
  timeout?: number;

  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Console notification configuration
 */
export interface ConsoleConfig {
  /** Use colors in output */
  colors?: boolean;

  /** Format as JSON */
  json?: boolean;
}
