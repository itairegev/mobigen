// Firebase Connector for Mobigen
// Provides Firebase authentication, Firestore database, and Cloud Storage

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
  CodeGenContext,
} from '@mobigen/connectors/core';

// Import templates
import { firebaseConfigTemplate } from './templates/firebase-config';
import { firebaseAuthTemplate } from './templates/firebase-auth';
import { useFirebaseAuthTemplate } from './templates/use-firebase-auth';
import { firebaseFirestoreTemplate } from './templates/firebase-firestore';
import { useFirestoreTemplate } from './templates/use-firestore';
import { firebaseTypesTemplate } from './templates/firebase-types';

export class FirebaseConnector extends BaseConnector {
  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'firebase',
      name: 'Firebase',
      description: 'Google Firebase for auth, database, and storage',
      category: 'backend' as ConnectorCategory,
      tier: ConnectorTier.FREE,
      icon: '🔥',
      providerUrl: 'https://firebase.google.com',
      docsUrl: 'https://rnfirebase.io',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      tags: ['authentication', 'database', 'storage', 'analytics', 'backend'],
    };

    const credentialFields: CredentialField[] = [
      {
        key: 'apiKey',
        label: 'Web API Key',
        description: 'Firebase web API key',
        type: 'password',
        required: true,
        validation: z.string().startsWith('AIza', 'Must start with AIza'),
        placeholder: 'AIza...',
        instructionsUrl: 'https://firebase.google.com/docs/web/setup#config-object',
      },
      {
        key: 'authDomain',
        label: 'Auth Domain',
        description: 'Firebase authentication domain',
        type: 'text',
        required: true,
        validation: z.string().includes('.firebaseapp.com'),
        placeholder: 'my-app.firebaseapp.com',
      },
      {
        key: 'projectId',
        label: 'Project ID',
        description: 'Your Firebase project ID',
        type: 'text',
        required: true,
        validation: z.string().min(1),
        placeholder: 'my-firebase-project',
        instructionsUrl: 'https://firebase.google.com/docs/projects/learn-more#project-id',
      },
      {
        key: 'storageBucket',
        label: 'Storage Bucket',
        description: 'Firebase Cloud Storage bucket',
        type: 'text',
        required: true,
        validation: z.string().includes('.appspot.com'),
        placeholder: 'my-app.appspot.com',
      },
      {
        key: 'messagingSenderId',
        label: 'Messaging Sender ID',
        description: 'For Firebase Cloud Messaging',
        type: 'text',
        required: true,
        validation: z.string().regex(/^\d+$/, 'Must be numeric'),
        placeholder: '123456789012',
      },
      {
        key: 'appId',
        label: 'App ID',
        description: 'Firebase app ID',
        type: 'text',
        required: true,
        validation: z.string().startsWith('1:', 'Must start with 1:'),
        placeholder: '1:123456789:ios:abc123def456',
        instructionsUrl: 'https://firebase.google.com/docs/web/setup#config-object',
      },
    ];

    const dependencies: ConnectorDependency[] = [
      { package: '@react-native-firebase/app', version: '^18.0.0' },
      { package: '@react-native-firebase/auth', version: '^18.0.0' },
      { package: '@react-native-firebase/firestore', version: '^18.0.0' },
      { package: '@react-native-firebase/storage', version: '^18.0.0' },
    ];

    const envVars: ConnectorEnvVar[] = [
      {
        key: 'FIREBASE_API_KEY',
        description: 'Firebase API key',
        required: true,
        credentialKey: 'apiKey',
      },
      {
        key: 'FIREBASE_AUTH_DOMAIN',
        description: 'Firebase auth domain',
        required: true,
        credentialKey: 'authDomain',
      },
      {
        key: 'FIREBASE_PROJECT_ID',
        description: 'Firebase project ID',
        required: true,
        credentialKey: 'projectId',
      },
      {
        key: 'FIREBASE_STORAGE_BUCKET',
        description: 'Firebase storage bucket',
        required: true,
        credentialKey: 'storageBucket',
      },
      {
        key: 'FIREBASE_MESSAGING_SENDER_ID',
        description: 'Firebase messaging sender ID',
        required: true,
        credentialKey: 'messagingSenderId',
      },
      {
        key: 'FIREBASE_APP_ID',
        description: 'Firebase app ID',
        required: true,
        credentialKey: 'appId',
      },
    ];

    const generatedFiles: GeneratedFile[] = [
      {
        path: 'src/services/firebase-config.ts',
        template: (ctx) => firebaseConfigTemplate(ctx),
      },
      {
        path: 'src/services/firebase-auth.ts',
        template: (ctx) => firebaseAuthTemplate(ctx),
      },
      {
        path: 'src/hooks/use-firebase-auth.ts',
        template: (ctx) => useFirebaseAuthTemplate(ctx),
      },
      {
        path: 'src/services/firebase-firestore.ts',
        template: (ctx) => firebaseFirestoreTemplate(ctx),
      },
      {
        path: 'src/hooks/use-firestore.ts',
        template: (ctx) => useFirestoreTemplate(ctx),
      },
      {
        path: 'src/types/firebase.ts',
        template: (ctx) => firebaseTypesTemplate(ctx),
      },
    ];

    super({ metadata, credentialFields, dependencies, envVars, generatedFiles });
  }

  async validateCredentials(credentials: Record<string, string>): Promise<ValidationResult> {
    // Use base schema validation
    const schemaResult = await this.validateWithSchema(credentials);

    if (!schemaResult.valid) {
      return schemaResult;
    }

    // Additional validation: check that authDomain matches projectId
    const warnings: Array<{ field: string; message: string }> = [];

    if (!credentials.authDomain.includes(credentials.projectId)) {
      warnings.push({
        field: 'authDomain',
        message: 'Auth domain should typically contain your project ID',
      });
    }

    if (!credentials.storageBucket.includes(credentials.projectId)) {
      warnings.push({
        field: 'storageBucket',
        message: 'Storage bucket should typically contain your project ID',
      });
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async testConnection(credentials: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // Test Firebase connection by making a simple REST API call
      // Using the Firebase REST API to verify the project exists
      const response = await fetch(
        `https://firebaseremoteconfig.googleapis.com/v1/projects/${credentials.projectId}/remoteConfig`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
          },
        }
      );

      // Even a 401/403 means the project exists and API key format is valid
      // A 404 would mean the project doesn't exist
      if (response.status === 404) {
        return {
          success: false,
          durationMs: Date.now() - startTime,
          error: 'Firebase project not found. Please verify your Project ID.',
        };
      }

      // Any other response (including auth errors) means the config is structurally valid
      return {
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          projectId: credentials.projectId,
          status: response.status,
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

// Export singleton instance
export const firebaseConnector = new FirebaseConnector();
