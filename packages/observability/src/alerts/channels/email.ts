/**
 * Email Notification Channel
 *
 * Sends alert notifications via email using SMTP or AWS SES.
 */

import type { TriggeredAlert } from '../rules';
import { AlertSeverity } from '../rules';
import type { NotificationChannel } from './types';

/**
 * Email configuration
 */
export interface EmailConfig {
  /** SMTP configuration */
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  /** AWS SES configuration */
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };

  /** From address */
  from: string;

  /** To addresses */
  to: string[];

  /** CC addresses */
  cc?: string[];

  /** Subject prefix */
  subjectPrefix?: string;
}

/**
 * Email message
 */
interface EmailMessage {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
}

/**
 * Email notification channel
 */
export class EmailChannel implements NotificationChannel {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.smtp && !this.config.ses) {
      throw new Error('Either SMTP or SES configuration must be provided');
    }

    if (this.config.to.length === 0) {
      throw new Error('At least one recipient email address is required');
    }
  }

  /**
   * Send alert via email
   */
  async send(alert: TriggeredAlert): Promise<void> {
    const message = this.formatMessage(alert);

    try {
      if (this.config.smtp) {
        await this.sendViaSMTP(message);
      } else if (this.config.ses) {
        await this.sendViaSES(message);
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  /**
   * Send multiple alerts in batch
   */
  async sendBatch(alerts: TriggeredAlert[]): Promise<void> {
    if (alerts.length === 0) return;

    const message = this.formatBatchMessage(alerts);

    try {
      if (this.config.smtp) {
        await this.sendViaSMTP(message);
      } else if (this.config.ses) {
        await this.sendViaSES(message);
      }
    } catch (error) {
      console.error('Failed to send batch email notification:', error);
      throw error;
    }
  }

  /**
   * Format single alert as email
   */
  private formatMessage(alert: TriggeredAlert): EmailMessage {
    const subject = this.formatSubject(alert);
    const html = this.formatHtml(alert);
    const text = this.formatText(alert);

    return {
      from: this.config.from,
      to: this.config.to,
      cc: this.config.cc,
      subject,
      html,
      text,
    };
  }

  /**
   * Format batch of alerts as email
   */
  private formatBatchMessage(alerts: TriggeredAlert[]): EmailMessage {
    const severities = new Set(alerts.map((a) => a.rule.severity));
    const highestSeverity = this.getHighestSeverity(Array.from(severities));

    const prefix = this.config.subjectPrefix || '[Mobigen Alert]';
    const subject = `${prefix} ${alerts.length} ${highestSeverity.toUpperCase()} alerts`;

    const html = this.formatBatchHtml(alerts);
    const text = this.formatBatchText(alerts);

    return {
      from: this.config.from,
      to: this.config.to,
      cc: this.config.cc,
      subject,
      html,
      text,
    };
  }

  /**
   * Format email subject
   */
  private formatSubject(alert: TriggeredAlert): string {
    const prefix = this.config.subjectPrefix || '[Mobigen Alert]';
    const severity = alert.rule.severity.toUpperCase();
    return `${prefix} ${severity}: ${alert.rule.name}`;
  }

  /**
   * Format HTML email body
   */
  private formatHtml(alert: TriggeredAlert): string {
    const color = this.getSeverityColor(alert.rule.severity);
    const date = new Date(alert.timestamp).toLocaleString();

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
    .button { display: inline-block; padding: 10px 20px; background: ${color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 ${alert.rule.name}</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Alert Message:</div>
        <div class="value">${alert.message}</div>
      </div>

      <div class="field">
        <div class="label">Severity:</div>
        <div class="value">${this.formatSeverity(alert.rule.severity)}</div>
      </div>

      <div class="field">
        <div class="label">Description:</div>
        <div class="value">${alert.rule.description}</div>
      </div>

      <div class="field">
        <div class="label">Current Value:</div>
        <div class="value">${alert.value.toFixed(2)}</div>
      </div>

      <div class="field">
        <div class="label">Threshold:</div>
        <div class="value">${alert.rule.threshold}</div>
      </div>

      <div class="field">
        <div class="label">Triggered At:</div>
        <div class="value">${date}</div>
      </div>

      ${alert.labels ? `
      <div class="field">
        <div class="label">Labels:</div>
        <div class="value">${Object.entries(alert.labels)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}</div>
      </div>
      ` : ''}

      ${alert.rule.runbookUrl ? `
      <div class="field">
        <a href="${alert.rule.runbookUrl}" class="button">View Runbook</a>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      Mobigen Alert System | Alert ID: ${alert.id}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format plain text email body
   */
  private formatText(alert: TriggeredAlert): string {
    const date = new Date(alert.timestamp).toLocaleString();
    const lines: string[] = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `🚨 ${alert.rule.name}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `Alert Message: ${alert.message}`,
      `Severity: ${alert.rule.severity.toUpperCase()}`,
      `Description: ${alert.rule.description}`,
      '',
      `Current Value: ${alert.value.toFixed(2)}`,
      `Threshold: ${alert.rule.threshold}`,
      `Triggered At: ${date}`,
    ];

    if (alert.labels) {
      lines.push('');
      lines.push('Labels:');
      for (const [key, value] of Object.entries(alert.labels)) {
        lines.push(`  ${key}=${value}`);
      }
    }

    if (alert.rule.runbookUrl) {
      lines.push('');
      lines.push(`Runbook: ${alert.rule.runbookUrl}`);
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Mobigen Alert System | Alert ID: ${alert.id}`);

    return lines.join('\n');
  }

  /**
   * Format batch HTML email
   */
  private formatBatchHtml(alerts: TriggeredAlert[]): string {
    const severities = new Set(alerts.map((a) => a.rule.severity));
    const highestSeverity = this.getHighestSeverity(Array.from(severities));
    const color = this.getSeverityColor(highestSeverity);
    const date = new Date().toLocaleString();

    const alertsHtml = alerts
      .map(
        (alert) => `
      <div style="margin: 15px 0; padding: 15px; background: white; border-left: 4px solid ${this.getSeverityColor(
        alert.rule.severity
      )};">
        <h4 style="margin: 0 0 10px 0;">${alert.rule.name}</h4>
        <p style="margin: 5px 0;"><strong>Message:</strong> ${alert.message}</p>
        <p style="margin: 5px 0;"><strong>Severity:</strong> ${this.formatSeverity(
          alert.rule.severity
        )}</p>
        <p style="margin: 5px 0;"><strong>Value:</strong> ${alert.value.toFixed(2)} (threshold: ${alert.rule.threshold})</p>
      </div>
    `
      )
      .join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 ${alerts.length} Alert${alerts.length > 1 ? 's' : ''} Triggered</h2>
      <p style="margin: 5px 0;">Highest Severity: ${highestSeverity.toUpperCase()}</p>
      <p style="margin: 5px 0;">${date}</p>
    </div>
    <div class="content">
      ${alertsHtml}
    </div>
    <div class="footer">
      Mobigen Alert System
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format batch plain text email
   */
  private formatBatchText(alerts: TriggeredAlert[]): string {
    const severities = new Set(alerts.map((a) => a.rule.severity));
    const highestSeverity = this.getHighestSeverity(Array.from(severities));
    const date = new Date().toLocaleString();

    const lines: string[] = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `🚨 ${alerts.length} Alert${alerts.length > 1 ? 's' : ''} Triggered`,
      `Highest Severity: ${highestSeverity.toUpperCase()}`,
      date,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
    ];

    for (const alert of alerts) {
      lines.push(`• ${alert.rule.name}`);
      lines.push(`  Message: ${alert.message}`);
      lines.push(`  Severity: ${alert.rule.severity.toUpperCase()}`);
      lines.push(
        `  Value: ${alert.value.toFixed(2)} (threshold: ${alert.rule.threshold})`
      );
      lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Mobigen Alert System');

    return lines.join('\n');
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(message: EmailMessage): Promise<void> {
    // Note: In production, use nodemailer or similar
    // This is a placeholder showing the structure

    console.log('Sending email via SMTP:', {
      host: this.config.smtp?.host,
      to: message.to,
      subject: message.subject,
    });

    // Placeholder for actual SMTP implementation
    // const transporter = nodemailer.createTransport(this.config.smtp);
    // await transporter.sendMail(message);
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(message: EmailMessage): Promise<void> {
    // Note: In production, use AWS SDK
    // This is a placeholder showing the structure

    console.log('Sending email via SES:', {
      region: this.config.ses?.region,
      to: message.to,
      subject: message.subject,
    });

    // Placeholder for actual SES implementation
    // const ses = new AWS.SES({ region: this.config.ses.region });
    // await ses.sendEmail({ ... }).promise();
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      [AlertSeverity.INFO]: '#36a64f',
      [AlertSeverity.WARNING]: '#ff9900',
      [AlertSeverity.CRITICAL]: '#dc3545',
    };
    return colors[severity];
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
   * Get highest severity from list
   */
  private getHighestSeverity(severities: AlertSeverity[]): AlertSeverity {
    if (severities.includes(AlertSeverity.CRITICAL)) {
      return AlertSeverity.CRITICAL;
    }
    if (severities.includes(AlertSeverity.WARNING)) {
      return AlertSeverity.WARNING;
    }
    return AlertSeverity.INFO;
  }

  /**
   * Test email configuration
   */
  async test(): Promise<boolean> {
    try {
      const message: EmailMessage = {
        from: this.config.from,
        to: this.config.to,
        subject: '[Mobigen Alert] Test Email',
        html: '<h2>Test Email</h2><p>If you receive this, email notifications are working correctly.</p>',
        text: 'Test Email\n\nIf you receive this, email notifications are working correctly.',
      };

      if (this.config.smtp) {
        await this.sendViaSMTP(message);
      } else if (this.config.ses) {
        await this.sendViaSES(message);
      }

      return true;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}
