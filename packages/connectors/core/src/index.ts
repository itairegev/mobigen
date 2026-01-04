/**
 * Mobigen Connector Framework
 *
 * Core framework for building and managing third-party service connectors.
 *
 * @packageDocumentation
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  ConnectorMetadata,
  ConnectorCredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  CodeGenContext,
  ValidationResult,
  ConnectionTestResult,
  ConnectorDefinition,
  ConnectorConfig,
  InstallResult,
} from './types';

export {
  ConnectorStatus,
  ConnectorCategory,
  ConnectorTier,
} from './types';

// ============================================================================
// Base Connector Class
// ============================================================================

export { BaseConnector } from './base-connector';

// ============================================================================
// Registry
// ============================================================================

export { ConnectorRegistry, connectorRegistry } from './registry';

// ============================================================================
// Manager
// ============================================================================

export { ConnectorManager, connectorManager } from './manager';

// ============================================================================
// Encryption
// ============================================================================

export type { EncryptedData } from './encryption';

export {
  encryptCredentials,
  decryptCredentials,
  generateEncryptionKey,
  isValidEncryptionKey,
  reencryptCredentials,
} from './encryption';

// ============================================================================
// Code Generator
// ============================================================================

export type { FileGenerationResult } from './code-generator';

export {
  MergeStrategy,
  generateFileContent,
  generateFiles,
  mergeDependencies,
  generateEnvExample,
  mergeEnvExample,
  smartMergeTypeScript,
  validateGeneratedContent,
  generateServiceTemplate,
  generateHookTemplate,
  generateTypesTemplate,
} from './code-generator';
