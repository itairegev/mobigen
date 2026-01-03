/**
 * Slack Notification Channel
 *
 * Sends alert notifications to Slack via webhook.
 */

import type { TriggeredAlert } from '../rules';
import { AlertSeverity } from '../rules';
import type { NotificationChannel } from './types';

/**
 * Slack webhook configuration
 */
export interface SlackConfig {
  /** Webhook URL */
  webhookUrl: string;

  /** Channel to post to (optional, webhook default used otherwise) */
  channel?: string;

  /** Bot username */
  username?: string;

  /** Bot icon emoji */
  iconEmoji?: string;

  /** Mention users/groups for critical alerts */
  mentions?: {
    critical?: string[]; // e.g., ['@oncall', '@team-platform']
    warning?: string[];
    info?: string[];
  };
}

/**
 * Slack message attachment
 */
interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer?: string;
  ts?: number;
}

/**
 * Slack message payload
 */
interface SlackMessage {
  channel?: string;
  username?: string;
  icon_emoji?: string;
  text: string;
  attachments?: SlackAttachment[];
}

/**
 * Slack notification channel
 */
export class SlackChannel implements NotificationChannel {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Send alert to Slack
   */
  async send(alert: TriggeredAlert): Promise<void> {
    const message = this.formatMessage(alert);

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Slack webhook failed: ${response.status} ${text}`);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  /**
   * Send multiple alerts in batch
   */
  async sendBatch(alerts: TriggeredAlert[]): Promise<void> {
    if (alerts.length === 0) return;

    // Group by severity
    const grouped = this.groupBySeverity(alerts);

    // Send one message per severity level
    for (const [severity, severityAlerts] of Object.entries(grouped)) {
      const message = this.formatBatchMessage(
        severityAlerts,
        severity as AlertSeverity
      );

      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
      } catch (error) {
        console.error(
          `Failed to send Slack batch notification for ${severity}:`,
          error
        );
      }
    }
  }

  /**
   * Format single alert as Slack message
   */
  private formatMessage(alert: TriggeredAlert): SlackMessage {
    const color = this.getSeverityColor(alert.rule.severity);
    const mentions = this.getMentions(alert.rule.severity);

    const text = mentions.length > 0 ? `${mentions.join(' ')} Alert triggered` : 'Alert triggered';

    const attachment: SlackAttachment = {
      color,
      title: `🚨 ${alert.rule.name}`,
      text: alert.message,
      fields: [
        {
          title: 'Severity',
          value: this.formatSeverity(alert.rule.severity),
          short: true,
        },
        {
          title: 'Value',
          value: alert.value.toFixed(2),
          short: true,
        },
        {
          title: 'Threshold',
          value: String(alert.rule.threshold),
          short: true,
        },
        {
          title: 'Description',
          value: alert.rule.description,
          short: false,
        },
      ],
      footer: 'Mobigen Alert System',
      ts: Math.floor(alert.timestamp / 1000),
    };

    // Add runbook link if available
    if (alert.rule.runbookUrl) {
      attachment.fields.push({
        title: 'Runbook',
        value: `<${alert.rule.runbookUrl}|View Resolution Steps>`,
        short: false,
      });
    }

    // Add labels if present
    if (alert.labels && Object.keys(alert.labels).length > 0) {
      attachment.fields.push({
        title: 'Labels',
        value: Object.entries(alert.labels)
          .map(([k, v]) => `\`${k}=${v}\``)
          .join(', '),
        short: false,
      });
    }

    return {
      channel: this.config.channel,
      username: this.config.username || 'Mobigen Alerts',
      icon_emoji: this.config.iconEmoji || ':warning:',
      text,
      attachments: [attachment],
    };
  }

  /**
   * Format batch of alerts
   */
  private formatBatchMessage(
    alerts: TriggeredAlert[],
    severity: AlertSeverity
  ): SlackMessage {
    const color = this.getSeverityColor(severity);
    const mentions = this.getMentions(severity);

    const text = mentions.length > 0
      ? `${mentions.join(' ')} ${alerts.length} ${severity} alerts triggered`
      : `${alerts.length} ${severity} alerts triggered`;

    const attachment: SlackAttachment = {
      color,
      title: `🚨 ${alerts.length} Alert${alerts.length > 1 ? 's' : ''} Triggered`,
      text: `Severity: ${this.formatSeverity(severity)}`,
      fields: alerts.map((alert) => ({
        title: alert.rule.name,
        value: alert.message,
        short: false,
      })),
      footer: 'Mobigen Alert System',
      ts: Math.floor(Date.now() / 1000),
    };

    return {
      channel: this.config.channel,
      username: this.config.username || 'Mobigen Alerts',
      icon_emoji: this.config.iconEmoji || ':warning:',
      text,
      attachments: [attachment],
    };
  }

  /**
   * Get Slack color for severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      [AlertSeverity.INFO]: '#36a64f', // Green
      [AlertSeverity.WARNING]: '#ff9900', // Orange
      [AlertSeverity.CRITICAL]: '#ff0000', // Red
    };
    return colors[severity];
  }

  /**
   * Get mentions for severity
   */
  private getMentions(severity: AlertSeverity): string[] {
    const mentions = this.config.mentions || {};
    return mentions[severity] || [];
  }

  /**
   * Format severity with emoji
   */
  private formatSeverity(severity: AlertSeverity): string {
    const emojis: Record<AlertSeverity, string> = {
      [AlertSeverity.INFO]: 'ℹ️',
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.CRITICAL]: '🔴',
    };
    return `${emojis[severity]} ${severity.toUpperCase()}`;
  }

  /**
   * Group alerts by severity
   */
  private groupBySeverity(
    alerts: TriggeredAlert[]
  ): Record<string, TriggeredAlert[]> {
    const grouped: Record<string, TriggeredAlert[]> = {};

    for (const alert of alerts) {
      const severity = alert.rule.severity;
      if (!grouped[severity]) {
        grouped[severity] = [];
      }
      grouped[severity].push(alert);
    }

    return grouped;
  }

  /**
   * Test the Slack webhook connection
   */
  async test(): Promise<boolean> {
    try {
      const message: SlackMessage = {
        channel: this.config.channel,
        username: this.config.username || 'Mobigen Alerts',
        icon_emoji: this.config.iconEmoji || ':warning:',
        text: 'Test message from Mobigen Alert System',
        attachments: [
          {
            color: '#36a64f',
            title: 'Connection Test',
            text: 'If you see this message, the Slack integration is working correctly.',
            fields: [],
          },
        ],
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Slack test failed:', error);
      return false;
    }
  }
}
