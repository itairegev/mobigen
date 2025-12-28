/**
 * Schema type definitions for AWS backend provisioning
 */

/**
 * DynamoDB attribute type
 */
export type DynamoDBAttributeType = 'S' | 'N' | 'B';

/**
 * Application attribute type for schema definition
 */
export type AttributeType = 'string' | 'number' | 'boolean' | 'list' | 'map';

/**
 * Key schema for DynamoDB
 */
export interface KeyDefinition {
  name: string;
  type: DynamoDBAttributeType;
}

/**
 * Global Secondary Index definition
 */
export interface GlobalSecondaryIndex {
  name: string;
  partitionKey: KeyDefinition;
  sortKey?: KeyDefinition;
}

/**
 * Attribute definition for a table
 */
export interface AttributeDefinition {
  name: string;
  type: AttributeType;
  required?: boolean;
  default?: unknown;
}

/**
 * Table schema definition
 */
export interface TableSchema {
  name: string;
  partitionKey: KeyDefinition;
  sortKey?: KeyDefinition;
  attributes: AttributeDefinition[];
  gsi?: GlobalSecondaryIndex[];
}

/**
 * Complete template schema
 */
export interface TemplateSchema {
  templateId: string;
  tables: TableSchema[];
  seedData?: Record<string, Record<string, unknown>[]>;
}

/**
 * Provisioning configuration
 */
export interface ProvisioningConfig {
  projectId: string;
  templateId: string;
  region?: string;
  environment?: 'dev' | 'staging' | 'prod';
}

/**
 * Result of provisioning operation
 */
export interface ProvisioningResult {
  success: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  tables?: string[];
  lambdaArn?: string;
  error?: string;
}

/**
 * Backend status for a project
 */
export interface BackendStatus {
  status: 'pending' | 'provisioning' | 'active' | 'failed' | 'deleting';
  apiEndpoint?: string;
  tables?: string[];
  provisionedAt?: Date;
  lastError?: string;
}
