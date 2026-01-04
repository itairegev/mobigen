/**
 * RevenueCat Connector for Mobigen
 *
 * Provides in-app purchases and subscription management via RevenueCat
 */

import { BaseConnector } from '@mobigen/connectors-core';
import { z } from 'zod';
import type {
  ConnectorMetadata,
  CredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  CodeGenContext,
} from '@mobigen/connectors-core';
import { validateApiKey, validateEntitlementId, validateSecretKey } from './validator';

export class RevenueCatConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'revenuecat',
      name: 'RevenueCat',
      description: 'In-app purchases and subscriptions made easy',
      category: 'in_app_purchases' as any,
      tier: 'free' as any,
      icon: '💰',
      providerUrl: 'https://www.revenuecat.com',
      docsUrl: 'https://www.revenuecat.com/docs/getting-started',
      version: '1.0.0',
      platforms: ['ios', 'android'] as any[],
      tags: ['subscriptions', 'in-app-purchases', 'monetization', 'payments'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'apiKey',
        label: 'iOS Public SDK Key',
        description: 'Your RevenueCat public SDK key for iOS (starts with appl_)',
        type: 'password',
        required: true,
        validation: z.string().min(1, 'iOS API key is required').refine(
          (val) => validateApiKey(val).valid,
          'Invalid API key format'
        ),
        placeholder: 'appl_...',
        instructionsUrl: 'https://app.revenuecat.com/settings/api-keys',
      },
      {
        key: 'apiKeyAndroid',
        label: 'Android Public SDK Key (Optional)',
        description: 'Your RevenueCat public SDK key for Android (starts with goog_)',
        type: 'password',
        required: false,
        validation: z.string().optional().refine(
          (val) => !val || validateApiKey(val).valid,
          'Invalid Android API key format'
        ),
        placeholder: 'goog_...',
        instructionsUrl: 'https://app.revenuecat.com/settings/api-keys',
      },
      {
        key: 'entitlementId',
        label: 'Entitlement ID',
        description: 'The entitlement identifier from your RevenueCat dashboard',
        type: 'text',
        required: true,
        validation: z.string().min(1, 'Entitlement ID is required').refine(
          (val) => validateEntitlementId(val).valid,
          (val) => validateEntitlementId(val).error || 'Invalid entitlement ID'
        ),
        placeholder: 'premium',
        instructionsUrl: 'https://www.revenuecat.com/docs/entitlements',
      },
      {
        key: 'secretKey',
        label: 'Secret API Key (Optional)',
        description: 'RevenueCat secret key for server-side operations',
        type: 'password',
        required: false,
        validation: z.string().optional().refine(
          (val) => !val || validateSecretKey(val).valid,
          (val) => validateSecretKey(val || '').error || 'Invalid secret key'
        ),
        placeholder: 'sk_...',
        instructionsUrl: 'https://app.revenuecat.com/settings/api-keys',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: 'react-native-purchases', version: '^7.0.0' },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'REVENUECAT_API_KEY_IOS',
        description: 'RevenueCat public SDK key for iOS',
        required: true,
        credentialKey: 'apiKey',
      },
      {
        key: 'REVENUECAT_API_KEY_ANDROID',
        description: 'RevenueCat public SDK key for Android',
        required: false,
        credentialKey: 'apiKeyAndroid',
      },
      {
        key: 'REVENUECAT_ENTITLEMENT_ID',
        description: 'Default entitlement identifier',
        required: true,
        credentialKey: 'entitlementId',
      },
      {
        key: 'REVENUECAT_SECRET_KEY',
        description: 'RevenueCat secret API key (server-side only)',
        required: false,
        credentialKey: 'secretKey',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/revenuecat.ts',
        template: (ctx) => this.serviceTemplate(ctx),
      },
      {
        path: 'src/hooks/useRevenueCat.ts',
        template: (ctx) => this.hooksTemplate(ctx),
      },
      {
        path: 'src/types/revenuecat.ts',
        template: (ctx) => this.typesTemplate(ctx),
      },
      {
        path: 'src/providers/revenuecat-provider.tsx',
        template: (ctx) => this.providerTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    // First run schema validation
    const schemaResult = await this.validateWithSchema(credentials);
    if (!schemaResult.valid) {
      return schemaResult;
    }

    const errors: Array<{ field: string; message: string }> = [];

    // Validate iOS API key
    const iosValidation = validateApiKey(credentials.apiKey);
    if (!iosValidation.valid) {
      errors.push({
        field: 'apiKey',
        message: iosValidation.error || 'Invalid iOS API key',
      });
    }

    // Validate Android API key if provided
    if (credentials.apiKeyAndroid) {
      const androidValidation = validateApiKey(credentials.apiKeyAndroid);
      if (!androidValidation.valid) {
        errors.push({
          field: 'apiKeyAndroid',
          message: androidValidation.error || 'Invalid Android API key',
        });
      }
    }

    // Validate entitlement ID
    const entitlementValidation = validateEntitlementId(credentials.entitlementId);
    if (!entitlementValidation.valid) {
      errors.push({
        field: 'entitlementId',
        message: entitlementValidation.error || 'Invalid entitlement ID',
      });
    }

    // Validate secret key if provided
    if (credentials.secretKey) {
      const secretValidation = validateSecretKey(credentials.secretKey);
      if (!secretValidation.valid) {
        errors.push({
          field: 'secretKey',
          message: secretValidation.error || 'Invalid secret key',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Test using RevenueCat REST API
      // We'll test the iOS API key (required)
      const apiKey = credentials.apiKey;

      const response = await fetch('https://api.revenuecat.com/v1/subscribers/test-connection', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Platform': 'ios',
        },
      });

      // RevenueCat returns 404 for non-existent subscribers, which is expected
      // We're just checking if the API key is valid (not 401)
      if (response.status === 401) {
        return {
          success: false,
          durationMs: Date.now() - startTime,
          error: 'Invalid API key - authentication failed',
        };
      }

      // Android API key validation (if provided)
      if (credentials.apiKeyAndroid) {
        const androidResponse = await fetch('https://api.revenuecat.com/v1/subscribers/test-connection', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credentials.apiKeyAndroid}`,
            'X-Platform': 'android',
          },
        });

        if (androidResponse.status === 401) {
          return {
            success: false,
            durationMs: Date.now() - startTime,
            error: 'Invalid Android API key - authentication failed',
          };
        }
      }

      // Validate API key format
      const iosValidation = validateApiKey(apiKey);

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          platform: iosValidation.platform || 'unknown',
          hasAndroidKey: !!credentials.apiKeyAndroid,
          entitlementId: credentials.entitlementId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        error: error.message || 'Connection test failed',
      };
    }
  }

  private serviceTemplate(ctx: CodeGenContext): string {
    return this.loadTemplate('revenuecat-service.ts.template', ctx);
  }

  private hooksTemplate(ctx: CodeGenContext): string {
    return this.loadTemplate('use-revenuecat.ts.template', ctx);
  }

  private typesTemplate(ctx: CodeGenContext): string {
    return this.loadTemplate('revenuecat-types.ts.template', ctx);
  }

  private providerTemplate(ctx: CodeGenContext): string {
    return this.loadTemplate('revenuecat-provider.tsx.template', ctx);
  }

  private loadTemplate(templateName: string, ctx: CodeGenContext): string {
    // Load template file and replace placeholders
    const fs = require('fs');
    const path = require('path');

    const templatePath = path.join(__dirname, 'templates', templateName);
    let template = fs.readFileSync(templatePath, 'utf-8');

    // Replace template variables
    template = template.replace(/\{\{GENERATION_DATE\}\}/g, new Date().toISOString());
    template = template.replace(/\{\{PROJECT_NAME\}\}/g, ctx.projectConfig.appName);
    template = template.replace(/\{\{REVENUECAT_API_KEY_IOS\}\}/g, ctx.env.REVENUECAT_API_KEY_IOS || '');
    template = template.replace(/\{\{REVENUECAT_API_KEY_ANDROID\}\}/g, ctx.env.REVENUECAT_API_KEY_ANDROID || ctx.env.REVENUECAT_API_KEY_IOS || '');
    template = template.replace(/\{\{ENTITLEMENT_ID\}\}/g, ctx.env.REVENUECAT_ENTITLEMENT_ID || '');

    return template;
  }
}

// Export validator functions for testing
export { validateApiKey, validateEntitlementId, validateSecretKey } from './validator';
