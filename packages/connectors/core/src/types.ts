/**
 * Core connector framework types
 *
 * @packageDocumentation
 */

import { z } from 'zod';

/**
 * Connector lifecycle status
 */
export enum ConnectorStatus {
  /** Connector registered but not installed */
  AVAILABLE = 'available',

  /** Installation in progress */
  INSTALLING = 'installing',

  /** Successfully installed and active */
  INSTALLED = 'installed',

  /** Installation failed */
  FAILED = 'failed',

  /** Uninstallation in progress */
  UNINSTALLING = 'uninstalling',

  /** Update in progress */
  UPDATING = 'updating',
}

/**
 * Connector category for organization
 */
export enum ConnectorCategory {
  PAYMENTS = 'payments',
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  ANALYTICS = 'analytics',
  PUSH_NOTIFICATIONS = 'push_notifications',
  IN_APP_PURCHASES = 'in_app_purchases',
  STORAGE = 'storage',
  AI = 'ai',
  OTHER = 'other',
}

/**
 * Connector tier (determines user access)
 */
export enum ConnectorTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

/**
 * Base connector metadata
 */
export interface ConnectorMetadata {
  /** Unique identifier (e.g., 'stripe', 'firebase') */
  id: string;

  /** Display name */
  name: string;

  /** Short description for display */
  description: string;

  /** Connector category */
  category: ConnectorCategory;

  /** Minimum tier required to use this connector */
  tier: ConnectorTier;

  /** Icon URL or emoji */
  icon: string;

  /** Provider's website URL */
  providerUrl: string;

  /** Documentation URL */
  docsUrl?: string;

  /** Connector version */
  version: string;

  /** Platforms supported */
  platforms: Array<'ios' | 'android' | 'web'>;

  /** Required minimum Expo SDK version */
  minExpoVersion?: string;

  /** Search tags */
  tags: string[];
}

/**
 * Credential field definition for connector setup
 */
export interface ConnectorCredentialField {
  /** Field key (used as object key in credentials) */
  key: string;

  /** Display label */
  label: string;

  /** Help text shown below field */
  description?: string;

  /** Input field type */
  type: 'text' | 'password' | 'url' | 'file' | 'select';

  /** Is this field required? */
  required: boolean;

  /** Default value */
  defaultValue?: string;

  /** Zod validation schema */
  validation: z.ZodType<any>;

  /** For select type: available options */
  options?: Array<{ label: string; value: string }>;

  /** Placeholder text */
  placeholder?: string;

  /** Link to instructions for obtaining this credential */
  instructionsUrl?: string;
}

/**
 * NPM dependency to be installed
 */
export interface ConnectorDependency {
  /** NPM package name */
  package: string;

  /** Version or semver range */
  version: string;

  /** Is this a dev dependency? */
  dev?: boolean;
}

/**
 * Environment variable to be added to .env
 */
export interface ConnectorEnvVar {
  /** Environment variable name */
  key: string;

  /** Description of the variable */
  description: string;

  /** Is this variable required? */
  required: boolean;

  /** Default value if any */
  defaultValue?: string;

  /** Maps to a credential field key */
  credentialKey?: string;
}

/**
 * File to be generated during installation
 */
export interface GeneratedFile {
  /** Relative path from project root */
  path: string;

  /** Template function that generates file content */
  template: (context: CodeGenContext) => string;

  /** Should this file overwrite if it exists? */
  overwrite?: boolean;
}

/**
 * Context provided to code generation templates
 */
export interface CodeGenContext {
  /** Mobigen project ID */
  projectId: string;

  /** Connector ID being installed */
  connectorId: string;

  /** Decrypted credentials provided by user */
  credentials: Record<string, string>;

  /** Environment variables (mapped from credentials) */
  env: Record<string, string>;

  /** Project configuration */
  projectConfig: {
    /** iOS bundle identifier */
    bundleIdIos: string;

    /** Android bundle identifier */
    bundleIdAndroid: string;

    /** App display name */
    appName: string;
  };

  /** Template ID (e.g., 'ecommerce', 'social') */
  templateId: string;
}

/**
 * Credential validation result
 */
export interface ValidationResult {
  /** Are credentials valid? */
  valid: boolean;

  /** Validation errors */
  errors?: Array<{
    field: string;
    message: string;
  }>;

  /** Non-critical warnings */
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Did the connection test succeed? */
  success: boolean;

  /** Test duration in milliseconds */
  durationMs: number;

  /** Error message if test failed */
  error?: string;

  /** Additional metadata from the test */
  metadata?: Record<string, any>;
}

/**
 * Complete connector definition
 */
export interface ConnectorDefinition {
  /** Connector metadata */
  metadata: ConnectorMetadata;

  /** Credential fields required for setup */
  credentialFields: ConnectorCredentialField[];

  /** NPM dependencies to install */
  dependencies: ConnectorDependency[];

  /** Environment variables to add */
  envVars: ConnectorEnvVar[];

  /** Files to generate */
  generatedFiles: GeneratedFile[];

  /**
   * Validate credentials format and requirements
   */
  validateCredentials: (credentials: Record<string, string>) => Promise<ValidationResult>;

  /**
   * Test connection with provided credentials
   */
  testConnection: (credentials: Record<string, string>) => Promise<ConnectionTestResult>;

  /**
   * Hook called after successful installation
   */
  onInstall?: (context: CodeGenContext) => Promise<void>;

  /**
   * Hook called before uninstallation
   */
  onUninstall?: (context: CodeGenContext) => Promise<void>;
}

/**
 * Connector instance configuration
 */
export interface ConnectorConfig {
  /** Project ID */
  projectId: string;

  /** Connector ID */
  connectorId: string;

  /** Current status */
  status: ConnectorStatus;

  /** Installation timestamp */
  installedAt?: Date;

  /** Last connection test timestamp */
  lastTestedAt?: Date;

  /** Custom configuration (connector-specific) */
  config: Record<string, any>;
}

/**
 * Connector installation result
 */
export interface InstallResult {
  /** Was installation successful? */
  success: boolean;

  /** Error message if installation failed */
  error?: string;

  /** Warnings that didn't prevent installation */
  warnings?: string[];

  /** Files that were generated */
  filesGenerated?: string[];
}
