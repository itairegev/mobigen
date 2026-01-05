/**
 * AWS SES Email Provider
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { BaseEmailProvider } from './base-provider.js';
import type { Email, SendResult, ProviderConfig } from '../types.js';

export class SESProvider extends BaseEmailProvider {
  readonly name = 'ses';
  private client: SESClient;

  constructor(config: ProviderConfig['ses']) {
    super();
    this.client = new SESClient({
      region: config?.region || 'us-east-1',
      credentials: config?.accessKeyId ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey!,
      } : undefined,
    });
  }

  async send(email: Email): Promise<SendResult> {
    try {
      const toAddresses = Array.isArray(email.to)
        ? email.to.map((t: { email: string; name?: string }) => t.name ? `${t.name} <${t.email}>` : t.email)
        : [email.to.name ? `${email.to.name} <${email.to.email}>` : email.to.email];

      const command = new SendEmailCommand({
        Source: email.from.name ? `${email.from.name} <${email.from.email}>` : email.from.email,
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: email.cc?.map((c: { email: string; name?: string }) => c.name ? `${c.name} <${c.email}>` : c.email),
          BccAddresses: email.bcc?.map((b: { email: string; name?: string }) => b.name ? `${b.name} <${b.email}>` : b.email),
        },
        Message: {
          Subject: { Data: email.subject },
          Body: {
            Html: email.html ? { Data: email.html } : undefined,
            Text: email.text ? { Data: email.text } : undefined,
          },
        },
        ReplyToAddresses: email.replyTo
          ? [email.replyTo.name ? `${email.replyTo.name} <${email.replyTo.email}>` : email.replyTo.email]
          : undefined,
      });

      const result = await this.client.send(command);
      return {
        success: true,
        messageId: result.MessageId,
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

  async verify(): Promise<boolean> {
    try {
      // Simple health check - would verify identity in production
      return true;
    } catch {
      return false;
    }
  }
}
