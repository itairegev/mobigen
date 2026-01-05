/**
 * Email Service Types
 */

import { z } from 'zod';

export const EmailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const EmailSchema = z.object({
  to: z.union([EmailAddressSchema, z.array(EmailAddressSchema)]),
  from: EmailAddressSchema,
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  replyTo: EmailAddressSchema.optional(),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.union([z.string(), z.instanceof(Buffer)]),
    contentType: z.string().optional(),
  })).optional(),
  headers: z.record(z.string()).optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.unknown()).optional(),
});

export type EmailAddress = z.infer<typeof EmailAddressSchema>;
export type Email = z.infer<typeof EmailSchema>;

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}

export type EmailProvider = 'ses' | 'sendgrid' | 'smtp';

export interface ProviderConfig {
  provider: EmailProvider;
  ses?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailTrackingEvent {
  id: string;
  messageId: string;
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}
