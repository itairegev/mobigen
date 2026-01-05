/**
 * Email Tracking Service
 */

import type { EmailTrackingEvent } from '../types.js';

export interface TrackingConfig {
  enabled: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  webhookUrl?: string;
}

export interface TrackingPixelResult {
  html: string;
  url: string;
}

export interface TrackedLink {
  originalUrl: string;
  trackedUrl: string;
}

type EventListener = (event: EmailTrackingEvent) => void | Promise<void>;

export class EmailTracker {
  private config: TrackingConfig;
  private events: EmailTrackingEvent[] = [];
  private listeners: EventListener[] = [];
  private baseUrl: string;

  constructor(config: Partial<TrackingConfig> = {}, baseUrl = 'https://track.mobigen.io') {
    this.config = {
      enabled: config.enabled ?? true,
      trackOpens: config.trackOpens ?? true,
      trackClicks: config.trackClicks ?? true,
      webhookUrl: config.webhookUrl,
    };
    this.baseUrl = baseUrl;
  }

  generateTrackingPixel(messageId: string): TrackingPixelResult {
    if (!this.config.enabled || !this.config.trackOpens) {
      return { html: '', url: '' };
    }

    const url = `${this.baseUrl}/open/${messageId}`;
    const html = `<img src="${url}" width="1" height="1" style="display:none" alt="" />`;

    return { html, url };
  }

  wrapLink(originalUrl: string, messageId: string, linkId: string): TrackedLink {
    if (!this.config.enabled || !this.config.trackClicks) {
      return { originalUrl, trackedUrl: originalUrl };
    }

    const encoded = encodeURIComponent(originalUrl);
    const trackedUrl = `${this.baseUrl}/click/${messageId}/${linkId}?url=${encoded}`;

    return { originalUrl, trackedUrl };
  }

  processHtmlForTracking(html: string, messageId: string): string {
    if (!this.config.enabled) {
      return html;
    }

    let processed = html;
    let linkIndex = 0;

    // Track links
    if (this.config.trackClicks) {
      processed = processed.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (_match, url) => {
          const linkId = `link_${linkIndex++}`;
          const { trackedUrl } = this.wrapLink(url, messageId, linkId);
          return `href="${trackedUrl}"`;
        }
      );
    }

    // Add tracking pixel
    if (this.config.trackOpens) {
      const { html: pixel } = this.generateTrackingPixel(messageId);
      if (pixel) {
        processed = processed.replace('</body>', `${pixel}</body>`);
      }
    }

    return processed;
  }

  async recordEvent(event: Omit<EmailTrackingEvent, 'id' | 'timestamp'>): Promise<EmailTrackingEvent> {
    const trackingEvent: EmailTrackingEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    this.events.push(trackingEvent);

    // Notify listeners
    await Promise.all(this.listeners.map(listener => listener(trackingEvent)));

    // Send webhook if configured
    if (this.config.webhookUrl) {
      await this.sendWebhook(trackingEvent);
    }

    return trackingEvent;
  }

  onEvent(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getEvents(messageId?: string): EmailTrackingEvent[] {
    if (messageId) {
      return this.events.filter(e => e.messageId === messageId);
    }
    return [...this.events];
  }

  getEventsByType(eventType: EmailTrackingEvent['event']): EmailTrackingEvent[] {
    return this.events.filter(e => e.event === eventType);
  }

  getMessageStats(messageId: string): {
    sent: boolean;
    delivered: boolean;
    opened: boolean;
    clicked: boolean;
    bounced: boolean;
    complained: boolean;
  } {
    const events = this.getEvents(messageId);
    return {
      sent: events.some(e => e.event === 'sent'),
      delivered: events.some(e => e.event === 'delivered'),
      opened: events.some(e => e.event === 'opened'),
      clicked: events.some(e => e.event === 'clicked'),
      bounced: events.some(e => e.event === 'bounced'),
      complained: events.some(e => e.event === 'complained'),
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async sendWebhook(event: EmailTrackingEvent): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send tracking webhook:', error);
    }
  }
}

export const emailTracker = new EmailTracker();
