/**
 * SMTP Email Provider using Nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { BaseEmailProvider } from './base-provider.js';
import type { Email, SendResult, ProviderConfig } from '../types.js';

export class SMTPProvider extends BaseEmailProvider {
  readonly name = 'smtp';
  private transporter: Transporter;

  constructor(config: ProviderConfig['smtp']) {
    super();
    this.transporter = nodemailer.createTransport({
      host: config?.host || 'localhost',
      port: config?.port || 587,
      secure: config?.secure ?? false,
      auth: config?.auth,
    });
  }

  async send(email: Email): Promise<SendResult> {
    try {
      const toAddresses = Array.isArray(email.to)
        ? email.to.map((t: { email: string; name?: string }) => t.name ? `${t.name} <${t.email}>` : t.email)
        : [email.to.name ? `${email.to.name} <${email.to.email}>` : email.to.email];

      const result = await this.transporter.sendMail({
        from: email.from.name ? `${email.from.name} <${email.from.email}>` : email.from.email,
        to: toAddresses.join(', '),
        cc: email.cc?.map((c: { email: string; name?: string }) => c.name ? `${c.name} <${c.email}>` : c.email).join(', '),
        bcc: email.bcc?.map((b: { email: string; name?: string }) => b.name ? `${b.name} <${b.email}>` : b.email).join(', '),
        replyTo: email.replyTo
          ? (email.replyTo.name ? `${email.replyTo.name} <${email.replyTo.email}>` : email.replyTo.email)
          : undefined,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments?.map((a: { filename: string; content: string | Buffer; contentType?: string }) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
        headers: email.headers,
      });

      return {
        success: true,
        messageId: result.messageId,
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
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
