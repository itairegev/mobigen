/**
 * Stripe Connector Tests
 *
 * Unit tests for the Stripe connector.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { StripeConnector } from '../index';
import type { ValidationResult, ConnectionTestResult } from '@mobigen/connectors-core/types';

describe('StripeConnector', () => {
  let connector: StripeConnector;

  beforeEach(() => {
    connector = new StripeConnector();
  });

  // ============================================================================
  // Metadata Tests
  // ============================================================================

  describe('metadata', () => {
    test('should have correct connector ID', () => {
      expect(connector.metadata.id).toBe('stripe');
    });

    test('should have correct name', () => {
      expect(connector.metadata.name).toBe('Stripe');
    });

    test('should be in payments category', () => {
      expect(connector.metadata.category).toBe('payments');
    });

    test('should be free tier', () => {
      expect(connector.metadata.tier).toBe('free');
    });

    test('should support iOS and Android', () => {
      expect(connector.metadata.platforms).toContain('ios');
      expect(connector.metadata.platforms).toContain('android');
    });

    test('should have appropriate tags', () => {
      expect(connector.metadata.tags).toContain('payments');
      expect(connector.metadata.tags).toContain('subscriptions');
    });
  });

  // ============================================================================
  // Credential Fields Tests
  // ============================================================================

  describe('credentialFields', () => {
    test('should have publishableKey field', () => {
      const field = connector.credentialFields.find(f => f.key === 'publishableKey');
      expect(field).toBeDefined();
      expect(field?.required).toBe(true);
      expect(field?.type).toBe('text');
    });

    test('should have secretKey field', () => {
      const field = connector.credentialFields.find(f => f.key === 'secretKey');
      expect(field).toBeDefined();
      expect(field?.required).toBe(true);
      expect(field?.type).toBe('password');
    });

    test('should have optional webhookSecret field', () => {
      const field = connector.credentialFields.find(f => f.key === 'webhookSecret');
      expect(field).toBeDefined();
      expect(field?.required).toBe(false);
      expect(field?.type).toBe('password');
    });

    test('all required fields should have validation', () => {
      const requiredFields = connector.credentialFields.filter(f => f.required);
      requiredFields.forEach(field => {
        expect(field.validation).toBeDefined();
      });
    });

    test('all fields should have labels and descriptions', () => {
      connector.credentialFields.forEach(field => {
        expect(field.label).toBeDefined();
        expect(field.label.length).toBeGreaterThan(0);
        expect(field.description).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Dependencies Tests
  // ============================================================================

  describe('dependencies', () => {
    test('should include @stripe/stripe-react-native', () => {
      const dep = connector.dependencies.find(
        d => d.package === '@stripe/stripe-react-native'
      );
      expect(dep).toBeDefined();
      expect(dep?.version).toMatch(/^\^?\d+\.\d+\.\d+$/);
    });

    test('should include stripe package', () => {
      const dep = connector.dependencies.find(d => d.package === 'stripe');
      expect(dep).toBeDefined();
      expect(dep?.version).toMatch(/^\^?\d+\.\d+\.\d+$/);
    });

    test('all dependencies should have valid versions', () => {
      connector.dependencies.forEach(dep => {
        expect(dep.package).toBeTruthy();
        expect(dep.version).toBeTruthy();
        expect(dep.version).toMatch(/^\^?\d+/);
      });
    });
  });

  // ============================================================================
  // Environment Variables Tests
  // ============================================================================

  describe('envVars', () => {
    test('should have STRIPE_PUBLISHABLE_KEY', () => {
      const envVar = connector.envVars.find(v => v.key === 'STRIPE_PUBLISHABLE_KEY');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(true);
      expect(envVar?.credentialKey).toBe('publishableKey');
    });

    test('should have STRIPE_SECRET_KEY', () => {
      const envVar = connector.envVars.find(v => v.key === 'STRIPE_SECRET_KEY');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(true);
      expect(envVar?.credentialKey).toBe('secretKey');
    });

    test('should have STRIPE_WEBHOOK_SECRET', () => {
      const envVar = connector.envVars.find(v => v.key === 'STRIPE_WEBHOOK_SECRET');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(false);
      expect(envVar?.credentialKey).toBe('webhookSecret');
    });

    test('all env vars should have descriptions', () => {
      connector.envVars.forEach(envVar => {
        expect(envVar.description).toBeTruthy();
        expect(envVar.description.length).toBeGreaterThan(10);
      });
    });
  });

  // ============================================================================
  // Generated Files Tests
  // ============================================================================

  describe('generatedFiles', () => {
    test('should generate service file', () => {
      const file = connector.generatedFiles.find(
        f => f.path === 'src/services/stripe.ts'
      );
      expect(file).toBeDefined();
      expect(file?.template).toBeDefined();
    });

    test('should generate hooks file', () => {
      const file = connector.generatedFiles.find(f => f.path === 'src/hooks/useStripe.ts');
      expect(file).toBeDefined();
      expect(file?.template).toBeDefined();
    });

    test('should generate types file', () => {
      const file = connector.generatedFiles.find(f => f.path === 'src/types/stripe.ts');
      expect(file).toBeDefined();
      expect(file?.template).toBeDefined();
    });

    test('all templates should return non-empty strings', () => {
      const mockContext = {
        projectId: 'test-project',
        connectorId: 'stripe',
        credentials: {
          publishableKey: 'pk_test_123',
          secretKey: 'sk_test_456',
        },
        env: {
          STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
          STRIPE_SECRET_KEY: 'sk_test_456',
        },
        projectConfig: {
          bundleIdIos: 'com.test.app',
          bundleIdAndroid: 'com.test.app',
          appName: 'Test App',
        },
        templateId: 'ecommerce',
      };

      connector.generatedFiles.forEach(file => {
        const content = file.template(mockContext);
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });

  // ============================================================================
  // Credential Validation Tests
  // ============================================================================

  describe('validateCredentials', () => {
    test('should accept valid test credentials', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_test_FAKE_KEY_FOR_TESTING_12345',
        secretKey: 'sk_test_FAKE_KEY_FOR_TESTING_12345',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should reject publishable key without pk_ prefix', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'invalid_key',
        secretKey: 'sk_test_FAKE_KEY_FOR_TESTING_12345',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'publishableKey')).toBe(true);
    });

    test('should reject secret key without sk_ prefix', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_test_FAKE_KEY_FOR_TESTING_12345',
        secretKey: 'invalid_key',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'secretKey')).toBe(true);
    });

    test('should reject empty publishable key', async () => {
      const result = await connector.validateCredentials({
        publishableKey: '',
        secretKey: 'sk_test_FAKE_KEY_FOR_TESTING_12345',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject empty secret key', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_test_FAKE_KEY_FOR_TESTING_12345',
        secretKey: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should warn about mismatched modes (test vs live)', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_test_FAKE_KEY_FOR_TESTING_12345',
        secretKey: 'sk_live_FAKE_KEY_FOR_TESTING_12345',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.message.includes('different modes'))).toBe(true);
    });

    test('should warn about live keys', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_live_FAKE_KEY_FOR_TESTING_12345',
        secretKey: 'sk_live_FAKE_KEY_FOR_TESTING_12345',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.field === 'publishableKey')).toBe(true);
      expect(result.warnings?.some(w => w.field === 'secretKey')).toBe(true);
    });

    test('should accept valid webhook secret', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_test_FAKE_KEY_FOR_TESTING_12345',
        secretKey: 'sk_test_FAKE_KEY_FOR_TESTING_12345',
        webhookSecret: 'whsec_1234567890abcdefghijklmnop',
      });

      expect(result.valid).toBe(true);
    });

    test('should reject invalid webhook secret prefix', async () => {
      const result = await connector.validateCredentials({
        publishableKey: 'pk_test_FAKE_KEY_FOR_TESTING_12345',
        secretKey: 'sk_test_FAKE_KEY_FOR_TESTING_12345',
        webhookSecret: 'invalid_webhook_secret',
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.field === 'webhookSecret')).toBe(true);
    });
  });

  // ============================================================================
  // Connection Test (Mock) Tests
  // ============================================================================

  describe('testConnection', () => {
    test('should have testConnection method', () => {
      expect(connector.testConnection).toBeDefined();
      expect(typeof connector.testConnection).toBe('function');
    });

    test('should return ConnectionTestResult structure', async () => {
      // This will fail in test environment without real credentials
      // but we can test the structure
      const result = await connector.testConnection({
        publishableKey: 'pk_test_invalid',
        secretKey: 'sk_test_invalid',
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.durationMs).toBe('number');
    });

    // Note: Real connection tests require valid Stripe credentials
    // and should be run separately with test keys
  });

  // ============================================================================
  // Schema Tests
  // ============================================================================

  describe('getCredentialSchema', () => {
    test('should return schema for all credential fields', () => {
      const schema = connector.getCredentialSchema();

      expect(schema.publishableKey).toBeDefined();
      expect(schema.secretKey).toBeDefined();
      expect(schema.webhookSecret).toBeDefined();
    });
  });
});
