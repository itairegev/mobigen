/**
 * Stripe Connector for Mobigen
 *
 * Enables payment processing with Stripe in generated mobile apps.
 * Supports one-time payments, subscriptions, and webhooks.
 *
 * @packageDocumentation
 */

import { BaseConnector } from '@mobigen/connectors-core';
import { z } from 'zod';
import Stripe from 'stripe';
import type {
  ConnectorMetadata,
  CredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  CodeGenContext,
} from '@mobigen/connectors-core/types';
import { ConnectorCategory, ConnectorTier } from '@mobigen/connectors-core/types';

// Import templates
import { stripeServiceTemplate } from './templates/stripe-service';
import { stripeHookTemplate } from './templates/use-stripe';
import { stripeTypesTemplate } from './templates/stripe-types';

/**
 * Stripe Connector
 *
 * Provides payment processing capabilities via Stripe.
 *
 * @example
 * ```typescript
 * import { StripeConnector } from '@mobigen/connector-stripe';
 *
 * const connector = new StripeConnector();
 * const result = await connector.testConnection({
 *   publishableKey: 'pk_test_...',
 *   secretKey: 'sk_test_...',
 * });
 * ```
 */
export class StripeConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept payments with Stripe - one-time payments, subscriptions, and more',
      category: ConnectorCategory.PAYMENTS,
      tier: ConnectorTier.FREE,
      icon: '💳',
      providerUrl: 'https://stripe.com',
      docsUrl: 'https://stripe.com/docs/mobile/react-native',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      minExpoVersion: '50.0.0',
      tags: ['payments', 'subscriptions', 'checkout', 'credit-card', 'billing'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'publishableKey',
        label: 'Publishable Key',
        description: 'Your Stripe publishable key (starts with pk_). This is safe to use in your mobile app.',
        type: 'text',
        required: true,
        validation: z
          .string()
          .min(1, 'Publishable key is required')
          .startsWith('pk_', 'Publishable key must start with pk_'),
        placeholder: 'pk_test_FAKE_KEY_FOR_TESTING...',
        instructionsUrl: 'https://stripe.com/docs/keys#obtain-api-keys',
      },
      {
        key: 'secretKey',
        label: 'Secret Key',
        description: 'Your Stripe secret key (starts with sk_). Keep this secure - only use on server-side.',
        type: 'password',
        required: true,
        validation: z
          .string()
          .min(1, 'Secret key is required')
          .startsWith('sk_', 'Secret key must start with sk_'),
        placeholder: 'sk_test_FAKE_KEY_FOR_TESTING...',
        instructionsUrl: 'https://stripe.com/docs/keys#obtain-api-keys',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret (Optional)',
        description: 'Webhook signing secret for verifying events from Stripe (starts with whsec_)',
        type: 'password',
        required: false,
        validation: z
          .string()
          .startsWith('whsec_', 'Webhook secret must start with whsec_')
          .optional()
          .or(z.literal('')),
        placeholder: 'whsec_...',
        instructionsUrl: 'https://stripe.com/docs/webhooks/signatures',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      {
        package: '@stripe/stripe-react-native',
        version: '^0.37.0',
        dev: false,
      },
      {
        package: 'stripe',
        version: '^14.0.0',
        dev: false,
      },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'STRIPE_PUBLISHABLE_KEY',
        description: 'Stripe publishable key (client-side)',
        required: true,
        credentialKey: 'publishableKey',
      },
      {
        key: 'STRIPE_SECRET_KEY',
        description: 'Stripe secret key (server-side only - never expose to client)',
        required: true,
        credentialKey: 'secretKey',
      },
      {
        key: 'STRIPE_WEBHOOK_SECRET',
        description: 'Stripe webhook secret for event verification',
        required: false,
        credentialKey: 'webhookSecret',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/stripe.ts',
        template: stripeServiceTemplate,
        overwrite: false,
      },
      {
        path: 'src/hooks/useStripe.ts',
        template: stripeHookTemplate,
        overwrite: false,
      },
      {
        path: 'src/types/stripe.ts',
        template: stripeTypesTemplate,
        overwrite: false,
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  /**
   * Validate credentials using Zod schema
   */
  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    // Use base schema validation
    const result = await this.validateWithSchema(credentials);

    if (!result.valid) {
      return result;
    }

    // Additional validation logic
    const warnings: Array<{ field: string; message: string }> = [];

    // Warn if using live keys (usually not recommended for testing)
    if (credentials.publishableKey?.startsWith('pk_live_')) {
      warnings.push({
        field: 'publishableKey',
        message: 'You are using a live publishable key. Make sure this is intentional.',
      });
    }

    if (credentials.secretKey?.startsWith('sk_live_')) {
      warnings.push({
        field: 'secretKey',
        message: 'You are using a live secret key. Ensure proper security measures are in place.',
      });
    }

    // Warn if keys don't match mode (test vs live)
    const pkMode = credentials.publishableKey?.startsWith('pk_test_') ? 'test' : 'live';
    const skMode = credentials.secretKey?.startsWith('sk_test_') ? 'test' : 'live';

    if (pkMode !== skMode) {
      warnings.push({
        field: 'publishableKey',
        message: 'Your publishable key and secret key are from different modes (test vs live)',
      });
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Test connection with Stripe API
   *
   * Verifies that the provided credentials work by making a test API call.
   */
  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Initialize Stripe client
      const stripe = new Stripe(credentials.secretKey, {
        apiVersion: '2024-11-20.acacia',
        typescript: true,
      });

      // Test connection by listing payment methods (limit 1 for speed)
      // This validates the secret key without creating any resources
      await stripe.paymentMethods.list({ limit: 1 });

      const mode = credentials.secretKey.startsWith('sk_test_') ? 'test' : 'live';

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          mode,
          message: `Successfully connected to Stripe in ${mode} mode`,
        },
      };
    } catch (error: any) {
      // Parse Stripe error
      let errorMessage = 'Connection test failed';

      if (error.type === 'StripeAuthenticationError') {
        errorMessage = 'Invalid API key. Please check your secret key.';
      } else if (error.type === 'StripeConnectionError') {
        errorMessage = 'Could not connect to Stripe. Check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        durationMs: Date.now() - startTime,
        error: errorMessage,
        metadata: {
          errorType: error.type,
          errorCode: error.code,
        },
      };
    }
  }

  /**
   * Hook: Called after successful installation
   *
   * Can be used for setup tasks like creating webhook endpoints, etc.
   */
  async onInstall?(context: CodeGenContext): Promise<void> {
    // Log successful installation
    console.log(`[Stripe Connector] Successfully installed for project ${context.projectId}`);

    // Future: Could auto-create webhook endpoints here
    // Future: Could validate account settings
  }

  /**
   * Hook: Called before uninstallation
   *
   * Can be used for cleanup tasks.
   */
  async onUninstall?(context: CodeGenContext): Promise<void> {
    // Log uninstallation
    console.log(`[Stripe Connector] Uninstalling from project ${context.projectId}`);

    // Future: Could cleanup webhook endpoints
    // Future: Could archive payment data
  }
}

// Export singleton instance
export const stripeConnector = new StripeConnector();

// Export default
export default stripeConnector;
