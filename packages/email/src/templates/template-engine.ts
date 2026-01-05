/**
 * Email Template Engine using Handlebars
 */

import Handlebars from 'handlebars';
import type { EmailTemplate } from '../types.js';

export interface CompiledTemplate {
  id: string;
  name: string;
  subject: Handlebars.TemplateDelegate;
  html: Handlebars.TemplateDelegate;
  text?: Handlebars.TemplateDelegate;
  variables: string[];
}

export interface RenderResult {
  subject: string;
  html: string;
  text?: string;
}

export class TemplateEngine {
  private templates = new Map<string, CompiledTemplate>();
  private partials = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      if (format === 'time') {
        return d.toLocaleTimeString();
      }
      return d.toLocaleString();
    });

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    // Pluralize helper
    Handlebars.registerHelper('pluralize', (count: number, singular: string, plural?: string) => {
      return count === 1 ? singular : (plural || `${singular}s`);
    });
  }

  registerPartial(name: string, template: string): void {
    const compiled = Handlebars.compile(template);
    this.partials.set(name, compiled);
    Handlebars.registerPartial(name, template);
  }

  registerTemplate(template: EmailTemplate): void {
    const compiled: CompiledTemplate = {
      id: template.id,
      name: template.name,
      subject: Handlebars.compile(template.subject),
      html: Handlebars.compile(template.html),
      text: template.text ? Handlebars.compile(template.text) : undefined,
      variables: template.variables,
    };
    this.templates.set(template.id, compiled);
  }

  render(templateId: string, data: Record<string, unknown>): RenderResult {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required variables
    for (const variable of template.variables) {
      if (data[variable] === undefined) {
        throw new Error(`Missing required variable: ${variable}`);
      }
    }

    return {
      subject: template.subject(data),
      html: template.html(data),
      text: template.text ? template.text(data) : undefined,
    };
  }

  renderInline(
    subject: string,
    html: string,
    data: Record<string, unknown>,
    text?: string
  ): RenderResult {
    const subjectTemplate = Handlebars.compile(subject);
    const htmlTemplate = Handlebars.compile(html);
    const textTemplate = text ? Handlebars.compile(text) : undefined;

    return {
      subject: subjectTemplate(data),
      html: htmlTemplate(data),
      text: textTemplate ? textTemplate(data) : undefined,
    };
  }

  getTemplate(templateId: string): CompiledTemplate | undefined {
    return this.templates.get(templateId);
  }

  listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      subject: '',
      html: '',
      variables: t.variables,
    }));
  }

  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }
}

export const templateEngine = new TemplateEngine();
