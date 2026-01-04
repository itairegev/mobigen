/**
 * Example: Creating a Custom Connector
 *
 * This example demonstrates how to create a custom connector
 * for integrating a third-party service with Mobigen.
 */

import {
  BaseConnector,
  ConnectorCategory,
  ConnectorTier,
  type CodeGenContext,
  type ValidationResult,
  type ConnectionTestResult,
} from '../src';
import { z } from 'zod';

/**
 * Example connector for a fictional "MyService" API
 */
export class MyServiceConnector extends BaseConnector {
  constructor() {
    super({
      // Metadata
      metadata: {
        id: 'myservice',
        name: 'MyService',
        description: 'Integration with MyService API for data synchronization',
        category: ConnectorCategory.OTHER,
        tier: ConnectorTier.FREE,
        icon: '🔌',
        providerUrl: 'https://myservice.com',
        docsUrl: 'https://docs.myservice.com/integration',
        version: '1.0.0',
        platforms: ['ios', 'android', 'web'],
        tags: ['api', 'sync', 'data'],
      },

      // Credential fields (what user needs to provide)
      credentialFields: [
        {
          key: 'apiKey',
          label: 'API Key',
          description: 'Your MyService API key',
          type: 'password',
          required: true,
          validation: z.string().startsWith('ms_', 'API key must start with ms_'),
          placeholder: 'ms_...',
          instructionsUrl: 'https://myservice.com/settings/api-keys',
        },
        {
          key: 'environment',
          label: 'Environment',
          description: 'Choose your environment',
          type: 'select',
          required: true,
          validation: z.enum(['development', 'staging', 'production']),
          options: [
            { label: 'Development', value: 'development' },
            { label: 'Staging', value: 'staging' },
            { label: 'Production', value: 'production' },
          ],
          defaultValue: 'development',
        },
      ],

      // NPM dependencies to install
      dependencies: [
        { package: 'myservice-sdk', version: '^2.0.0' },
        { package: '@types/myservice-sdk', version: '^2.0.0', dev: true },
      ],

      // Environment variables to add to .env
      envVars: [
        {
          key: 'MYSERVICE_API_KEY',
          description: 'MyService API key',
          required: true,
          credentialKey: 'apiKey',
        },
        {
          key: 'MYSERVICE_ENVIRONMENT',
          description: 'MyService environment',
          required: true,
          credentialKey: 'environment',
        },
      ],

      // Files to generate
      generatedFiles: [
        {
          path: 'src/services/myservice.ts',
          template: (ctx) => this.generateServiceFile(ctx),
        },
        {
          path: 'src/hooks/useMyService.ts',
          template: (ctx) => this.generateHookFile(ctx),
        },
        {
          path: 'src/types/myservice.ts',
          template: (ctx) => this.generateTypesFile(ctx),
        },
      ],
    });
  }

  /**
   * Validate credentials
   */
  async validateCredentials(
    credentials: Record<string, string>
  ): Promise<ValidationResult> {
    // Use built-in schema validation
    return this.validateWithSchema(credentials);
  }

  /**
   * Test connection with credentials
   */
  async testConnection(
    credentials: Record<string, string>
  ): Promise<ConnectionTestResult> {
    // Use built-in timing wrapper
    return this.withTiming(async () => {
      // Make a test API call
      const response = await fetch(
        `https://api.myservice.com/${credentials.environment}/health`,
        {
          headers: {
            Authorization: `Bearer ${credentials.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Return metadata (optional)
      return {
        status: data.status,
        version: data.version,
        environment: credentials.environment,
      };
    });
  }

  /**
   * Post-install hook (optional)
   */
  async onInstall(context: CodeGenContext): Promise<void> {
    console.log(`MyService connector installed for project ${context.projectId}`);
    console.log(`Environment: ${context.credentials.environment}`);

    // Perform any additional setup tasks here
    // e.g., create webhooks, register app with MyService, etc.
  }

  /**
   * Pre-uninstall hook (optional)
   */
  async onUninstall(context: CodeGenContext): Promise<void> {
    console.log(`MyService connector uninstalling from project ${context.projectId}`);

    // Perform cleanup tasks here
    // e.g., delete webhooks, unregister app, etc.
  }

  // =========================================================================
  // Template Generation Methods
  // =========================================================================

  /**
   * Generate service file
   */
  private generateServiceFile(ctx: CodeGenContext): string {
    return `
/**
 * MyService SDK integration
 * Auto-generated by Mobigen
 */

import { MyServiceClient } from 'myservice-sdk';

// Initialize client
export const myServiceClient = new MyServiceClient({
  apiKey: process.env.MYSERVICE_API_KEY || '',
  environment: process.env.MYSERVICE_ENVIRONMENT || 'development',
});

/**
 * Sync data with MyService
 */
export async function syncData(data: any): Promise<void> {
  await myServiceClient.sync(data);
}

/**
 * Fetch data from MyService
 */
export async function fetchData(query: any): Promise<any> {
  return await myServiceClient.query(query);
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToUpdates(callback: (data: any) => void): () => void {
  return myServiceClient.subscribe('updates', callback);
}
`.trim();
  }

  /**
   * Generate React hook
   */
  private generateHookFile(ctx: CodeGenContext): string {
    return `
/**
 * MyService React hooks
 * Auto-generated by Mobigen
 */

import { useState, useEffect } from 'react';
import { myServiceClient, syncData, fetchData } from '../services/myservice';

export function useMyService() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check connection on mount
    myServiceClient.ping()
      .then(() => setIsConnected(true))
      .catch((err) => setError(err.message));
  }, []);

  const sync = async (data: any) => {
    try {
      await syncData(data);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const fetch = async (query: any) => {
    try {
      return await fetchData(query);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isConnected,
    error,
    sync,
    fetch,
  };
}
`.trim();
  }

  /**
   * Generate TypeScript types
   */
  private generateTypesFile(ctx: CodeGenContext): string {
    return `
/**
 * MyService type definitions
 * Auto-generated by Mobigen
 */

export interface MyServiceConfig {
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
}

export interface MyServiceData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  content: any;
}

export interface MyServiceQuery {
  filter?: Record<string, any>;
  sort?: string;
  limit?: number;
  offset?: number;
}
`.trim();
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function exampleUsage() {
  const { connectorRegistry, connectorManager } = await import('../src');

  // 1. Register the connector
  connectorRegistry.register(new MyServiceConnector());

  // 2. List all connectors
  const allConnectors = connectorRegistry.list();
  console.log(`${allConnectors.length} connectors available`);

  // 3. Search for connectors
  const searchResults = connectorRegistry.search('myservice');
  console.log('Search results:', searchResults.map(c => c.metadata.name));

  // 4. Get connector details
  const connector = connectorRegistry.get('myservice');
  if (connector) {
    console.log('Connector:', connector.metadata.name);
    console.log('Credentials needed:', connector.credentialFields.map(f => f.key));
  }

  // 5. Test connection (without installing)
  const testResult = await connectorManager.testConnection('myservice', {
    apiKey: 'ms_test_abc123',
    environment: 'development',
  });

  console.log('Connection test:', testResult.success ? 'PASS' : 'FAIL');
  console.log('Duration:', testResult.durationMs, 'ms');

  // 6. Install connector
  const installResult = await connectorManager.installConnector(
    'project-123',
    'myservice',
    {
      apiKey: 'ms_live_xyz789',
      environment: 'production',
    },
    'user-456'
  );

  if (installResult.success) {
    console.log('Connector installed successfully!');
    console.log('Files generated:', installResult.filesGenerated);
  } else {
    console.error('Installation failed:', installResult.error);
  }

  // 7. Uninstall connector
  await connectorManager.uninstallConnector('project-123', 'myservice');
  console.log('Connector uninstalled');
}

// Run example (commented out)
// exampleUsage().catch(console.error);
