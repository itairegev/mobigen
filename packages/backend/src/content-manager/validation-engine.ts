/**
 * Validation Engine
 *
 * Generates Zod schemas from resource definitions and validates content data.
 * Provides runtime validation for CRUD operations.
 */

import { z, type ZodSchema, type ZodIssue } from 'zod';
import type {
  ResourceDefinition,
  ContentAttributeDefinition,
  ValidationRules,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

export interface ValidationEngineConfig {
  strictMode?: boolean; // Fail on unknown fields
  coerceTypes?: boolean; // Try to coerce types (string -> number)
  stripUnknown?: boolean; // Remove unknown fields
}

// ============================================================================
// VALIDATION ENGINE CLASS
// ============================================================================

export class ValidationEngine {
  private schemaCache: Map<string, ZodSchema> = new Map();
  private partialSchemaCache: Map<string, ZodSchema> = new Map();
  private config: ValidationEngineConfig;

  constructor(config: ValidationEngineConfig = {}) {
    this.config = {
      strictMode: false,
      coerceTypes: true,
      stripUnknown: true,
      ...config,
    };
  }

  /**
   * Validate data against a resource definition
   */
  async validate(
    resourceName: string,
    data: Record<string, unknown>,
    isPartial = false
  ): Promise<void> {
    const schema = this.getSchema(resourceName);
    const schemaToUse = isPartial ? this.makePartial(resourceName, schema) : schema;

    const result = schemaToUse.safeParse(data);

    if (!result.success) {
      const errors = this.formatZodErrors(result.error.issues);
      throw new ValidationEngineError('Validation failed', errors);
    }
  }

  /**
   * Validate and transform data (returns cleaned data)
   */
  async validateAndTransform(
    resourceName: string,
    data: Record<string, unknown>,
    isPartial = false
  ): Promise<Record<string, unknown>> {
    const schema = this.getSchema(resourceName);
    const schemaToUse = isPartial ? this.makePartial(resourceName, schema) : schema;

    const result = schemaToUse.safeParse(data);

    if (!result.success) {
      const errors = this.formatZodErrors(result.error.issues);
      throw new ValidationEngineError('Validation failed', errors);
    }

    return result.data;
  }

  /**
   * Build and cache a Zod schema for a resource
   */
  buildSchema(resourceDef: ResourceDefinition): ZodSchema {
    const cacheKey = resourceDef.name;

    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey)!;
    }

    const shape: Record<string, ZodSchema> = {};

    for (const attr of resourceDef.attributes) {
      const fieldSchema = this.buildFieldSchema(attr);
      shape[attr.name] = fieldSchema;
    }

    let schema: ZodSchema = z.object(shape);

    if (this.config.stripUnknown) {
      schema = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).strip();
    } else if (this.config.strictMode) {
      schema = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).strict();
    } else {
      schema = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).passthrough();
    }

    this.schemaCache.set(cacheKey, schema);
    return schema;
  }

  /**
   * Get cached schema for a resource
   */
  getSchema(resourceName: string): ZodSchema {
    const schema = this.schemaCache.get(resourceName);
    if (!schema) {
      throw new Error(`No schema found for resource: ${resourceName}. Call buildSchema first.`);
    }
    return schema;
  }

  /**
   * Clear schema cache
   */
  clearCache(): void {
    this.schemaCache.clear();
    this.partialSchemaCache.clear();
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Build a Zod schema for a single field
   */
  private buildFieldSchema(attr: ContentAttributeDefinition): ZodSchema {
    let schema: ZodSchema;

    // Start with base type
    switch (attr.type) {
      case 'string':
        schema = this.buildStringSchema(attr);
        break;

      case 'number':
        schema = this.buildNumberSchema(attr);
        break;

      case 'boolean':
        schema = this.config.coerceTypes ? z.coerce.boolean() : z.boolean();
        break;

      case 'list':
        schema = this.buildListSchema(attr);
        break;

      case 'map':
        schema = z.record(z.unknown());
        break;

      case 'binary':
        schema = z.string(); // Base64 encoded
        break;

      default:
        schema = z.unknown();
    }

    // Handle optional/required
    if (!attr.required) {
      schema = schema.optional().nullable();
    }

    return schema;
  }

  /**
   * Build a string field schema with validation rules
   */
  private buildStringSchema(attr: ContentAttributeDefinition): ZodSchema {
    let schema: z.ZodTypeAny = this.config.coerceTypes ? z.coerce.string() : z.string();

    const rules = attr.validation;

    if (rules?.minLength !== undefined) {
      schema = (schema as z.ZodString).min(rules.minLength, {
        message: `Must be at least ${rules.minLength} characters`,
      });
    }

    if (rules?.maxLength !== undefined) {
      schema = (schema as z.ZodString).max(rules.maxLength, {
        message: `Must be at most ${rules.maxLength} characters`,
      });
    }

    if (rules?.pattern) {
      const regex = new RegExp(rules.pattern);
      schema = (schema as z.ZodString).regex(regex, {
        message: rules.patternMessage || `Must match pattern: ${rules.pattern}`,
      });
    }

    // Special validations based on UI component
    switch (attr.uiComponent) {
      case 'richtext':
      case 'textarea':
        // Allow longer strings
        if (!rules?.maxLength) {
          schema = (schema as z.ZodString).max(100000);
        }
        break;

      case 'image':
      case 'images':
        // Must be a valid URL
        schema = (schema as z.ZodString).url({ message: 'Must be a valid URL' }).or(z.string().length(0));
        break;

      case 'color':
        // Must be a valid hex color
        schema = (schema as z.ZodString).regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
          message: 'Must be a valid hex color (e.g., #FF0000)',
        });
        break;

      case 'date':
        // Must be a valid date string
        schema = schema.refine(
          (val: string) => !val || !isNaN(Date.parse(val)),
          { message: 'Must be a valid date' }
        );
        break;

      case 'datetime':
        // Must be a valid ISO datetime string
        schema = (schema as z.ZodString).datetime({ message: 'Must be a valid ISO datetime' }).or(z.string().length(0));
        break;
    }

    return schema;
  }

  /**
   * Build a number field schema with validation rules
   */
  private buildNumberSchema(attr: ContentAttributeDefinition): ZodSchema {
    let schema = this.config.coerceTypes ? z.coerce.number() : z.number();

    const rules = attr.validation;

    if (rules?.min !== undefined) {
      schema = schema.min(rules.min, {
        message: `Must be at least ${rules.min}`,
      });
    }

    if (rules?.max !== undefined) {
      schema = schema.max(rules.max, {
        message: `Must be at most ${rules.max}`,
      });
    }

    // Special validations based on UI component
    if (attr.uiComponent === 'currency') {
      // Allow decimal places for currency
      schema = schema.multipleOf(0.01);
    }

    return schema;
  }

  /**
   * Build a list/array field schema
   */
  private buildListSchema(attr: ContentAttributeDefinition): ZodSchema {
    // Determine item type
    let itemSchema: ZodSchema = z.unknown();

    // Check if we have options (for multiselect)
    if (attr.options && attr.options.length > 0) {
      const validValues = attr.options.map((opt) => opt.value);
      itemSchema = z.enum(validValues as [string, ...string[]]);
    } else {
      // Default to string array
      itemSchema = z.string();
    }

    let schema = z.array(itemSchema);

    // Apply validation rules
    const rules = attr.validation;

    if (rules?.minLength !== undefined) {
      schema = schema.min(rules.minLength, {
        message: `Must have at least ${rules.minLength} items`,
      });
    }

    if (rules?.maxLength !== undefined) {
      schema = schema.max(rules.maxLength, {
        message: `Must have at most ${rules.maxLength} items`,
      });
    }

    return schema;
  }

  /**
   * Make a schema partial (for updates)
   */
  private makePartial(resourceName: string, schema: ZodSchema): ZodSchema {
    const cacheKey = `${resourceName}:partial`;

    if (this.partialSchemaCache.has(cacheKey)) {
      return this.partialSchemaCache.get(cacheKey)!;
    }

    const partialSchema = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).partial();
    this.partialSchemaCache.set(cacheKey, partialSchema);

    return partialSchema;
  }

  /**
   * Format Zod errors into ValidationErrors
   */
  private formatZodErrors(issues: ZodIssue[]): ValidationError[] {
    return issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      received: (issue as { received?: unknown }).received,
    }));
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class ValidationEngineError extends Error {
  errors: ValidationError[];

  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationEngineError';
    this.errors = errors;
  }

  /**
   * Get a formatted error message
   */
  getFormattedMessage(): string {
    return this.errors
      .map((e) => `${e.field}: ${e.message}`)
      .join('; ');
  }
}

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Custom validator registry
 */
const customValidators: Map<string, (value: unknown, data: Record<string, unknown>) => boolean | string> = new Map();

/**
 * Register a custom validator
 */
export function registerValidator(
  name: string,
  validator: (value: unknown, data: Record<string, unknown>) => boolean | string
): void {
  customValidators.set(name, validator);
}

/**
 * Get a custom validator
 */
export function getValidator(name: string): ((value: unknown, data: Record<string, unknown>) => boolean | string) | undefined {
  return customValidators.get(name);
}

// Register built-in custom validators
registerValidator('email', (value) => {
  if (typeof value !== 'string') return 'Must be a string';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) || 'Must be a valid email address';
});

registerValidator('phone', (value) => {
  if (typeof value !== 'string') return 'Must be a string';
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(value) || 'Must be a valid phone number';
});

registerValidator('url', (value) => {
  if (typeof value !== 'string') return 'Must be a string';
  try {
    new URL(value);
    return true;
  } catch {
    return 'Must be a valid URL';
  }
});

registerValidator('slug', (value) => {
  if (typeof value !== 'string') return 'Must be a string';
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(value) || 'Must be a valid URL slug (lowercase letters, numbers, hyphens)';
});

registerValidator('uuid', (value) => {
  if (typeof value !== 'string') return 'Must be a string';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) || 'Must be a valid UUID';
});

registerValidator('json', (value) => {
  if (typeof value !== 'string') return true; // Already parsed
  try {
    JSON.parse(value);
    return true;
  } catch {
    return 'Must be valid JSON';
  }
});

registerValidator('future_date', (value) => {
  if (!value) return true;
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return 'Must be a valid date';
  return date > new Date() || 'Must be a future date';
});

registerValidator('past_date', (value) => {
  if (!value) return true;
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return 'Must be a valid date';
  return date < new Date() || 'Must be a past date';
});

registerValidator('positive', (value) => {
  if (typeof value !== 'number') return 'Must be a number';
  return value > 0 || 'Must be a positive number';
});

registerValidator('non_negative', (value) => {
  if (typeof value !== 'number') return 'Must be a number';
  return value >= 0 || 'Must be zero or positive';
});

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a validation engine with schemas for given resources
 */
export function createValidationEngine(
  resources: ResourceDefinition[],
  config?: ValidationEngineConfig
): ValidationEngine {
  const engine = new ValidationEngine(config);

  for (const resource of resources) {
    engine.buildSchema(resource);
  }

  return engine;
}

// ============================================================================
// STANDALONE VALIDATION HELPERS
// ============================================================================

/**
 * Quick validation without engine instance
 */
export function validateField(
  value: unknown,
  attr: ContentAttributeDefinition
): ValidationResult {
  const engine = new ValidationEngine();
  const tempResource: ResourceDefinition = {
    name: 'temp',
    singularName: 'temp',
    pluralName: 'temps',
    attributes: [attr],
    titleField: attr.name,
  };

  engine.buildSchema(tempResource);

  try {
    const schema = engine.getSchema('temp');
    const result = schema.safeParse({ [attr.name]: value });

    if (result.success) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: result.error.issues.map((issue: ZodIssue) => ({
        field: attr.name,
        message: issue.message,
        code: issue.code,
        received: (issue as unknown as { received?: unknown }).received,
      })),
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{
        field: attr.name,
        message: error instanceof Error ? error.message : 'Validation failed',
        code: 'custom',
      }],
    };
  }
}

/**
 * Sanitize data by removing dangerous content
 */
export function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip internal fields
    if (key.startsWith('_') || ['pk', 'sk'].includes(key)) {
      continue;
    }

    if (typeof value === 'string') {
      // Basic XSS prevention for string fields
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeData(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
