/**
 * Template Schema Registry
 *
 * Exports schema definitions for all supported template types
 */

export * from './types';

import { ecommerceSchema } from './ecommerce';
import { loyaltySchema } from './loyalty';
import { newsSchema } from './news';
import { socialSchema } from './social';
import { financeSchema } from './finance';
import { bookingSchema } from './booking';
import { aiAssistantSchema } from './ai-assistant';
import type { TemplateSchema } from './types';

/**
 * Registry of all template schemas
 */
export const templateSchemas: Record<string, TemplateSchema> = {
  ecommerce: ecommerceSchema,
  loyalty: loyaltySchema,
  news: newsSchema,
  social: socialSchema,
  finance: financeSchema,
  booking: bookingSchema,
  'ai-assistant': aiAssistantSchema,
};

/**
 * Get schema for a specific template
 *
 * @throws Error if template not found
 */
export function getSchemaForTemplate(templateId: string): TemplateSchema {
  const schema = templateSchemas[templateId];
  if (!schema) {
    throw new Error(`No schema defined for template: ${templateId}. Available templates: ${Object.keys(templateSchemas).join(', ')}`);
  }
  return schema;
}

/**
 * Check if a template has a schema defined
 */
export function hasSchemaForTemplate(templateId: string): boolean {
  return templateId in templateSchemas;
}

/**
 * Get all available template IDs
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(templateSchemas);
}

// Re-export individual schemas for direct imports
export { ecommerceSchema } from './ecommerce';
export { loyaltySchema } from './loyalty';
export { newsSchema } from './news';
export { socialSchema } from './social';
export { financeSchema } from './finance';
export { bookingSchema } from './booking';
export { aiAssistantSchema } from './ai-assistant';
