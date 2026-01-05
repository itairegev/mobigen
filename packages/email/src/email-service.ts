/**
 * Main Email Service
 * Coordinates providers, templates, and tracking
 */

import { createProvider, type BaseEmailProvider } from './providers/index.js';
import { TemplateEngine, templateEngine, builtinTemplates } from './templates/index.js';
import { EmailTracker, emailTracker } from './tracking/index.js';
import type {
  Email,
  SendResult,
  BulkSendResult,
  ProviderConfig,
  EmailTemplate,
} from './types.js';

export interface EmailServiceConfig {
  provider: ProviderConfig;
  tracking?: {
    enabled?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    webhookUrl?: string;
  };
  defaultFrom?: {
    email: string;
    name?: string;
  };
  templates?: EmailTemplate[];
}

export interface SendEmailOptions {
  templateId?: string;
  templateData?: Record<string, unknown>;
  tracking?: boolean;
}

export class EmailService {
  private provider: BaseEmailProvider;
  private templateEngine: TemplateEngine;
  private tracker: EmailTracker;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.provider = createProvider(config.provider);
    this.templateEngine = templateEngine;
    this.tracker = new EmailTracker(config.tracking);

    // Register built-in templates
    for (const template of builtinTemplates) {
      this.templateEngine.registerTemplate(template);
    }

    // Register custom templates
    if (config.templates) {
      for (const template of config.templates) {
        this.templateEngine.registerTemplate(template);
      }
    }
  }

  async send(email: Email, options: SendEmailOptions = {}): Promise<SendResult> {
    let processedEmail = { ...email };

    // Apply default from if not provided
    if (!processedEmail.from && this.config.defaultFrom) {
      processedEmail.from = this.config.defaultFrom;
    }

    // Apply template if specified
    if (options.templateId) {
      const rendered = this.templateEngine.render(
        options.templateId,
        {
          ...options.templateData,
          year: new Date().getFullYear(),
        }
      );
      processedEmail = {
        ...processedEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      };
    }

    // Generate message ID for tracking
    const messageId = this.generateMessageId();

    // Apply tracking if enabled
    if (options.tracking !== false && this.config.tracking?.enabled) {
      if (processedEmail.html) {
        processedEmail.html = this.tracker.processHtmlForTracking(
          processedEmail.html,
          messageId
        );
      }
    }

    // Send the email
    const result = await this.provider.send(processedEmail);

    // Record sent event
    if (result.success) {
      await this.tracker.recordEvent({
        messageId: result.messageId || messageId,
        event: 'sent',
        metadata: {
          to: email.to,
          subject: processedEmail.subject,
          templateId: options.templateId,
        },
      });
    }

    return {
      ...result,
      messageId: result.messageId || messageId,
    };
  }

  async sendBulk(
    emails: Array<{ email: Email; options?: SendEmailOptions }>
  ): Promise<BulkSendResult> {
    const results = await Promise.all(
      emails.map(({ email, options }) => this.send(email, options))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  async sendWithTemplate(
    to: Email['to'],
    templateId: string,
    data: Record<string, unknown>,
    overrides?: Partial<Email>
  ): Promise<SendResult> {
    const email: Email = {
      to,
      from: this.config.defaultFrom || { email: 'noreply@example.com' },
      subject: '', // Will be set by template
      ...overrides,
    };

    return this.send(email, {
      templateId,
      templateData: data,
    });
  }

  // Template management
  registerTemplate(template: EmailTemplate): void {
    this.templateEngine.registerTemplate(template);
  }

  getTemplate(templateId: string) {
    return this.templateEngine.getTemplate(templateId);
  }

  listTemplates() {
    return this.templateEngine.listTemplates();
  }

  // Tracking
  getTrackingEvents(messageId?: string) {
    return this.tracker.getEvents(messageId);
  }

  getMessageStats(messageId: string) {
    return this.tracker.getMessageStats(messageId);
  }

  onTrackingEvent(listener: (event: import('./types.js').EmailTrackingEvent) => void) {
    return this.tracker.onEvent(listener);
  }

  // Provider management
  async verifyProvider(): Promise<boolean> {
    return this.provider.verify();
  }

  getProviderName(): string {
    return this.provider.name;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Factory function
export function createEmailService(config: EmailServiceConfig): EmailService {
  return new EmailService(config);
}
