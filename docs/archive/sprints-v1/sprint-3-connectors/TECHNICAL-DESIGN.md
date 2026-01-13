# Sprint 3: Connectors & Integrations - Technical Design

**Version:** 1.0
**Date:** January 4, 2026
**Status:** Design
**Sprint Duration:** 5 days

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Core Connector Framework](#3-core-connector-framework)
4. [Individual Connector Specifications](#4-individual-connector-specifications)
5. [Database Schema](#5-database-schema)
6. [API Design](#6-api-design)
7. [Security & Credentials](#7-security--credentials)
8. [UI Components](#8-ui-components)
9. [Code Generation Patterns](#9-code-generation-patterns)
10. [Testing Strategy](#10-testing-strategy)
11. [Implementation Plan](#11-implementation-plan)

---

## 1. Overview

### 1.1 Goal

Build a comprehensive connector framework that enables one-click integration of third-party services into generated Mobigen apps. Each connector handles:

- **Credential management** - Secure storage and encryption
- **SDK installation** - Automatic dependency injection
- **Code generation** - Template-based code insertion
- **Configuration** - Environment-specific settings
- **Validation** - Connection testing and health checks

### 1.2 Design Principles

1. **Plugin Architecture** - Connectors are self-contained, extensible modules
2. **Declarative Configuration** - Connectors defined via TypeScript configs, not imperative code
3. **Type Safety** - Full TypeScript support with Zod validation
4. **Security First** - AES-256-GCM encryption for all credentials
5. **AI-Friendly** - Clear code generation patterns for AI agents
6. **Testable** - Mock implementations for validation

### 1.3 Success Criteria

- [ ] 5 working connectors (Stripe, Firebase, Supabase, RevenueCat, OneSignal)
- [ ] One-click setup from dashboard
- [ ] Credentials encrypted at rest
- [ ] Generated code passes validation pipeline
- [ ] Documentation for adding custom connectors

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONNECTOR ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  WEB DASHBOARD                               │   │
│  │  - ConnectorList: Browse available connectors               │   │
│  │  - ConnectorCard: Display connector status                  │   │
│  │  - ConnectorConfigModal: Configure credentials              │   │
│  │  - ConnectorSetupWizard: Step-by-step setup                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  API LAYER (tRPC)                            │   │
│  │  - connectors.list()                                        │   │
│  │  - connectors.install({ projectId, connectorId, config })   │   │
│  │  - connectors.uninstall({ projectId, connectorId })         │   │
│  │  - connectors.testConnection({ projectId, connectorId })    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              CONNECTOR MANAGER SERVICE                       │   │
│  │  - Load connector definitions from registry                 │   │
│  │  - Encrypt/decrypt credentials                              │   │
│  │  - Orchestrate code generation via AI agents                │   │
│  │  - Track connector lifecycle (install, update, uninstall)   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                │
│         ▼                    ▼                    ▼                │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐           │
│  │  Stripe    │      │  Firebase  │      │  Supabase  │           │
│  │ Connector  │      │ Connector  │      │ Connector  │           │
│  └────────────┘      └────────────┘      └────────────┘           │
│         │                    │                    │                │
│         └────────────────────┼────────────────────┘                │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              CODE GENERATION ENGINE                          │   │
│  │  - Generate service files (src/services/stripe.ts)          │   │
│  │  - Generate hooks (src/hooks/useStripe.ts)                  │   │
│  │  - Update dependencies (package.json)                       │   │
│  │  - Generate types (src/types/stripe.ts)                     │   │
│  │  - Update environment config (.env.example)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              VALIDATION PIPELINE                             │   │
│  │  - Tier 1: TypeScript check                                 │   │
│  │  - Tier 2: ESLint + build check                             │   │
│  │  - Tier 3: E2E test with mocked connector                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Package Structure

```
packages/
├── connectors/
│   ├── core/                          # Base framework
│   │   ├── src/
│   │   │   ├── types.ts              # Shared types
│   │   │   ├── base-connector.ts     # Abstract base class
│   │   │   ├── registry.ts           # Connector registry
│   │   │   ├── manager.ts            # Connector lifecycle manager
│   │   │   ├── code-generator.ts     # Code generation utilities
│   │   │   ├── validator.ts          # Connection validators
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── stripe/                        # Stripe connector
│   │   ├── src/
│   │   │   ├── config.ts             # Connector definition
│   │   │   ├── templates/            # Code templates
│   │   │   │   ├── service.ts.template
│   │   │   │   ├── hooks.ts.template
│   │   │   │   └── types.ts.template
│   │   │   ├── validator.ts          # Connection test
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── firebase/                      # Firebase connector
│   ├── supabase/                      # Supabase connector
│   ├── revenuecat/                    # RevenueCat connector
│   └── onesignal/                     # OneSignal connector
│
├── ui/
│   └── src/
│       └── connectors/                # UI components
│           ├── ConnectorCard.tsx
│           ├── ConnectorList.tsx
│           ├── ConnectorConfigModal.tsx
│           ├── ConnectorSetupWizard.tsx
│           ├── hooks/
│           │   ├── useConnectors.ts
│           │   ├── useConnectorInstall.ts
│           │   └── useConnectorConfig.ts
│           └── index.ts
│
└── crypto/                            # Encryption utilities
    └── src/
        └── connector-encryption.ts    # Credential encryption
```

---

## 3. Core Connector Framework

### 3.1 Base Connector Interface

```typescript
// packages/connectors/core/src/types.ts

import { z } from 'zod';

/**
 * Connector lifecycle phases
 */
export enum ConnectorPhase {
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
 * Connector tier (free vs paid)
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
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Short description */
  description: string;

  /** Category */
  category: ConnectorCategory;

  /** Tier requirement */
  tier: ConnectorTier;

  /** Icon URL or emoji */
  icon: string;

  /** Provider website */
  providerUrl: string;

  /** Documentation URL */
  docsUrl?: string;

  /** Version */
  version: string;

  /** Platforms supported */
  platforms: ('ios' | 'android' | 'web')[];

  /** Required Expo SDK version */
  minExpoVersion?: string;

  /** Tags for search */
  tags: string[];
}

/**
 * Credential field definition
 */
export interface CredentialField {
  /** Field key */
  key: string;

  /** Display label */
  label: string;

  /** Help text */
  description?: string;

  /** Field type */
  type: 'text' | 'password' | 'url' | 'file' | 'select';

  /** Is required? */
  required: boolean;

  /** Default value */
  defaultValue?: string;

  /** Validation schema (Zod) */
  validation: z.ZodType<any>;

  /** For select type: options */
  options?: { label: string; value: string }[];

  /** Placeholder text */
  placeholder?: string;

  /** Link to instructions for obtaining this credential */
  instructionsUrl?: string;
}

/**
 * NPM dependency to install
 */
export interface ConnectorDependency {
  /** Package name */
  package: string;

  /** Version or range */
  version: string;

  /** Is it a dev dependency? */
  dev?: boolean;
}

/**
 * Environment variable to add
 */
export interface ConnectorEnvVar {
  /** Variable name */
  key: string;

  /** Description */
  description: string;

  /** Is it required? */
  required: boolean;

  /** Default value */
  defaultValue?: string;

  /** Maps to credential field */
  credentialKey?: string;
}

/**
 * File to generate
 */
export interface GeneratedFile {
  /** Relative path from project root */
  path: string;

  /** Template function */
  template: (context: CodeGenContext) => string;

  /** Should overwrite if exists? */
  overwrite?: boolean;
}

/**
 * Code generation context
 */
export interface CodeGenContext {
  /** Project ID */
  projectId: string;

  /** Connector ID */
  connectorId: string;

  /** Decrypted credentials */
  credentials: Record<string, string>;

  /** Environment variables */
  env: Record<string, string>;

  /** Project configuration */
  projectConfig: {
    bundleIdIos: string;
    bundleIdAndroid: string;
    appName: string;
  };

  /** Template ID (e.g., 'ecommerce', 'social') */
  templateId: string;
}

/**
 * Connector configuration validation result
 */
export interface ValidationResult {
  /** Is valid? */
  valid: boolean;

  /** Validation errors */
  errors?: Array<{
    field: string;
    message: string;
  }>;

  /** Warnings */
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Test succeeded? */
  success: boolean;

  /** Test duration (ms) */
  durationMs: number;

  /** Error message if failed */
  error?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Base connector definition
 */
export interface ConnectorDefinition {
  /** Metadata */
  metadata: ConnectorMetadata;

  /** Credential fields */
  credentialFields: CredentialField[];

  /** NPM dependencies */
  dependencies: ConnectorDependency[];

  /** Environment variables */
  envVars: ConnectorEnvVar[];

  /** Files to generate */
  generatedFiles: GeneratedFile[];

  /** Validate credentials */
  validateCredentials: (credentials: Record<string, string>) => Promise<ValidationResult>;

  /** Test connection with credentials */
  testConnection: (credentials: Record<string, string>) => Promise<ConnectionTestResult>;

  /** Post-install hook */
  onInstall?: (context: CodeGenContext) => Promise<void>;

  /** Pre-uninstall hook */
  onUninstall?: (context: CodeGenContext) => Promise<void>;
}
```

### 3.2 Base Connector Class

```typescript
// packages/connectors/core/src/base-connector.ts

import type {
  ConnectorDefinition,
  ConnectorMetadata,
  CredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  CodeGenContext,
} from './types';

/**
 * Abstract base class for all connectors
 *
 * Extend this class to create a new connector:
 *
 * @example
 * export class StripeConnector extends BaseConnector {
 *   constructor() {
 *     super({
 *       metadata: { ... },
 *       credentialFields: [ ... ],
 *       dependencies: [ ... ],
 *       envVars: [ ... ],
 *       generatedFiles: [ ... ],
 *     });
 *   }
 *
 *   async validateCredentials(credentials) { ... }
 *   async testConnection(credentials) { ... }
 * }
 */
export abstract class BaseConnector implements ConnectorDefinition {
  metadata: ConnectorMetadata;
  credentialFields: CredentialField[];
  dependencies: ConnectorDependency[];
  envVars: ConnectorEnvVar[];
  generatedFiles: GeneratedFile[];

  constructor(config: Omit<ConnectorDefinition, 'validateCredentials' | 'testConnection'>) {
    this.metadata = config.metadata;
    this.credentialFields = config.credentialFields;
    this.dependencies = config.dependencies;
    this.envVars = config.envVars;
    this.generatedFiles = config.generatedFiles;
  }

  /**
   * Validate credentials format and requirements
   */
  abstract validateCredentials(credentials: Record<string, string>): Promise<ValidationResult>;

  /**
   * Test connection with provided credentials
   */
  abstract testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult>;

  /**
   * Hook: Called after successful installation
   */
  async onInstall?(context: CodeGenContext): Promise<void>;

  /**
   * Hook: Called before uninstallation
   */
  async onUninstall?(context: CodeGenContext): Promise<void>;

  /**
   * Get credential schema for validation
   */
  getCredentialSchema(): Record<string, z.ZodType<any>> {
    return this.credentialFields.reduce((schema, field) => {
      schema[field.key] = field.validation;
      return schema;
    }, {} as Record<string, z.ZodType<any>>);
  }

  /**
   * Validate credentials using Zod schema
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
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        };
      }

      return {
        valid: false,
        errors: [{ field: 'unknown', message: String(error) }],
      };
    }
  }
}
```

### 3.3 Connector Registry

```typescript
// packages/connectors/core/src/registry.ts

import type { ConnectorDefinition } from './types';

/**
 * Global connector registry
 */
export class ConnectorRegistry {
  private connectors = new Map<string, ConnectorDefinition>();

  /**
   * Register a connector
   */
  register(connector: ConnectorDefinition): void {
    if (this.connectors.has(connector.metadata.id)) {
      throw new Error(`Connector ${connector.metadata.id} already registered`);
    }

    this.connectors.set(connector.metadata.id, connector);
  }

  /**
   * Get a connector by ID
   */
  get(id: string): ConnectorDefinition | undefined {
    return this.connectors.get(id);
  }

  /**
   * List all connectors
   */
  list(): ConnectorDefinition[] {
    return Array.from(this.connectors.values());
  }

  /**
   * List connectors by category
   */
  listByCategory(category: string): ConnectorDefinition[] {
    return this.list().filter(c => c.metadata.category === category);
  }

  /**
   * List connectors by tier
   */
  listByTier(tier: string): ConnectorDefinition[] {
    return this.list().filter(c => c.metadata.tier === tier);
  }

  /**
   * Search connectors
   */
  search(query: string): ConnectorDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(c =>
      c.metadata.name.toLowerCase().includes(lowerQuery) ||
      c.metadata.description.toLowerCase().includes(lowerQuery) ||
      c.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// Singleton instance
export const connectorRegistry = new ConnectorRegistry();
```

### 3.4 Connector Manager

```typescript
// packages/connectors/core/src/manager.ts

import { connectorRegistry } from './registry';
import { encryptCredentials, decryptCredentials } from '@mobigen/crypto/connector-encryption';
import { db } from '@mobigen/db';
import type {
  ConnectorDefinition,
  CodeGenContext,
  ValidationResult,
  ConnectionTestResult,
} from './types';

/**
 * Manages connector lifecycle for projects
 */
export class ConnectorManager {
  /**
   * Install a connector for a project
   */
  async install(
    projectId: string,
    connectorId: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const connector = connectorRegistry.get(connectorId);

    if (!connector) {
      return { success: false, error: `Connector ${connectorId} not found` };
    }

    // 1. Validate credentials
    const validationResult = await connector.validateCredentials(credentials);
    if (!validationResult.valid) {
      return {
        success: false,
        error: `Invalid credentials: ${validationResult.errors?.map(e => e.message).join(', ')}`,
      };
    }

    // 2. Test connection
    const connectionResult = await connector.testConnection(credentials);
    if (!connectionResult.success) {
      return {
        success: false,
        error: `Connection test failed: ${connectionResult.error}`,
      };
    }

    // 3. Encrypt credentials
    const encrypted = await encryptCredentials(credentials);

    // 4. Save to database
    await db.projectConnector.create({
      data: {
        projectId,
        connectorId,
        userId,
        status: 'installing',
        credentialsEncrypted: encrypted.ciphertext,
        credentialsIv: encrypted.iv,
        credentialsTag: encrypted.tag,
        config: {},
        installedAt: new Date(),
      },
    });

    try {
      // 5. Generate code
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error('Project not found');

      const context: CodeGenContext = {
        projectId,
        connectorId,
        credentials,
        env: this.buildEnvVars(connector, credentials),
        projectConfig: {
          bundleIdIos: project.bundleIdIos!,
          bundleIdAndroid: project.bundleIdAndroid!,
          appName: project.name,
        },
        templateId: project.templateId!,
      };

      await this.generateCode(connector, context);

      // 6. Run onInstall hook
      if (connector.onInstall) {
        await connector.onInstall(context);
      }

      // 7. Update status
      await db.projectConnector.updateMany({
        where: { projectId, connectorId },
        data: { status: 'installed' },
      });

      return { success: true };
    } catch (error) {
      // Mark as failed
      await db.projectConnector.updateMany({
        where: { projectId, connectorId },
        data: {
          status: 'failed',
          errorMessage: String(error),
        },
      });

      return {
        success: false,
        error: `Installation failed: ${String(error)}`,
      };
    }
  }

  /**
   * Uninstall a connector from a project
   */
  async uninstall(projectId: string, connectorId: string): Promise<void> {
    const connector = connectorRegistry.get(connectorId);

    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    // Update status
    await db.projectConnector.updateMany({
      where: { projectId, connectorId },
      data: { status: 'uninstalling' },
    });

    // Get credentials for onUninstall hook
    const record = await db.projectConnector.findFirst({
      where: { projectId, connectorId },
    });

    if (record) {
      const credentials = await decryptCredentials({
        ciphertext: record.credentialsEncrypted,
        iv: record.credentialsIv,
        tag: record.credentialsTag,
      });

      const project = await db.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error('Project not found');

      const context: CodeGenContext = {
        projectId,
        connectorId,
        credentials,
        env: this.buildEnvVars(connector, credentials),
        projectConfig: {
          bundleIdIos: project.bundleIdIos!,
          bundleIdAndroid: project.bundleIdAndroid!,
          appName: project.name,
        },
        templateId: project.templateId!,
      };

      // Run onUninstall hook
      if (connector.onUninstall) {
        await connector.onUninstall(context);
      }
    }

    // Delete from database
    await db.projectConnector.deleteMany({
      where: { projectId, connectorId },
    });
  }

  /**
   * Test connection for a connector
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
        error: `Connector ${connectorId} not found`,
      };
    }

    return connector.testConnection(credentials);
  }

  /**
   * Generate code for a connector
   */
  private async generateCode(
    connector: ConnectorDefinition,
    context: CodeGenContext
  ): Promise<void> {
    for (const file of connector.generatedFiles) {
      const content = file.template(context);

      // Use AI agent to write file
      await this.writeFile(context.projectId, file.path, content, file.overwrite);
    }

    // Update package.json with dependencies
    await this.updateDependencies(context.projectId, connector.dependencies);

    // Update .env.example with env vars
    await this.updateEnvExample(context.projectId, connector.envVars);
  }

  /**
   * Build environment variables from credentials
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
   * Write a file to the project
   */
  private async writeFile(
    projectId: string,
    path: string,
    content: string,
    overwrite?: boolean
  ): Promise<void> {
    // Implementation uses storage service
    // For now, placeholder
  }

  /**
   * Update package.json with dependencies
   */
  private async updateDependencies(
    projectId: string,
    dependencies: ConnectorDependency[]
  ): Promise<void> {
    // Implementation updates package.json
    // For now, placeholder
  }

  /**
   * Update .env.example with environment variables
   */
  private async updateEnvExample(
    projectId: string,
    envVars: ConnectorEnvVar[]
  ): Promise<void> {
    // Implementation appends to .env.example
    // For now, placeholder
  }
}

// Singleton instance
export const connectorManager = new ConnectorManager();
```

---

## 4. Individual Connector Specifications

### 4.1 Stripe Connector

```typescript
// packages/connectors/stripe/src/config.ts

import { BaseConnector } from '@mobigen/connectors/core';
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
  ConnectorCategory,
  ConnectorTier,
} from '@mobigen/connectors/core';

export class StripeConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept payments with Stripe',
      category: ConnectorCategory.PAYMENTS,
      tier: ConnectorTier.FREE,
      icon: '💳',
      providerUrl: 'https://stripe.com',
      docsUrl: 'https://stripe.com/docs/mobile/react-native',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      tags: ['payments', 'subscriptions', 'checkout'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'publishableKey',
        label: 'Publishable Key',
        description: 'Your Stripe publishable key (starts with pk_)',
        type: 'text',
        required: true,
        validation: z.string().startsWith('pk_', 'Must start with pk_'),
        placeholder: 'pk_test_...',
        instructionsUrl: 'https://stripe.com/docs/keys',
      },
      {
        key: 'secretKey',
        label: 'Secret Key',
        description: 'Your Stripe secret key (starts with sk_)',
        type: 'password',
        required: true,
        validation: z.string().startsWith('sk_', 'Must start with sk_'),
        placeholder: 'sk_test_...',
        instructionsUrl: 'https://stripe.com/docs/keys',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret (Optional)',
        description: 'Webhook signing secret for event verification',
        type: 'password',
        required: false,
        validation: z.string().startsWith('whsec_').optional(),
        placeholder: 'whsec_...',
        instructionsUrl: 'https://stripe.com/docs/webhooks',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: '@stripe/stripe-react-native', version: '^0.37.0' },
      { package: 'stripe', version: '^14.0.0' },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'STRIPE_PUBLISHABLE_KEY',
        description: 'Stripe publishable key',
        required: true,
        credentialKey: 'publishableKey',
      },
      {
        key: 'STRIPE_SECRET_KEY',
        description: 'Stripe secret key (server-side only)',
        required: true,
        credentialKey: 'secretKey',
      },
      {
        key: 'STRIPE_WEBHOOK_SECRET',
        description: 'Stripe webhook secret',
        required: false,
        credentialKey: 'webhookSecret',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/stripe.ts',
        template: (ctx) => stripeServiceTemplate(ctx),
      },
      {
        path: 'src/hooks/useStripe.ts',
        template: (ctx) => stripeHookTemplate(ctx),
      },
      {
        path: 'src/types/stripe.ts',
        template: (ctx) => stripeTypesTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    // Use base schema validation
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const stripe = new Stripe(credentials.secretKey, {
        apiVersion: '2023-10-16',
      });

      // Test by listing payment methods (limit 1)
      await stripe.paymentMethods.list({ limit: 1 });

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: { mode: credentials.secretKey.startsWith('sk_test_') ? 'test' : 'live' },
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

// Code templates
function stripeServiceTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated Stripe service
import { StripeProvider, useStripe as useStripeNative } from '@stripe/stripe-react-native';

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

export interface PaymentIntentParams {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Create a payment intent (call your backend)
 */
export async function createPaymentIntent(params: PaymentIntentParams): Promise<string> {
  // TODO: Replace with your backend endpoint
  const response = await fetch(\`https://api.${ctx.projectConfig.bundleIdIos}/payments/create-intent\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  return data.clientSecret;
}

/**
 * Process a payment with Stripe
 */
export async function processPayment(
  params: PaymentIntentParams,
  confirmPayment: ReturnType<typeof useStripeNative>['confirmPayment']
): Promise<PaymentResult> {
  try {
    const clientSecret = await createPaymentIntent(params);

    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      paymentIntentId: paymentIntent?.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment failed',
    };
  }
}
`;
}

function stripeHookTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated Stripe hooks
import { useStripe as useStripeNative } from '@stripe/stripe-react-native';
import { useState } from 'react';
import { processPayment, type PaymentIntentParams, type PaymentResult } from '../services/stripe';

export function useStripe() {
  const stripe = useStripeNative();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (params: PaymentIntentParams): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await processPayment(params, stripe.confirmPayment);

      if (!result.success) {
        setError(result.error || 'Payment failed');
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    pay,
    loading,
    error,
    stripe,
  };
}
`;
}

function stripeTypesTemplate(ctx: CodeGenContext): string {
  return `// Auto-generated Stripe types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}
`;
}
```

### 4.2 Firebase Connector

```typescript
// packages/connectors/firebase/src/config.ts

import { BaseConnector } from '@mobigen/connectors/core';
import { z } from 'zod';
import { initializeApp, cert } from 'firebase-admin/app';
import type {
  ConnectorMetadata,
  CredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  ConnectorCategory,
  ConnectorTier,
} from '@mobigen/connectors/core';

export class FirebaseConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'firebase',
      name: 'Firebase',
      description: 'Google Firebase for auth, database, and storage',
      category: ConnectorCategory.DATABASE,
      tier: ConnectorTier.FREE,
      icon: '🔥',
      providerUrl: 'https://firebase.google.com',
      docsUrl: 'https://rnfirebase.io',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      tags: ['authentication', 'database', 'storage', 'analytics'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'projectId',
        label: 'Firebase Project ID',
        description: 'Your Firebase project ID',
        type: 'text',
        required: true,
        validation: z.string().min(1),
        placeholder: 'my-firebase-project',
        instructionsUrl: 'https://firebase.google.com/docs/projects',
      },
      {
        key: 'apiKey',
        label: 'Web API Key',
        description: 'Firebase web API key',
        type: 'password',
        required: true,
        validation: z.string().startsWith('AIza'),
        placeholder: 'AIza...',
      },
      {
        key: 'appId',
        label: 'App ID',
        description: 'Firebase app ID',
        type: 'text',
        required: true,
        validation: z.string().startsWith('1:'),
        placeholder: '1:123456789:ios:abc123',
      },
      {
        key: 'messagingSenderId',
        label: 'Messaging Sender ID',
        description: 'For Firebase Cloud Messaging',
        type: 'text',
        required: false,
        validation: z.string().optional(),
        placeholder: '123456789',
      },
      {
        key: 'serviceAccount',
        label: 'Service Account JSON',
        description: 'Service account key for admin SDK (server-side)',
        type: 'file',
        required: true,
        validation: z.string().refine(
          (val) => {
            try {
              const json = JSON.parse(val);
              return json.type === 'service_account' && json.project_id && json.private_key;
            } catch {
              return false;
            }
          },
          { message: 'Invalid service account JSON' }
        ),
        instructionsUrl: 'https://firebase.google.com/docs/admin/setup',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: '@react-native-firebase/app', version: '^18.0.0' },
      { package: '@react-native-firebase/auth', version: '^18.0.0' },
      { package: '@react-native-firebase/firestore', version: '^18.0.0' },
      { package: '@react-native-firebase/storage', version: '^18.0.0' },
      { package: 'firebase-admin', version: '^11.0.0' },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'FIREBASE_PROJECT_ID',
        description: 'Firebase project ID',
        required: true,
        credentialKey: 'projectId',
      },
      {
        key: 'FIREBASE_API_KEY',
        description: 'Firebase API key',
        required: true,
        credentialKey: 'apiKey',
      },
      {
        key: 'FIREBASE_APP_ID',
        description: 'Firebase app ID',
        required: true,
        credentialKey: 'appId',
      },
      {
        key: 'FIREBASE_SERVICE_ACCOUNT',
        description: 'Firebase service account JSON (base64 encoded)',
        required: true,
        credentialKey: 'serviceAccount',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/firebase.ts',
        template: (ctx) => firebaseServiceTemplate(ctx),
      },
      {
        path: 'src/hooks/useFirebase.ts',
        template: (ctx) => firebaseHookTemplate(ctx),
      },
      {
        path: 'src/types/firebase.ts',
        template: (ctx) => firebaseTypesTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const serviceAccount = JSON.parse(credentials.serviceAccount);

      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: credentials.projectId,
      }, `test-${Date.now()}`);

      // Test by accessing Firestore
      const db = require('firebase-admin/firestore').getFirestore(app);
      await db.collection('_test').limit(1).get();

      // Clean up
      await app.delete();

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: { projectId: credentials.projectId },
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

// Templates omitted for brevity (similar structure to Stripe)
```

### 4.3 Supabase Connector

```typescript
// packages/connectors/supabase/src/config.ts

import { BaseConnector } from '@mobigen/connectors/core';
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
  ConnectorCategory,
  ConnectorTier,
} from '@mobigen/connectors/core';

export class SupabaseConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'supabase',
      name: 'Supabase',
      description: 'Open-source Firebase alternative with PostgreSQL',
      category: ConnectorCategory.DATABASE,
      tier: ConnectorTier.FREE,
      icon: '⚡',
      providerUrl: 'https://supabase.com',
      docsUrl: 'https://supabase.com/docs/guides/getting-started/quickstarts/react-native',
      version: '1.0.0',
      platforms: ['ios', 'android', 'web'],
      tags: ['database', 'authentication', 'storage', 'realtime'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'projectUrl',
        label: 'Project URL',
        description: 'Your Supabase project URL',
        type: 'url',
        required: true,
        validation: z.string().url().includes('supabase.co'),
        placeholder: 'https://xyzcompany.supabase.co',
        instructionsUrl: 'https://supabase.com/dashboard',
      },
      {
        key: 'anonKey',
        label: 'Anon Public Key',
        description: 'Public anon key (safe to use in client)',
        type: 'password',
        required: true,
        validation: z.string().startsWith('eyJ'),
        placeholder: 'eyJ...',
        instructionsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
      },
      {
        key: 'serviceRoleKey',
        label: 'Service Role Key (Optional)',
        description: 'Service role key for admin operations (server-side only)',
        type: 'password',
        required: false,
        validation: z.string().startsWith('eyJ').optional(),
        placeholder: 'eyJ...',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: '@supabase/supabase-js', version: '^2.38.0' },
      { package: '@react-native-async-storage/async-storage', version: '^1.19.0' },
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
        description: 'Supabase anon key',
        required: true,
        credentialKey: 'anonKey',
      },
      {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        description: 'Supabase service role key (server-side only)',
        required: false,
        credentialKey: 'serviceRoleKey',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/supabase.ts',
        template: (ctx) => supabaseServiceTemplate(ctx),
      },
      {
        path: 'src/hooks/useSupabase.ts',
        template: (ctx) => supabaseHookTemplate(ctx),
      },
      {
        path: 'src/types/supabase.ts',
        template: (ctx) => supabaseTypesTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      const supabase = createClient(credentials.projectUrl, credentials.anonKey);

      // Test by checking health
      const { data, error } = await supabase.from('_supabase_health').select('*').limit(1);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = table not found, which is fine
        throw error;
      }

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: { url: credentials.projectUrl },
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

// Templates omitted for brevity
```

### 4.4 RevenueCat Connector

```typescript
// packages/connectors/revenuecat/src/config.ts

import { BaseConnector } from '@mobigen/connectors/core';
import { z } from 'zod';
import type {
  ConnectorMetadata,
  CredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  ConnectorCategory,
  ConnectorTier,
} from '@mobigen/connectors/core';

export class RevenueCatConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'revenuecat',
      name: 'RevenueCat',
      description: 'In-app purchases and subscriptions made easy',
      category: ConnectorCategory.IN_APP_PURCHASES,
      tier: ConnectorTier.FREE,
      icon: '💰',
      providerUrl: 'https://www.revenuecat.com',
      docsUrl: 'https://www.revenuecat.com/docs/getting-started',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      tags: ['subscriptions', 'in-app-purchases', 'monetization'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'apiKey',
        label: 'Public SDK Key',
        description: 'RevenueCat public SDK key',
        type: 'password',
        required: true,
        validation: z.string().min(1),
        placeholder: 'appl_...',
        instructionsUrl: 'https://app.revenuecat.com/settings/api-keys',
      },
      {
        key: 'secretKey',
        label: 'Secret API Key (Optional)',
        description: 'RevenueCat secret key for server-side operations',
        type: 'password',
        required: false,
        validation: z.string().optional(),
        placeholder: 'sk_...',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: 'react-native-purchases', version: '^7.0.0' },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'REVENUECAT_PUBLIC_KEY',
        description: 'RevenueCat public SDK key',
        required: true,
        credentialKey: 'apiKey',
      },
      {
        key: 'REVENUECAT_SECRET_KEY',
        description: 'RevenueCat secret API key (server-side)',
        required: false,
        credentialKey: 'secretKey',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/revenuecat.ts',
        template: (ctx) => revenuecatServiceTemplate(ctx),
      },
      {
        path: 'src/hooks/useRevenueCat.ts',
        template: (ctx) => revenuecatHookTemplate(ctx),
      },
      {
        path: 'src/types/revenuecat.ts',
        template: (ctx) => revenuecatTypesTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Test using REST API
      const response = await fetch('https://api.revenuecat.com/v1/subscribers/test', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`API returned ${response.status}`);
      }

      return {
        success: true,
        durationMs: Date.now() - startTime,
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

// Templates omitted for brevity
```

### 4.5 OneSignal Connector

```typescript
// packages/connectors/onesignal/src/config.ts

import { BaseConnector } from '@mobigen/connectors/core';
import { z } from 'zod';
import type {
  ConnectorMetadata,
  CredentialField,
  ConnectorDependency,
  ConnectorEnvVar,
  GeneratedFile,
  ValidationResult,
  ConnectionTestResult,
  ConnectorCategory,
  ConnectorTier,
} from '@mobigen/connectors/core';

export class OneSignalConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'onesignal',
      name: 'OneSignal',
      description: 'Push notifications, in-app messaging, and email',
      category: ConnectorCategory.PUSH_NOTIFICATIONS,
      tier: ConnectorTier.FREE,
      icon: '🔔',
      providerUrl: 'https://onesignal.com',
      docsUrl: 'https://documentation.onesignal.com/docs/react-native-sdk-setup',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      tags: ['push-notifications', 'messaging', 'engagement'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'appId',
        label: 'OneSignal App ID',
        description: 'Your OneSignal app ID',
        type: 'text',
        required: true,
        validation: z.string().uuid(),
        placeholder: '12345678-1234-1234-1234-123456789012',
        instructionsUrl: 'https://documentation.onesignal.com/docs/accounts-and-keys',
      },
      {
        key: 'restApiKey',
        label: 'REST API Key',
        description: 'OneSignal REST API key for server-side operations',
        type: 'password',
        required: true,
        validation: z.string().min(1),
        placeholder: 'NGE...',
        instructionsUrl: 'https://documentation.onesignal.com/docs/accounts-and-keys',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: 'react-native-onesignal', version: '^5.0.0' },
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
        description: 'OneSignal REST API key',
        required: true,
        credentialKey: 'restApiKey',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/onesignal.ts',
        template: (ctx) => onesignalServiceTemplate(ctx),
      },
      {
        path: 'src/hooks/useOneSignal.ts',
        template: (ctx) => onesignalHookTemplate(ctx),
      },
      {
        path: 'src/types/onesignal.ts',
        template: (ctx) => onesignalTypesTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Test using REST API
      const response = await fetch(
        `https://onesignal.com/api/v1/apps/${credentials.appId}`,
        {
          headers: {
            'Authorization': `Basic ${credentials.restApiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: { appName: data.name },
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

// Templates omitted for brevity
```

---

## 5. Database Schema

### 5.1 Connector Tables

```prisma
// Add to packages/db/prisma/schema.prisma

// ============================================================================
// CONNECTORS & INTEGRATIONS
// ============================================================================

model Connector {
  id          String   @id @default(uuid())

  // Connector metadata (from registry)
  connectorId String   @unique @map("connector_id") // e.g., 'stripe', 'firebase'
  name        String
  description String
  category    String
  tier        String   @default("free")
  version     String
  icon        String?
  providerUrl String   @map("provider_url")
  docsUrl     String?  @map("docs_url")

  // Status
  isActive    Boolean  @default(true) @map("is_active")
  isOfficial  Boolean  @default(true) @map("is_official")

  // Stats
  installCount Int     @default(0) @map("install_count")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  projectConnectors ProjectConnector[]

  @@index([category])
  @@index([tier])
  @@index([isActive])
  @@map("connectors")
}

model ProjectConnector {
  id                   String    @id @default(uuid())
  projectId            String    @map("project_id")
  connectorId          String    @map("connector_id")
  userId               String    @map("user_id")

  // Status
  status               String    @default("installing") // installing, installed, failed, uninstalling

  // Encrypted credentials (AES-256-GCM)
  credentialsEncrypted String    @map("credentials_encrypted") @db.Text
  credentialsIv        String    @map("credentials_iv")
  credentialsTag       String    @map("credentials_tag")

  // Configuration
  config               Json      @default("{}")

  // Install tracking
  installedAt          DateTime  @default(now()) @map("installed_at")
  uninstalledAt        DateTime? @map("uninstalled_at")
  lastTestedAt         DateTime? @map("last_tested_at")

  // Error tracking
  errorMessage         String?   @map("error_message") @db.Text
  errorCount           Int       @default(0) @map("error_count")

  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  @@unique([projectId, connectorId])
  @@index([projectId])
  @@index([connectorId])
  @@index([userId])
  @@index([status])
  @@map("project_connectors")
}

model ConnectorInstallLog {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  connectorId String   @map("connector_id")
  userId      String   @map("user_id")

  // Install details
  phase       String // validate, test, generate, install, complete
  status      String // started, completed, failed
  message     String?
  details     Json     @default("{}")
  durationMs  Int?     @map("duration_ms")

  createdAt   DateTime @default(now()) @map("created_at")

  @@index([projectId])
  @@index([connectorId])
  @@index([userId])
  @@index([createdAt])
  @@map("connector_install_logs")
}
```

---

## 6. API Design

### 6.1 tRPC API Endpoints

```typescript
// packages/api/src/router/connectors.ts

import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { connectorRegistry, connectorManager } from '@mobigen/connectors/core';
import { TRPCError } from '@trpc/server';

export const connectorsRouter = router({
  /**
   * List all available connectors
   */
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        tier: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let connectors = connectorRegistry.list();

      if (input.category) {
        connectors = connectorRegistry.listByCategory(input.category);
      }

      if (input.tier) {
        connectors = connectorRegistry.listByTier(input.tier);
      }

      if (input.search) {
        connectors = connectorRegistry.search(input.search);
      }

      return connectors.map(c => ({
        id: c.metadata.id,
        name: c.metadata.name,
        description: c.metadata.description,
        category: c.metadata.category,
        tier: c.metadata.tier,
        icon: c.metadata.icon,
        providerUrl: c.metadata.providerUrl,
        docsUrl: c.metadata.docsUrl,
        version: c.metadata.version,
        platforms: c.metadata.platforms,
        tags: c.metadata.tags,
      }));
    }),

  /**
   * Get connector details including credential fields
   */
  get: protectedProcedure
    .input(z.object({ connectorId: z.string() }))
    .query(async ({ input }) => {
      const connector = connectorRegistry.get(input.connectorId);

      if (!connector) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Connector ${input.connectorId} not found`,
        });
      }

      return {
        metadata: connector.metadata,
        credentialFields: connector.credentialFields,
        dependencies: connector.dependencies,
        envVars: connector.envVars,
      };
    }),

  /**
   * Get installed connectors for a project
   */
  getInstalled: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { db } = ctx;

      const installed = await db.projectConnector.findMany({
        where: {
          projectId: input.projectId,
          status: 'installed',
        },
        include: {
          connector: true,
        },
      });

      return installed.map(pc => ({
        connectorId: pc.connectorId,
        name: pc.connector.name,
        icon: pc.connector.icon,
        installedAt: pc.installedAt,
        lastTestedAt: pc.lastTestedAt,
        config: pc.config,
      }));
    }),

  /**
   * Test connection with credentials
   */
  testConnection: protectedProcedure
    .input(
      z.object({
        connectorId: z.string(),
        credentials: z.record(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await connectorManager.testConnection(
        input.connectorId,
        input.credentials
      );

      return result;
    }),

  /**
   * Install a connector
   */
  install: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        connectorId: z.string(),
        credentials: z.record(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await connectorManager.install(
        input.projectId,
        input.connectorId,
        input.credentials,
        ctx.user.id
      );

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Installation failed',
        });
      }

      return { success: true };
    }),

  /**
   * Uninstall a connector
   */
  uninstall: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        connectorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await connectorManager.uninstall(input.projectId, input.connectorId);

      return { success: true };
    }),

  /**
   * Update connector configuration
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        connectorId: z.string(),
        config: z.record(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx;

      await db.projectConnector.updateMany({
        where: {
          projectId: input.projectId,
          connectorId: input.connectorId,
        },
        data: {
          config: input.config,
          updatedAt: new Date(),
        },
      });

      return { success: true };
    }),

  /**
   * Get installation logs
   */
  getInstallLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        connectorId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { db } = ctx;

      const logs = await db.connectorInstallLog.findMany({
        where: {
          projectId: input.projectId,
          connectorId: input.connectorId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      return logs;
    }),
});
```

---

## 7. Security & Credentials

### 7.1 Credential Encryption

```typescript
// packages/crypto/src/connector-encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CONNECTOR_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('CONNECTOR_ENCRYPTION_KEY not set');
  }

  // Key should be base64 encoded 32-byte string
  return Buffer.from(key, 'base64');
}

/**
 * Encrypt connector credentials
 */
export async function encryptCredentials(
  credentials: Record<string, string>
): Promise<EncryptedData> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(credentials);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * Decrypt connector credentials
 */
export async function decryptCredentials(
  encrypted: EncryptedData
): Promise<Record<string, string>> {
  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return JSON.parse(plaintext);
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
```

### 7.2 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` with real credentials
   - Use `.env.example` as template
   - Rotate encryption keys regularly

2. **Credential Storage**
   - AES-256-GCM encryption at rest
   - Separate IV and tag per record
   - Never log decrypted credentials

3. **Access Control**
   - Only project owner can install connectors
   - Audit log for credential access
   - Rate limit connection tests

4. **Transmission Security**
   - HTTPS only for API calls
   - Credentials only in request body, never URL
   - Short-lived session tokens

---

## 8. UI Components

### 8.1 ConnectorList Component

```typescript
// packages/ui/src/connectors/ConnectorList.tsx

import { useState } from 'react';
import { ConnectorCard } from './ConnectorCard';
import { trpc } from '@/utils/trpc';

interface ConnectorListProps {
  projectId: string;
}

export function ConnectorList({ projectId }: ConnectorListProps) {
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const { data: connectors, isLoading } = trpc.connectors.list.useQuery({
    category,
    search: search || undefined,
  });

  const { data: installed } = trpc.connectors.getInstalled.useQuery({ projectId });

  const installedIds = new Set(installed?.map(c => c.connectorId) || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Connectors</h2>
        <p className="text-muted-foreground">
          Add third-party services to your app with one click
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Search connectors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />

        <select
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          <option value="payments">Payments</option>
          <option value="database">Database</option>
          <option value="authentication">Authentication</option>
          <option value="push_notifications">Push Notifications</option>
          <option value="in_app_purchases">In-App Purchases</option>
        </select>
      </div>

      {/* Connector Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading connectors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectors?.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              projectId={projectId}
              isInstalled={installedIds.has(connector.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8.2 ConnectorCard Component

```typescript
// packages/ui/src/connectors/ConnectorCard.tsx

import { useState } from 'react';
import { ConnectorConfigModal } from './ConnectorConfigModal';

interface ConnectorCardProps {
  connector: {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
    category: string;
  };
  projectId: string;
  isInstalled: boolean;
}

export function ConnectorCard({ connector, projectId, isInstalled }: ConnectorCardProps) {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <>
      <div className="border rounded-lg p-6 hover:border-primary transition">
        {/* Icon & Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">{connector.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{connector.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-muted px-2 py-1 rounded">
                {connector.category}
              </span>
              {connector.tier !== 'free' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {connector.tier}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {connector.description}
        </p>

        {/* Action Button */}
        {isInstalled ? (
          <button
            className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg"
            disabled
          >
            ✓ Installed
          </button>
        ) : (
          <button
            onClick={() => setShowConfig(true)}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Install
          </button>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <ConnectorConfigModal
          connector={connector}
          projectId={projectId}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
}
```

### 8.3 ConnectorConfigModal Component

```typescript
// packages/ui/src/connectors/ConnectorConfigModal.tsx

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { useConnectorInstall } from './hooks/useConnectorInstall';

interface ConnectorConfigModalProps {
  connector: {
    id: string;
    name: string;
    icon: string;
  };
  projectId: string;
  onClose: () => void;
}

export function ConnectorConfigModal({
  connector,
  projectId,
  onClose,
}: ConnectorConfigModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'credentials' | 'test' | 'install'>('credentials');

  const { data: connectorDetails } = trpc.connectors.get.useQuery({
    connectorId: connector.id,
  });

  const { mutateAsync: testConnection, isLoading: isTesting } =
    trpc.connectors.testConnection.useMutation();

  const { install, isInstalling, error } = useConnectorInstall();

  const handleTestConnection = async () => {
    setStep('test');

    try {
      const result = await testConnection({
        connectorId: connector.id,
        credentials,
      });

      if (result.success) {
        setStep('install');
        handleInstall();
      } else {
        alert(`Connection test failed: ${result.error}`);
        setStep('credentials');
      }
    } catch (error) {
      alert('Connection test failed');
      setStep('credentials');
    }
  };

  const handleInstall = async () => {
    try {
      await install({
        projectId,
        connectorId: connector.id,
        credentials,
      });

      onClose();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl">{connector.icon}</div>
          <div>
            <h2 className="text-2xl font-bold">Configure {connector.name}</h2>
            <p className="text-muted-foreground">
              {step === 'credentials' && 'Enter your credentials'}
              {step === 'test' && 'Testing connection...'}
              {step === 'install' && 'Installing connector...'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-1 rounded ${step !== 'credentials' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded ${step === 'install' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Credential Fields */}
        {step === 'credentials' && connectorDetails && (
          <div className="space-y-4 mb-6">
            {connectorDetails.credentialFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>

                {field.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {field.description}
                  </p>
                )}

                <input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={credentials[field.key] || ''}
                  onChange={(e) =>
                    setCredentials({ ...credentials, [field.key]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border rounded-lg"
                  required={field.required}
                />

                {field.instructionsUrl && (
                  <a
                    href={field.instructionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    How to get this credential →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
            disabled={isInstalling || isTesting}
          >
            Cancel
          </button>

          {step === 'credentials' && (
            <button
              onClick={handleTestConnection}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 8.4 useConnectorInstall Hook

```typescript
// packages/ui/src/connectors/hooks/useConnectorInstall.ts

import { useState } from 'react';
import { trpc } from '@/utils/trpc';

export function useConnectorInstall() {
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useContext();

  const { mutateAsync, isLoading } = trpc.connectors.install.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh installed connectors
      utils.connectors.getInstalled.invalidate();
      utils.connectors.list.invalidate();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const install = async (params: {
    projectId: string;
    connectorId: string;
    credentials: Record<string, string>;
  }) => {
    setError(null);
    return mutateAsync(params);
  };

  return {
    install,
    isInstalling: isLoading,
    error,
  };
}
```

---

## 9. Code Generation Patterns

### 9.1 Template System

Each connector provides code templates that are populated with project-specific context:

```typescript
// Example: Stripe service template

function stripeServiceTemplate(ctx: CodeGenContext): string {
  return `
// Auto-generated Stripe service for ${ctx.projectConfig.appName}
// Generated on ${new Date().toISOString()}

import { StripeProvider } from '@stripe/stripe-react-native';

export const STRIPE_PUBLISHABLE_KEY = '${ctx.env.STRIPE_PUBLISHABLE_KEY}';

// ... rest of template
  `.trim();
}
```

### 9.2 File Generation Strategy

1. **Service Files** - Core SDK wrapper
   - `src/services/{connector}.ts`
   - Exports functions and configuration
   - No UI logic

2. **Hook Files** - React hooks
   - `src/hooks/use{Connector}.ts`
   - State management
   - Error handling

3. **Type Files** - TypeScript types
   - `src/types/{connector}.ts`
   - Interface definitions
   - Enums and constants

4. **Config Updates** - Existing files
   - `package.json` - Add dependencies
   - `.env.example` - Add environment variables
   - `App.tsx` - Add provider wrappers (if needed)

### 9.3 AI Agent Integration

Connectors integrate with the AI generation pipeline:

```typescript
// When installing a connector, trigger AI agent

async function installConnectorWithAI(
  projectId: string,
  connectorId: string,
  credentials: Record<string, string>
) {
  // 1. Generate code templates
  const connector = connectorRegistry.get(connectorId);
  const context = buildCodeGenContext(projectId, credentials);

  // 2. Create generation job
  const job = await createGenerationJob({
    projectId,
    phase: 'connector_install',
    metadata: { connectorId },
  });

  // 3. Run AI agent with connector context
  for await (const message of query({
    prompt: `Install ${connector.metadata.name} connector.

    Generated files:
    ${connector.generatedFiles.map(f => `- ${f.path}`).join('\n')}

    Write these files and update dependencies.`,
    options: {
      agents: { 'code-generator': codeGeneratorAgent },
      allowedTools: ['Read', 'Write', 'Edit', 'Bash'],
      permissionMode: 'acceptEdits',
    }
  })) {
    // Track progress
    await updateGenerationJobProgress(job.id, message);
  }

  // 4. Validate generated code
  await runValidationPipeline(projectId);
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// packages/connectors/stripe/src/__tests__/config.test.ts

import { StripeConnector } from '../config';

describe('StripeConnector', () => {
  let connector: StripeConnector;

  beforeEach(() => {
    connector = new StripeConnector();
  });

  test('metadata is correct', () => {
    expect(connector.metadata.id).toBe('stripe');
    expect(connector.metadata.name).toBe('Stripe');
    expect(connector.metadata.category).toBe('payments');
  });

  test('validates correct credentials', async () => {
    const result = await connector.validateCredentials({
      publishableKey: 'pk_test_123',
      secretKey: 'sk_test_456',
    });

    expect(result.valid).toBe(true);
  });

  test('rejects invalid credentials', async () => {
    const result = await connector.validateCredentials({
      publishableKey: 'invalid',
      secretKey: 'sk_test_456',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});
```

### 10.2 Integration Tests

```typescript
// packages/connectors/core/src/__tests__/manager.test.ts

import { ConnectorManager } from '../manager';
import { StripeConnector } from '@mobigen/connectors/stripe';
import { connectorRegistry } from '../registry';

describe('ConnectorManager', () => {
  let manager: ConnectorManager;

  beforeEach(() => {
    manager = new ConnectorManager();
    connectorRegistry.register(new StripeConnector());
  });

  test('installs connector successfully', async () => {
    const result = await manager.install(
      'project-123',
      'stripe',
      {
        publishableKey: 'pk_test_123',
        secretKey: process.env.STRIPE_TEST_KEY!,
      },
      'user-123'
    );

    expect(result.success).toBe(true);
  });

  test('fails installation with invalid credentials', async () => {
    const result = await manager.install(
      'project-123',
      'stripe',
      {
        publishableKey: 'invalid',
        secretKey: 'invalid',
      },
      'user-123'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### 10.3 E2E Tests

```typescript
// Test full connector lifecycle in a generated app

describe('Stripe Connector E2E', () => {
  test('generates working Stripe integration', async () => {
    // 1. Create test project
    const project = await createTestProject('ecommerce');

    // 2. Install Stripe connector
    await installConnector(project.id, 'stripe', {
      publishableKey: process.env.STRIPE_TEST_PK!,
      secretKey: process.env.STRIPE_TEST_SK!,
    });

    // 3. Validate generated files exist
    const files = await getProjectFiles(project.id);
    expect(files).toContain('src/services/stripe.ts');
    expect(files).toContain('src/hooks/useStripe.ts');

    // 4. Run validation pipeline
    const validation = await runValidationPipeline(project.id);
    expect(validation.passed).toBe(true);

    // 5. Test in Expo Go
    const previewUrl = await generatePreview(project.id);
    expect(previewUrl).toBeDefined();
  });
});
```

---

## 11. Implementation Plan

### 11.1 Sprint Tasks Breakdown

| Task ID | Task | Dependencies | Estimated Time |
|---------|------|--------------|----------------|
| S3-01 | Connector Framework Design | None | 4h |
| S3-02 | Stripe Connector | S3-01 | 8h |
| S3-03 | Firebase Connector | S3-01 | 8h |
| S3-04 | Supabase Connector | S3-01 | 8h |
| S3-05 | RevenueCat Connector | S3-01 | 6h |
| S3-06 | OneSignal Push Connector | S3-01 | 6h |
| S3-07 | Connector UI in Dashboard | S3-01, S3-02 | 6h |

### 11.2 Implementation Sequence

**Day 1: Framework Foundation**
1. Create package structure (`packages/connectors/core/`)
2. Implement base types and interfaces
3. Build `BaseConnector` abstract class
4. Create `ConnectorRegistry` and `ConnectorManager`
5. Implement credential encryption utilities
6. Add database schema and migrations

**Day 2: Stripe & Firebase Connectors**
1. Implement `StripeConnector` with full templates
2. Implement `FirebaseConnector` with full templates
3. Write unit tests for both connectors
4. Test connection validation

**Day 3: Remaining Connectors**
1. Implement `SupabaseConnector`
2. Implement `RevenueCatConnector`
3. Implement `OneSignalConnector`
4. Write unit tests for all three
5. Integration testing

**Day 4: API & UI**
1. Build tRPC API endpoints
2. Create React UI components:
   - `ConnectorList`
   - `ConnectorCard`
   - `ConnectorConfigModal`
   - `ConnectorSetupWizard`
3. Implement hooks for connector management
4. Integration with AI generation pipeline

**Day 5: Testing & Documentation**
1. E2E testing with generated apps
2. Validation pipeline integration
3. Write connector documentation
4. Create example connector template
5. Code review and refinement

### 11.3 Definition of Done

- [ ] All 5 connectors implemented and tested
- [ ] UI components functional in dashboard
- [ ] Credentials encrypted in database
- [ ] Connection tests pass for all connectors
- [ ] Generated code passes validation pipeline
- [ ] Unit test coverage > 80%
- [ ] E2E tests for at least 2 connectors
- [ ] Documentation for adding custom connectors
- [ ] AI integration tested

---

## Appendix A: Adding Custom Connectors

Developers can extend Mobigen by creating custom connectors:

### A.1 Custom Connector Template

```typescript
// my-custom-connector/src/config.ts

import { BaseConnector } from '@mobigen/connectors/core';
import { z } from 'zod';

export class MyCustomConnector extends BaseConnector {
  constructor() {
    super({
      metadata: {
        id: 'my-custom',
        name: 'My Custom Service',
        description: 'Custom integration',
        category: ConnectorCategory.OTHER,
        tier: ConnectorTier.FREE,
        icon: '🔌',
        providerUrl: 'https://example.com',
        version: '1.0.0',
        platforms: ['ios', 'android'],
        tags: ['custom'],
      },

      credentialFields: [
        {
          key: 'apiKey',
          label: 'API Key',
          description: 'Your API key',
          type: 'password',
          required: true,
          validation: z.string().min(1),
          placeholder: 'abc123',
        },
      ],

      dependencies: [
        { package: 'my-sdk', version: '^1.0.0' },
      ],

      envVars: [
        {
          key: 'MY_CUSTOM_API_KEY',
          description: 'API key',
          required: true,
          credentialKey: 'apiKey',
        },
      ],

      generatedFiles: [
        {
          path: 'src/services/mycustom.ts',
          template: (ctx) => this.serviceTemplate(ctx),
        },
      ],
    });
  }

  async validateCredentials(credentials) {
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials) {
    const startTime = Date.now();

    try {
      // Test API connection
      const response = await fetch('https://api.example.com/health', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
      });

      if (!response.ok) throw new Error('Connection failed');

      return { success: true, durationMs: Date.now() - startTime };
    } catch (error) {
      return {
        success: false,
        durationMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private serviceTemplate(ctx: CodeGenContext): string {
    return `
      // My Custom Service
      export const API_KEY = '${ctx.env.MY_CUSTOM_API_KEY}';
      // ... rest of template
    `;
  }
}

// Register connector
import { connectorRegistry } from '@mobigen/connectors/core';
connectorRegistry.register(new MyCustomConnector());
```

---

**Document Status:** Ready for Implementation
**Next Steps:**
1. Review and approve technical design
2. Create Sprint 3 implementation branch
3. Begin Day 1 framework implementation
4. Set up CI/CD for connector tests

---

**End of Technical Design**
