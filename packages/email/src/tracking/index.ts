/**
 * Email Tracking Index
 */

export { EmailTracker, emailTracker } from './tracker.js';
export type { TrackingConfig, TrackingPixelResult, TrackedLink } from './tracker.js';

export { WebhookHandler, webhookHandler } from './webhooks.js';
export type { WebhookPayload, SESNotification, SendGridEvent } from './webhooks.js';
