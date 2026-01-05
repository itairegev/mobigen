/**
 * Email Provider Webhooks Handler
 */

import type { EmailTrackingEvent } from '../types.js';
import { emailTracker } from './tracker.js';

export interface WebhookPayload {
  provider: 'ses' | 'sendgrid' | 'smtp';
  rawPayload: unknown;
}

export interface SESNotification {
  notificationType: 'Bounce' | 'Complaint' | 'Delivery';
  mail: {
    messageId: string;
    timestamp: string;
  };
  bounce?: {
    bounceType: string;
    bouncedRecipients: Array<{ emailAddress: string }>;
  };
  complaint?: {
    complainedRecipients: Array<{ emailAddress: string }>;
  };
  delivery?: {
    recipients: string[];
  };
}

export interface SendGridEvent {
  event: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport';
  sg_message_id: string;
  timestamp: number;
  email: string;
  url?: string;
}

export class WebhookHandler {
  async handleSESWebhook(notification: SESNotification): Promise<EmailTrackingEvent | null> {
    const messageId = notification.mail.messageId;

    switch (notification.notificationType) {
      case 'Delivery':
        return emailTracker.recordEvent({
          messageId,
          event: 'delivered',
          metadata: { recipients: notification.delivery?.recipients },
        });

      case 'Bounce':
        return emailTracker.recordEvent({
          messageId,
          event: 'bounced',
          metadata: {
            bounceType: notification.bounce?.bounceType,
            recipients: notification.bounce?.bouncedRecipients.map(r => r.emailAddress),
          },
        });

      case 'Complaint':
        return emailTracker.recordEvent({
          messageId,
          event: 'complained',
          metadata: {
            recipients: notification.complaint?.complainedRecipients.map(r => r.emailAddress),
          },
        });

      default:
        return null;
    }
  }

  async handleSendGridWebhook(events: SendGridEvent[]): Promise<EmailTrackingEvent[]> {
    const results: EmailTrackingEvent[] = [];

    for (const event of events) {
      const messageId = event.sg_message_id;
      let trackingEvent: EmailTrackingEvent | null = null;

      switch (event.event) {
        case 'delivered':
          trackingEvent = await emailTracker.recordEvent({
            messageId,
            event: 'delivered',
            metadata: { email: event.email },
          });
          break;

        case 'open':
          trackingEvent = await emailTracker.recordEvent({
            messageId,
            event: 'opened',
            metadata: { email: event.email },
          });
          break;

        case 'click':
          trackingEvent = await emailTracker.recordEvent({
            messageId,
            event: 'clicked',
            metadata: { email: event.email, url: event.url },
          });
          break;

        case 'bounce':
        case 'dropped':
          trackingEvent = await emailTracker.recordEvent({
            messageId,
            event: 'bounced',
            metadata: { email: event.email, originalEvent: event.event },
          });
          break;

        case 'spamreport':
          trackingEvent = await emailTracker.recordEvent({
            messageId,
            event: 'complained',
            metadata: { email: event.email },
          });
          break;
      }

      if (trackingEvent) {
        results.push(trackingEvent);
      }
    }

    return results;
  }

  async processWebhook(payload: WebhookPayload): Promise<EmailTrackingEvent[]> {
    switch (payload.provider) {
      case 'ses':
        const sesResult = await this.handleSESWebhook(payload.rawPayload as SESNotification);
        return sesResult ? [sesResult] : [];

      case 'sendgrid':
        return this.handleSendGridWebhook(payload.rawPayload as SendGridEvent[]);

      default:
        console.warn(`Unknown webhook provider: ${payload.provider}`);
        return [];
    }
  }
}

export const webhookHandler = new WebhookHandler();
