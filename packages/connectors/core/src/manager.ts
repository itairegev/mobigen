/**
 * Connector lifecycle manager
 *
 * Handles installation, uninstallation, and configuration of connectors.
 *
 * @packageDocumentation
 */

import { connectorRegistry } from './registry';
import { encryptCredentials, decryptCredentials } from './encryption';
import { generateFiles, mergeDependencies, mergeEnvExample } from './code-generator';
import type {
  ConnectorDefinition,
  CodeGenContext,
  InstallResult,
  ConnectionTestResult,
  ConnectorConfig,
  ConnectorStatus,
} from './types';

/**
 * Connector lifecycle manager.
 *
 * Manages the complete lifecycle of connector installation, configuration,
 * and removal for Mobigen projects.
 *
 * @example
 * ```typescript
 * const manager = new ConnectorManager();
 *
 * // Install a connector
 * const result = await manager.installConnector(
 *   'project-123',
 *   'stripe',
 *   {
 *     publishableKey: 'pk_test_...',
 *     secretKey: 'sk_test_...',
 *   },
 *   'user-123'
 * );
 *
 * if (result.success) {
 *   console.log('Connector installed!');
 * }
 * ```
 */
export class ConnectorManager {
  /**
   * Install a connector for a project.
   *
   * This performs the following steps:
   * 1. Validate credentials format
   * 2. Test connection with credentials
   * 3. Encrypt credentials
   * 4. Save to database
   * 5. Generate code files
   * 6. Update dependencies
   * 7. Update environment config
   * 8. Run onInstall hook
   *
   * @param projectId - Mobigen project ID
   * @param connectorId - Connector ID to install
   * @param credentials - User-provided credentials
   * @param userId - User performing the installation
   * @returns Installation result
   */
  async installConnector(
    projectId: string,
    connectorId: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<InstallResult> {
    const connector = connectorRegistry.get(connectorId);

    if (!connector) {
      return {
        success: false,
        error: `Connector '${connectorId}' not found in registry`,
      };
    }

    try {
      // Step 1: Validate credentials
      const validationResult = await connector.validateCredentials(credentials);

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors?.map((e) => e.message).join(', ');
        return {
          success: false,
          error: `Invalid credentials: ${errorMessages}`,
        };
      }

      // Step 2: Test connection
      const connectionResult = await connector.testConnection(credentials);

      if (!connectionResult.success) {
        return {
          success: false,
          error: `Connection test failed: ${connectionResult.error}`,
        };
      }

      // Step 3: Encrypt credentials
      const encrypted = await encryptCredentials(credentials);

      // Step 4: Save to database (placeholder - implement with actual DB)
      await this.saveConnectorToDatabase(
        projectId,
        connectorId,
        userId,
        encrypted
      );

      // Step 5: Get project context
      const context = await this.buildCodeGenContext(
        projectId,
        connectorId,
        credentials
      );

      // Step 6: Generate code files
      const fileResults = generateFiles(connector.generatedFiles, context);
      const filesGenerated = fileResults
        .filter((r) => r.action === 'created')
        .map((r) => r.path);

      // Collect warnings
      const warnings = fileResults
        .flatMap((r) => r.warnings || [])
        .filter(Boolean);

      // Step 7: Write generated files (placeholder - implement with actual storage)
      for (const result of fileResults) {
        if (result.action === 'created') {
          await this.writeFile(projectId, result.path, result.content);
        }
      }

      // Step 8: Update package.json
      await this.updateProjectDependencies(projectId, connector.dependencies);

      // Step 9: Update .env.example
      await this.updateProjectEnvExample(
        projectId,
        connector.envVars,
        connector.metadata.name
      );

      // Step 10: Run onInstall hook
      if (connector.onInstall) {
        await connector.onInstall(context);
      }

      // Step 11: Update status to installed
      await this.updateConnectorStatus(projectId, connectorId, 'installed');

      return {
        success: true,
        filesGenerated,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      // Mark as failed in database
      await this.updateConnectorStatus(projectId, connectorId, 'failed');

      return {
        success: false,
        error: `Installation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Uninstall a connector from a project.
   *
   * @param projectId - Project ID
   * @param connectorId - Connector ID to uninstall
   */
  async uninstallConnector(
    projectId: string,
    connectorId: string
  ): Promise<void> {
    const connector = connectorRegistry.get(connectorId);

    if (!connector) {
      throw new Error(`Connector '${connectorId}' not found in registry`);
    }

    // Update status to uninstalling
    await this.updateConnectorStatus(projectId, connectorId, 'uninstalling');

    // Get credentials for onUninstall hook
    const record = await this.getConnectorFromDatabase(projectId, connectorId);

    if (record && connector.onUninstall) {
      const credentials = await decryptCredentials({
        ciphertext: record.credentialsEncrypted,
        iv: record.credentialsIv,
        tag: record.credentialsTag,
      });

      const context = await this.buildCodeGenContext(
        projectId,
        connectorId,
        credentials
      );

      // Run onUninstall hook
      await connector.onUninstall(context);
    }

    // Delete from database
    await this.deleteConnectorFromDatabase(projectId, connectorId);
  }

  /**
   * Test connection for a connector without installing.
   *
   * @param connectorId - Connector ID
   * @param credentials - Credentials to test
   * @returns Connection test result
   */
  async testConnection(
    connectorId: string,
    credentials: Record<string, string>
  ): Promise<ConnectionTestResult> {
    const connector = connectorRegistry.get(connectorId);

    if (!connector) {
      return {
        success: false,
        durationMs: 0,
        error: `Connector '${connectorId}' not found`,
      };
    }

    return connector.testConnection(credentials);
  }

  /**
   * Get installed connectors for a project.
   *
   * @param projectId - Project ID
   * @returns Array of installed connector configurations
   */
  async getInstalledConnectors(projectId: string): Promise<ConnectorConfig[]> {
    // Placeholder - implement with actual DB
    return [];
  }

  /**
   * Update connector configuration.
   *
   * @param projectId - Project ID
   * @param connectorId - Connector ID
   * @param config - New configuration
   */
  async updateConnectorConfig(
    projectId: string,
    connectorId: string,
    config: Record<string, any>
  ): Promise<void> {
    // Placeholder - implement with actual DB
    console.log(`Updating config for ${connectorId} in project ${projectId}`);
  }

  // =========================================================================
  // Private helper methods
  // =========================================================================

  /**
   * Build code generation context for a connector.
   *
   * @internal
   */
  private async buildCodeGenContext(
    projectId: string,
    connectorId: string,
    credentials: Record<string, string>
  ): Promise<CodeGenContext> {
    const connector = connectorRegistry.get(connectorId);

    if (!connector) {
      throw new Error(`Connector '${connectorId}' not found`);
    }

    // Build environment variables from credentials
    const env = this.buildEnvVars(connector, credentials);

    // Get project details (placeholder - implement with actual DB)
    const project = await this.getProjectDetails(projectId);

    return {
      projectId,
      connectorId,
      credentials,
      env,
      projectConfig: {
        bundleIdIos: project.bundleIdIos,
        bundleIdAndroid: project.bundleIdAndroid,
        appName: project.name,
      },
      templateId: project.templateId,
    };
  }

  /**
   * Build environment variables from credentials.
   *
   * @internal
   */
  private buildEnvVars(
    connector: ConnectorDefinition,
    credentials: Record<string, string>
  ): Record<string, string> {
    const env: Record<string, string> = {};

    for (const envVar of connector.envVars) {
      if (envVar.credentialKey && credentials[envVar.credentialKey]) {
        env[envVar.key] = credentials[envVar.credentialKey];
      } else if (envVar.defaultValue) {
        env[envVar.key] = envVar.defaultValue;
      }
    }

    return env;
  }

  /**
   * Write a file to the project.
   *
   * @internal
   */
  private async writeFile(
    projectId: string,
    path: string,
    content: string
  ): Promise<void> {
    // Placeholder - implement with actual storage service
    console.log(`Writing file: ${path} (${content.length} bytes)`);
  }

  /**
   * Update project package.json with dependencies.
   *
   * @internal
   */
  private async updateProjectDependencies(
    projectId: string,
    dependencies: any[]
  ): Promise<void> {
    // Placeholder - implement with actual storage service
    console.log(`Updating dependencies for project ${projectId}`);
  }

  /**
   * Update project .env.example with environment variables.
   *
   * @internal
   */
  private async updateProjectEnvExample(
    projectId: string,
    envVars: any[],
    connectorName: string
  ): Promise<void> {
    // Placeholder - implement with actual storage service
    console.log(`Updating .env.example for project ${projectId}`);
  }

  /**
   * Save connector to database.
   *
   * @internal
   */
  private async saveConnectorToDatabase(
    projectId: string,
    connectorId: string,
    userId: string,
    encrypted: any
  ): Promise<void> {
    // Placeholder - implement with actual DB
    console.log(`Saving connector ${connectorId} to database`);
  }

  /**
   * Get connector record from database.
   *
   * @internal
   */
  private async getConnectorFromDatabase(
    projectId: string,
    connectorId: string
  ): Promise<any> {
    // Placeholder - implement with actual DB
    return null;
  }

  /**
   * Delete connector from database.
   *
   * @internal
   */
  private async deleteConnectorFromDatabase(
    projectId: string,
    connectorId: string
  ): Promise<void> {
    // Placeholder - implement with actual DB
    console.log(`Deleting connector ${connectorId} from database`);
  }

  /**
   * Update connector status.
   *
   * @internal
   */
  private async updateConnectorStatus(
    projectId: string,
    connectorId: string,
    status: ConnectorStatus | string
  ): Promise<void> {
    // Placeholder - implement with actual DB
    console.log(`Updating status for ${connectorId}: ${status}`);
  }

  /**
   * Get project details.
   *
   * @internal
   */
  private async getProjectDetails(projectId: string): Promise<any> {
    // Placeholder - implement with actual DB
    return {
      name: 'Test App',
      bundleIdIos: 'com.example.testapp',
      bundleIdAndroid: 'com.example.testapp',
      templateId: 'ecommerce',
    };
  }
}

/**
 * Singleton connector manager instance.
 */
export const connectorManager = new ConnectorManager();
