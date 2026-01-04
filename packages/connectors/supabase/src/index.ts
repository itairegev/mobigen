/**
 * Supabase Connector for Mobigen
 *
 * Enables backend functionality with Supabase in generated mobile apps.
 * Supports authentication, real-time database, storage, and edge functions.
 *
 * @packageDocumentation
 */

import { BaseConnector } from '@mobigen/connectors-core';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
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
import { supabaseClientTemplate } from './templates/supabase-client';
import { supabaseAuthTemplate } from './templates/supabase-auth';
import { useSupabaseAuthTemplate } from './templates/use-supabase-auth';
import { supabaseDatabaseTemplate } from './templates/supabase-database';
import { useSupabaseQueryTemplate } from './templates/use-supabase-query';
import { supabaseStorageTemplate } from './templates/supabase-storage';
import { supabaseTypesTemplate } from './templates/supabase-types';

/**
 * Supabase Connector
 *
 * Provides comprehensive backend capabilities via Supabase.
 *
 * @example
 * ```typescript
 * import { SupabaseConnector } from '@mobigen/connector-supabase';
 *
 * const connector = new SupabaseConnector();
 * const result = await connector.testConnection({
 *   projectUrl: 'https://your-project.supabase.co',
 *   anonKey: 'eyJ...',
 * });
 * ```
 */
export class SupabaseConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'supabase',
      name: 'Supabase',
      description: 'Open-source Firebase alternative with PostgreSQL, real-time subscriptions, authentication, and storage',
      category: ConnectorCategory.DATABASE,
      tier: ConnectorTier.FREE,
      icon: '⚡',
      providerUrl: 'https://supabase.com',
      docsUrl: 'https://supabase.com/docs/guides/getting-started/quickstarts/react-native',
      version: '1.0.0',
      platforms: ['ios', 'android', 'web'],
      minExpoVersion: '50.0.0',
      tags: ['database', 'backend', 'authentication', 'realtime', 'storage', 'postgresql'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'projectUrl',
        label: 'Project URL',
        description: 'Your Supabase project URL (e.g., https://xyzcompany.supabase.co)',
        type: 'url',
        required: true,
        validation: z
          .string()
          .url('Must be a valid URL')
          .includes('supabase.co', 'Must be a Supabase project URL'),
        placeholder: 'https://xyzcompany.supabase.co',
        instructionsUrl: 'https://supabase.com/dashboard',
      },
      {
        key: 'anonKey',
        label: 'Anon Public Key',
        description: 'Public anon key (safe to use in client-side code). Found in Settings > API.',
        type: 'password',
        required: true,
        validation: z
          .string()
          .min(1, 'Anon key is required')
          .startsWith('eyJ', 'Anon key should start with eyJ'),
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        instructionsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
      },
      {
        key: 'serviceRoleKey',
        label: 'Service Role Key (Optional)',
        description: 'Service role key for admin operations (server-side only). Keep this secure!',
        type: 'password',
        required: false,
        validation: z
          .string()
          .startsWith('eyJ', 'Service role key should start with eyJ')
          .optional()
          .or(z.literal('')),
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        instructionsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      {
        package: '@supabase/supabase-js',
        version: '^2.38.0',
        dev: false,
      },
      {
        package: '@react-native-async-storage/async-storage',
        version: '^1.19.0',
        dev: false,
      },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'SUPABASE_URL',
        description: 'Supabase project URL',
        required: true,
        credentialKey: 'projectUrl',
      },
      {
        key: 'SUPABASE_ANON_KEY',
        description: 'Supabase anon key (client-side)',
        required: true,
        credentialKey: 'anonKey',
      },
      {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        description: 'Supabase service role key (server-side only - never expose to client)',
        required: false,
        credentialKey: 'serviceRoleKey',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/supabase-client.ts',
        template: supabaseClientTemplate,
        overwrite: false,
      },
      {
        path: 'src/services/supabase-auth.ts',
        template: supabaseAuthTemplate,
        overwrite: false,
      },
      {
        path: 'src/hooks/useSupabaseAuth.ts',
        template: useSupabaseAuthTemplate,
        overwrite: false,
      },
      {
        path: 'src/services/supabase-database.ts',
        template: supabaseDatabaseTemplate,
        overwrite: false,
      },
      {
        path: 'src/hooks/useSupabaseQuery.ts',
        template: useSupabaseQueryTemplate,
        overwrite: false,
      },
      {
        path: 'src/services/supabase-storage.ts',
        template: supabaseStorageTemplate,
        overwrite: false,
      },
      {
        path: 'src/types/supabase.ts',
        template: supabaseTypesTemplate,
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

    // Check if service role key is provided (warn if missing for production)
    if (!credentials.serviceRoleKey || credentials.serviceRoleKey === '') {
      warnings.push({
        field: 'serviceRoleKey',
        message: 'Service role key not provided. This limits admin operations to server-side only.',
      });
    }

    // Validate URL format
    const url = credentials.projectUrl;
    if (url && !url.startsWith('https://')) {
      warnings.push({
        field: 'projectUrl',
        message: 'Project URL should use HTTPS',
      });
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Test connection with Supabase API
   *
   * Verifies that the provided credentials work by making a test API call.
   */
  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Initialize Supabase client
      const supabase = createClient(credentials.projectUrl, credentials.anonKey, {
        auth: {
          persistSession: false, // Don't persist session for test
        },
      });

      // Test connection by checking auth service
      // This is a lightweight call that validates credentials
      const { data, error } = await supabase.auth.getSession();

      // Check if there's a connection error (not auth error, which is expected)
      if (error && error.message.includes('Failed to fetch')) {
        throw new Error('Could not connect to Supabase. Check your project URL.');
      }

      // Try a simple query to validate database access
      // Query the _supabase_health table or any public table
      // If no tables exist, this will fail gracefully
      const { error: queryError } = await supabase
        .from('_supabase_migrations')
        .select('id')
        .limit(1);

      // PGRST116 = table not found, which is acceptable
      const isHealthy = !queryError || queryError.code === 'PGRST116';

      if (!isHealthy) {
        throw new Error(queryError?.message || 'Database connection failed');
      }

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          url: credentials.projectUrl,
          message: 'Successfully connected to Supabase',
          hasServiceRole: !!credentials.serviceRoleKey,
        },
      };
    } catch (error: any) {
      // Parse error
      let errorMessage = 'Connection test failed';

      if (error.message?.includes('Invalid API key')) {
        errorMessage = 'Invalid API key. Please check your anon key.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Could not connect')) {
        errorMessage = 'Could not connect to Supabase. Check your project URL and internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        durationMs: Date.now() - startTime,
        error: errorMessage,
        metadata: {
          errorCode: error.code,
          errorHint: error.hint,
        },
      };
    }
  }

  /**
   * Hook: Called after successful installation
   *
   * Can be used for setup tasks.
   */
  async onInstall?(context: CodeGenContext): Promise<void> {
    // Log successful installation
    console.log(`[Supabase Connector] Successfully installed for project ${context.projectId}`);

    // Future: Could auto-create database tables
    // Future: Could set up RLS policies
    // Future: Could configure auth providers
  }

  /**
   * Hook: Called before uninstallation
   *
   * Can be used for cleanup tasks.
   */
  async onUninstall?(context: CodeGenContext): Promise<void> {
    // Log uninstallation
    console.log(`[Supabase Connector] Uninstalling from project ${context.projectId}`);

    // Future: Could archive data
    // Future: Could disable auth providers
  }
}

// Export singleton instance
export const supabaseConnector = new SupabaseConnector();

// Export default
export default supabaseConnector;
