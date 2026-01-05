/**
 * @mobigen/email - Email Service Package
 *
 * A complete email solution supporting multiple providers,
 * templating, and tracking for Mobigen generated apps.
 */

// Main service
export { EmailService, createEmailService } from './email-service.js';
export type { EmailServiceConfig, SendEmailOptions } from './email-service.js';

// Types
export {
  EmailSchema,
  EmailAddressSchema,
  type Email,
  type EmailAddress,
  type SendResult,
  type BulkSendResult,
  type EmailProvider,
  type ProviderConfig,
  type EmailTrackingEvent,
  type EmailTemplate,
} from './types.js';

// Providers
export {
  BaseEmailProvider,
  SMTPProvider,
  SESProvider,
  SendGridProvider,
  createProvider,
} from './providers/index.js';

// Templates
export {
  TemplateEngine,
  templateEngine,
  welcomeTemplate,
  passwordResetTemplate,
  verificationTemplate,
  builtinTemplates,
} from './templates/index.js';
export type { CompiledTemplate, RenderResult } from './templates/index.js';

// Tracking
export {
  EmailTracker,
  emailTracker,
  WebhookHandler,
  webhookHandler,
} from './tracking/index.js';
export type {
  TrackingConfig,
  TrackingPixelResult,
  TrackedLink,
  WebhookPayload,
} from './tracking/index.js';
