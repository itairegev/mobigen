# @mobigen/connectors-core

Core connector framework for Mobigen. This package provides the foundational types, classes, and utilities for building third-party service connectors.

## Installation

```bash
pnpm add @mobigen/connectors-core
```

## Features

- **Type-safe connector definitions** with Zod validation
- **Base connector class** for easy extension
- **Global connector registry** for discovery and management
- **Lifecycle management** with install/uninstall hooks
- **Credential encryption** using AES-256-GCM
- **Code generation utilities** for template-based file generation
- **Dependency injection** into package.json
- **Environment variable management**

## Quick Start

### Creating a Custom Connector

```typescript
import { BaseConnector, ConnectorCategory, ConnectorTier } from '@mobigen/connectors-core';
import { z } from 'zod';

export class MyConnector extends BaseConnector {
  constructor() {
    super({
      metadata: {
        id: 'my-connector',
        name: 'My Service',
        description: 'Integration with My Service',
        category: ConnectorCategory.OTHER,
        tier: ConnectorTier.FREE,
        icon: '🔌',
        providerUrl: 'https://myservice.com',
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
          placeholder: 'sk_...',
        },
      ],

      dependencies: [
        { package: 'my-sdk', version: '^1.0.0' },
      ],

      envVars: [
        {
          key: 'MY_SERVICE_API_KEY',
          description: 'API key for My Service',
          required: true,
          credentialKey: 'apiKey',
        },
      ],

      generatedFiles: [
        {
          path: 'src/services/myservice.ts',
          template: (ctx) => `
            export const API_KEY = '${ctx.env.MY_SERVICE_API_KEY}';
            // ... service implementation
          `,
        },
      ],
    });
  }

  async validateCredentials(credentials: Record<string, string>) {
    return this.validateWithSchema(credentials);
  }

  async testConnection(credentials: Record<string, string>) {
    return this.withTiming(async () => {
      const response = await fetch('https://api.myservice.com/health', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      return { status: 'healthy' };
    });
  }
}
```

### Registering a Connector

```typescript
import { connectorRegistry } from '@mobigen/connectors-core';
import { MyConnector } from './my-connector';

connectorRegistry.register(new MyConnector());
```

### Installing a Connector

```typescript
import { connectorManager } from '@mobigen/connectors-core';

const result = await connectorManager.installConnector(
  'project-123',
  'my-connector',
  {
    apiKey: 'sk_live_abc123',
  },
  'user-123'
);

if (result.success) {
  console.log('Connector installed!');
  console.log('Files generated:', result.filesGenerated);
} else {
  console.error('Installation failed:', result.error);
}
```

## API Reference

### Types

- `ConnectorMetadata` - Connector metadata and display information
- `ConnectorCredentialField` - Definition for credential input fields
- `ConnectorDependency` - NPM dependency to install
- `ConnectorEnvVar` - Environment variable configuration
- `GeneratedFile` - File to generate during installation
- `CodeGenContext` - Context provided to code templates
- `ValidationResult` - Result of credential validation
- `ConnectionTestResult` - Result of connection test
- `ConnectorDefinition` - Complete connector definition
- `InstallResult` - Result of connector installation

### Enums

- `ConnectorStatus` - Lifecycle status (available, installing, installed, failed, etc.)
- `ConnectorCategory` - Connector category (payments, database, auth, etc.)
- `ConnectorTier` - Access tier (free, pro, enterprise)

### Classes

#### BaseConnector

Abstract base class for all connectors. Extend this to create a new connector.

**Key Methods:**
- `validateCredentials(credentials)` - Validate credential format
- `testConnection(credentials)` - Test connection with credentials
- `onInstall(context)` - Optional post-install hook
- `onUninstall(context)` - Optional pre-uninstall hook

**Helper Methods:**
- `validateWithSchema(credentials)` - Validate using Zod schema
- `withTiming(testFn)` - Wrap connection test with timing
- `validateRequiredCredentials(credentials)` - Check required fields

#### ConnectorRegistry

Global registry for connector discovery and management.

**Methods:**
- `register(connector)` - Register a connector
- `get(id)` - Get connector by ID
- `has(id)` - Check if connector exists
- `list()` - List all connectors
- `listByCategory(category)` - Filter by category
- `listByTier(tier)` - Filter by tier
- `listByPlatform(platform)` - Filter by platform support
- `search(query)` - Search by name, description, or tags
- `groupByCategory()` - Group connectors by category

#### ConnectorManager

Manages connector lifecycle for projects.

**Methods:**
- `installConnector(projectId, connectorId, credentials, userId)` - Install a connector
- `uninstallConnector(projectId, connectorId)` - Uninstall a connector
- `testConnection(connectorId, credentials)` - Test connection without installing
- `getInstalledConnectors(projectId)` - Get installed connectors for a project
- `updateConnectorConfig(projectId, connectorId, config)` - Update connector configuration

### Encryption

Credential encryption using AES-256-GCM.

**Functions:**
- `encryptCredentials(credentials)` - Encrypt credentials
- `decryptCredentials(encrypted)` - Decrypt credentials
- `generateEncryptionKey()` - Generate a new encryption key
- `isValidEncryptionKey(key)` - Validate encryption key format
- `reencryptCredentials(encrypted, oldKey, newKey)` - Re-encrypt for key rotation

**Environment Variable:**
Set `CONNECTOR_ENCRYPTION_KEY` to a base64-encoded 256-bit key.

Generate one with:
```typescript
import { generateEncryptionKey } from '@mobigen/connectors-core';
console.log(generateEncryptionKey());
```

### Code Generator

Utilities for generating code from templates.

**Functions:**
- `generateFileContent(file, context)` - Generate content from template
- `generateFiles(files, context)` - Generate multiple files
- `mergeDependencies(packageJson, dependencies)` - Merge into package.json
- `generateEnvExample(envVars, includeValues)` - Generate .env.example content
- `mergeEnvExample(existing, envVars, connectorName)` - Merge into existing .env
- `smartMergeTypeScript(existing, newContent)` - Smart merge TypeScript files
- `validateGeneratedContent(content, path)` - Validate generated code

**Template Helpers:**
- `generateServiceTemplate(params)` - Generate service file
- `generateHookTemplate(params)` - Generate React hook
- `generateTypesTemplate(params)` - Generate TypeScript types

## Security

### Credential Encryption

All credentials are encrypted at rest using AES-256-GCM:
- **Algorithm:** AES-256-GCM (provides both confidentiality and authenticity)
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes, randomly generated per encryption)
- **Tag Size:** 128 bits (16 bytes, for authentication)

### Best Practices

1. **Never log decrypted credentials**
2. **Rotate encryption keys regularly**
3. **Use environment variables for keys**
4. **Validate all user input**
5. **Test connections before saving credentials**

## Examples

### Complete Connector Example

See the [Stripe connector](../stripe) for a complete, production-ready example.

### Testing a Connector

```typescript
import { MyConnector } from './my-connector';

const connector = new MyConnector();

// Test validation
const validation = await connector.validateCredentials({
  apiKey: 'sk_test_123',
});

console.log('Valid:', validation.valid);

// Test connection
const connection = await connector.testConnection({
  apiKey: process.env.MY_API_KEY!,
});

console.log('Connected:', connection.success);
console.log('Duration:', connection.durationMs, 'ms');
```

## Development

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

## License

MIT
