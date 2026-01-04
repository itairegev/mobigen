/**
 * Abstract base class for all connectors
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import type {
  ConnectorDefinition,
  ConnectorMetadata,
  ConnectorCredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  CodeGenContext,
} from './types';

/**
 * Abstract base class for all connectors.
 *
 * Extend this class to create a new connector:
 *
 * @example
 * ```typescript
 * export class StripeConnector extends BaseConnector {
 *   constructor() {
 *     super({
 *       metadata: {
 *         id: 'stripe',
 *         name: 'Stripe',
 *         // ... other metadata
 *       },
 *       credentialFields: [
 *         {
 *           key: 'publishableKey',
 *           label: 'Publishable Key',
 *           type: 'text',
 *           required: true,
 *           validation: z.string().startsWith('pk_'),
 *         },
 *       ],
 *       dependencies: [
 *         { package: '@stripe/stripe-react-native', version: '^0.37.0' },
 *       ],
 *       envVars: [
 *         {
 *           key: 'STRIPE_PUBLISHABLE_KEY',
 *           credentialKey: 'publishableKey',
 *           required: true,
 *         },
 *       ],
 *       generatedFiles: [
 *         {
 *           path: 'src/services/stripe.ts',
 *           template: (ctx) => generateStripeService(ctx),
 *         },
 *       ],
 *     });
 *   }
 *
 *   async validateCredentials(credentials: Record<string, string>) {
 *     return this.validateWithSchema(credentials);
 *   }
 *
 *   async testConnection(credentials: Record<string, string>) {
 *     // Test Stripe API connection
 *     const stripe = new Stripe(credentials.secretKey);
 *     await stripe.paymentMethods.list({ limit: 1 });
 *     return { success: true, durationMs: 123 };
 *   }
 * }
 * ```
 */
export abstract class BaseConnector implements ConnectorDefinition {
  /** Connector metadata */
  public readonly metadata: ConnectorMetadata;

  /** Credential fields for setup */
  public readonly credentialFields: ConnectorCredentialField[];

  /** NPM dependencies */
  public readonly dependencies: ConnectorDependency[];

  /** Environment variables */
  public readonly envVars: ConnectorEnvVar[];

  /** Files to generate */
  public readonly generatedFiles: GeneratedFile[];

  /**
   * Create a new connector instance
   *
   * @param config - Connector configuration (excludes validation and test methods)
   */
  constructor(
    config: Omit<ConnectorDefinition, 'validateCredentials' | 'testConnection'>
  ) {
    this.metadata = config.metadata;
    this.credentialFields = config.credentialFields;
    this.dependencies = config.dependencies;
    this.envVars = config.envVars;
    this.generatedFiles = config.generatedFiles;
  }

  /**
   * Validate credentials format and requirements.
   *
   * Must be implemented by subclasses.
   *
   * @param credentials - User-provided credentials
   * @returns Validation result with any errors
   */
  abstract validateCredentials(
    credentials: Record<string, string>
  ): Promise<ValidationResult>;

  /**
   * Test connection with provided credentials.
   *
   * Must be implemented by subclasses.
   *
   * @param credentials - User-provided credentials
   * @returns Connection test result
   */
  abstract testConnection(
    credentials: Record<string, string>
  ): Promise<ConnectionTestResult>;

  /**
   * Hook called after successful installation.
   *
   * Optional - override to perform post-install tasks.
   *
   * @param context - Code generation context
   */
  async onInstall?(context: CodeGenContext): Promise<void>;

  /**
   * Hook called before uninstallation.
   *
   * Optional - override to perform cleanup tasks.
   *
   * @param context - Code generation context
   */
  async onUninstall?(context: CodeGenContext): Promise<void>;

  /**
   * Get Zod schema for credential validation
   *
   * @returns Zod schema object mapping field keys to validators
   */
  protected getCredentialSchema(): Record<string, z.ZodType<any>> {
    const schema: Record<string, z.ZodType<any>> = {};

    for (const field of this.credentialFields) {
      schema[field.key] = field.validation;
    }

    return schema;
  }

  /**
   * Validate credentials using the Zod schema.
   *
   * This is a helper method that subclasses can use in their
   * validateCredentials implementation.
   *
   * @param credentials - Credentials to validate
   * @returns Validation result
   *
   * @example
   * ```typescript
   * async validateCredentials(credentials: Record<string, string>) {
   *   // Use built-in schema validation
   *   return this.validateWithSchema(credentials);
   * }
   * ```
   */
  protected async validateWithSchema(
    credentials: Record<string, string>
  ): Promise<ValidationResult> {
    const schema = z.object(this.getCredentialSchema());

    try {
      await schema.parseAsync(credentials);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        };
      }

      return {
        valid: false,
        errors: [
          {
            field: 'unknown',
            message: String(error),
          },
        ],
      };
    }
  }

  /**
   * Helper method to create a timed connection test wrapper
   *
   * @param testFn - Async function that performs the actual test
   * @returns Connection test result with timing
   *
   * @example
   * ```typescript
   * async testConnection(credentials: Record<string, string>) {
   *   return this.withTiming(async () => {
   *     const stripe = new Stripe(credentials.secretKey);
   *     await stripe.paymentMethods.list({ limit: 1 });
   *     return { mode: credentials.secretKey.startsWith('sk_test_') ? 'test' : 'live' };
   *   });
   * }
   * ```
   */
  protected async withTiming(
    testFn: () => Promise<Record<string, any> | void>
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const metadata = await testFn();

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: metadata || undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        error: error.message || 'Connection test failed',
      };
    }
  }

  /**
   * Helper to validate required credentials are present
   *
   * @param credentials - Credentials to check
   * @returns Validation result
   */
  protected validateRequiredCredentials(
    credentials: Record<string, string>
  ): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const field of this.credentialFields) {
      if (field.required && !credentials[field.key]) {
        errors.push({
          field: field.key,
          message: `${field.label} is required`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
