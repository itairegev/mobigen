/**
 * Email Providers Index
 */

export { BaseEmailProvider } from './base-provider.js';
export { SMTPProvider } from './smtp-provider.js';
export { SESProvider } from './ses-provider.js';
export { SendGridProvider } from './sendgrid-provider.js';

import { SMTPProvider } from './smtp-provider.js';
import { SESProvider } from './ses-provider.js';
import { SendGridProvider } from './sendgrid-provider.js';
import type { BaseEmailProvider } from './base-provider.js';
import type { ProviderConfig, EmailProvider } from '../types.js';

export function createProvider(config: ProviderConfig): BaseEmailProvider {
  switch (config.provider) {
    case 'smtp':
      return new SMTPProvider(config.smtp);
    case 'ses':
      return new SESProvider(config.ses);
    case 'sendgrid':
      return new SendGridProvider(config.sendgrid);
    default:
      throw new Error(`Unknown email provider: ${config.provider}`);
  }
}

export type { EmailProvider };
