/**
 * SendGrid Email Provider
 */

import { BaseEmailProvider } from './base-provider.js';
import type { Email, SendResult, ProviderConfig } from '../types.js';

interface SendGridResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}

export class SendGridProvider extends BaseEmailProvider {
  readonly name = 'sendgrid';
  private apiKey: string;
  private baseUrl = 'https://api.sendgrid.com/v3';

  constructor(config: ProviderConfig['sendgrid']) {
    super();
    this.apiKey = config?.apiKey || '';
  }

  async send(email: Email): Promise<SendResult> {
    try {
      const toAddresses = Array.isArray(email.to) ? email.to : [email.to];

      const payload = {
        personalizations: [{
          to: toAddresses.map((t: { email: string; name?: string }) => ({ email: t.email, name: t.name })),
          cc: email.cc?.map((c: { email: string; name?: string }) => ({ email: c.email, name: c.name })),
          bcc: email.bcc?.map((b: { email: string; name?: string }) => ({ email: b.email, name: b.name })),
        }],
        from: { email: email.from.email, name: email.from.name },
        reply_to: email.replyTo ? { email: email.replyTo.email, name: email.replyTo.name } : undefined,
        subject: email.subject,
        content: [
          email.text ? { type: 'text/plain', value: email.text } : null,
          email.html ? { type: 'text/html', value: email.html } : null,
        ].filter(Boolean),
        attachments: email.attachments?.map((a: { content: string | Buffer; filename: string; contentType?: string }) => ({
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          filename: a.filename,
          type: a.contentType,
          disposition: 'attachment',
        })),
        headers: email.headers,
      };

      const response = await this.makeRequest('/mail/send', payload);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        const messageId = response.headers['x-message-id'];
        return {
          success: true,
          messageId,
          provider: this.name,
        };
      }

      return {
        success: false,
        error: `SendGrid error: ${response.statusCode}`,
        provider: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        provider: this.name,
      };
    }
  }

  private async makeRequest(endpoint: string, body: unknown): Promise<SendGridResponse> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return {
      statusCode: response.status,
      body: await response.text(),
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  async verify(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
