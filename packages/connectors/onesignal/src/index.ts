// OneSignal Push Notifications Connector for Mobigen
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

import { onesignalServiceTemplate } from './templates/onesignal-service';
import { onesignalHookTemplate } from './templates/use-onesignal';
import { onesignalTypesTemplate } from './templates/onesignal-types';
import { onesignalProviderTemplate } from './templates/onesignal-provider';
import { validateAppId } from './validator';

/**
 * OneSignal Connector
 *
 * Push notifications, in-app messaging, and user engagement
 *
 * Features:
 * - Push notifications (iOS, Android)
 * - In-app messages
 * - User tags and segmentation
 * - External user ID linking
 * - Notification handlers
 * - Permission management
 */
export class OneSignalConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'onesignal',
      name: 'OneSignal',
      description: 'Push notifications, in-app messaging, and email',
      category: 'engagement' as any,
      tier: 'free' as any,
      icon: '🔔',
      providerUrl: 'https://onesignal.com',
      docsUrl: 'https://documentation.onesignal.com/docs/react-native-sdk-setup',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      tags: ['push-notifications', 'messaging', 'engagement', 'in-app-messages'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'appId',
        label: 'OneSignal App ID',
        description: 'Your OneSignal app ID (UUID format)',
        type: 'text',
        required: true,
        validation: z.string().uuid('Must be a valid UUID'),
        placeholder: '12345678-1234-1234-1234-123456789012',
        instructionsUrl: 'https://documentation.onesignal.com/docs/accounts-and-keys',
      },
      {
        key: 'restApiKey',
        label: 'REST API Key (Optional)',
        description: 'OneSignal REST API key for server-side operations (sending notifications from backend)',
        type: 'password',
        required: false,
        validation: z.string().min(1).optional(),
        placeholder: 'NGE...',
        instructionsUrl: 'https://documentation.onesignal.com/docs/accounts-and-keys',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      {
        package: 'react-native-onesignal',
        version: '^5.0.0',
      },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'ONESIGNAL_APP_ID',
        description: 'OneSignal app ID',
        required: true,
        credentialKey: 'appId',
      },
      {
        key: 'ONESIGNAL_REST_API_KEY',
        description: 'OneSignal REST API key (for server-side operations)',
        required: false,
        credentialKey: 'restApiKey',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/onesignal.ts',
        template: (ctx: CodeGenContext) => onesignalServiceTemplate(ctx),
      },
      {
        path: 'src/hooks/useOneSignal.ts',
        template: (ctx: CodeGenContext) => onesignalHookTemplate(ctx),
      },
      {
        path: 'src/types/onesignal.ts',
        template: (ctx: CodeGenContext) => onesignalTypesTemplate(ctx),
      },
      {
        path: 'src/providers/OneSignalProvider.tsx',
        template: (ctx: CodeGenContext) => onesignalProviderTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  /**
   * Validate credentials format
   */
  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    // Use base schema validation
    const schemaResult = await this.validateWithSchema(credentials);

    if (!schemaResult.valid) {
      return schemaResult;
    }

    // Additional validation for app ID format
    const appIdValidation = validateAppId(credentials.appId);
    if (!appIdValidation.valid) {
      return {
        valid: false,
        errors: [{ field: 'appId', message: appIdValidation.error || 'Invalid App ID' }],
      };
    }

    return { valid: true };
  }

  /**
   * Test connection with OneSignal API
   */
  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Validate app ID format first
      const appIdValidation = validateAppId(credentials.appId);
      if (!appIdValidation.valid) {
        return {
          success: false,
          durationMs: Date.now() - startTime,
          error: appIdValidation.error || 'Invalid App ID format',
        };
      }

      // Test using REST API - get app details
      const response = await fetch(
        `https://onesignal.com/api/v1/apps/${credentials.appId}`,
        {
          method: 'GET',
          headers: credentials.restApiKey
            ? { 'Authorization': `Basic ${credentials.restApiKey}` }
            : {},
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            durationMs: Date.now() - startTime,
            error: 'Invalid REST API key. Please check your credentials.',
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            durationMs: Date.now() - startTime,
            error: 'App ID not found. Please verify your OneSignal App ID.',
          };
        }

        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          appName: data.name,
          platform: data.chrome_web_default_notification_icon ? 'multi-platform' : 'mobile',
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
}

// Export for registration
export default OneSignalConnector;
