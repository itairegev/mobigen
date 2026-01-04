/**
 * Tests for RevenueCat connector
 */

import { RevenueCatConnector } from '../index';

describe('RevenueCatConnector', () => {
  let connector: RevenueCatConnector;

  beforeEach(() => {
    connector = new RevenueCatConnector();
  });

  describe('metadata', () => {
    test('has correct metadata', () => {
      expect(connector.metadata.id).toBe('revenuecat');
      expect(connector.metadata.name).toBe('RevenueCat');
      expect(connector.metadata.category).toBe('in_app_purchases');
      expect(connector.metadata.tier).toBe('free');
    });

    test('has correct platforms', () => {
      expect(connector.metadata.platforms).toEqual(['ios', 'android']);
    });

    test('has correct tags', () => {
      expect(connector.metadata.tags).toContain('subscriptions');
      expect(connector.metadata.tags).toContain('in-app-purchases');
      expect(connector.metadata.tags).toContain('monetization');
    });
  });

  describe('credential fields', () => {
    test('has required iOS API key field', () => {
      const field = connector.credentialFields.find(f => f.key === 'apiKey');
      expect(field).toBeDefined();
      expect(field?.required).toBe(true);
      expect(field?.type).toBe('password');
    });

    test('has optional Android API key field', () => {
      const field = connector.credentialFields.find(f => f.key === 'apiKeyAndroid');
      expect(field).toBeDefined();
      expect(field?.required).toBe(false);
      expect(field?.type).toBe('password');
    });

    test('has required entitlement ID field', () => {
      const field = connector.credentialFields.find(f => f.key === 'entitlementId');
      expect(field).toBeDefined();
      expect(field?.required).toBe(true);
      expect(field?.type).toBe('text');
    });

    test('has optional secret key field', () => {
      const field = connector.credentialFields.find(f => f.key === 'secretKey');
      expect(field).toBeDefined();
      expect(field?.required).toBe(false);
      expect(field?.type).toBe('password');
    });
  });

  describe('dependencies', () => {
    test('includes react-native-purchases', () => {
      const dep = connector.dependencies.find(d => d.package === 'react-native-purchases');
      expect(dep).toBeDefined();
      expect(dep?.version).toBe('^7.0.0');
    });
  });

  describe('environment variables', () => {
    test('defines iOS API key env var', () => {
      const envVar = connector.envVars.find(e => e.key === 'REVENUECAT_API_KEY_IOS');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(true);
      expect(envVar?.credentialKey).toBe('apiKey');
    });

    test('defines Android API key env var', () => {
      const envVar = connector.envVars.find(e => e.key === 'REVENUECAT_API_KEY_ANDROID');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(false);
      expect(envVar?.credentialKey).toBe('apiKeyAndroid');
    });

    test('defines entitlement ID env var', () => {
      const envVar = connector.envVars.find(e => e.key === 'REVENUECAT_ENTITLEMENT_ID');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(true);
      expect(envVar?.credentialKey).toBe('entitlementId');
    });

    test('defines secret key env var', () => {
      const envVar = connector.envVars.find(e => e.key === 'REVENUECAT_SECRET_KEY');
      expect(envVar).toBeDefined();
      expect(envVar?.required).toBe(false);
      expect(envVar?.credentialKey).toBe('secretKey');
    });
  });

  describe('generated files', () => {
    test('generates service file', () => {
      const file = connector.generatedFiles.find(f => f.path === 'src/services/revenuecat.ts');
      expect(file).toBeDefined();
    });

    test('generates hooks file', () => {
      const file = connector.generatedFiles.find(f => f.path === 'src/hooks/useRevenueCat.ts');
      expect(file).toBeDefined();
    });

    test('generates types file', () => {
      const file = connector.generatedFiles.find(f => f.path === 'src/types/revenuecat.ts');
      expect(file).toBeDefined();
    });

    test('generates provider file', () => {
      const file = connector.generatedFiles.find(f => f.path === 'src/providers/revenuecat-provider.tsx');
      expect(file).toBeDefined();
    });
  });

  describe('validateCredentials', () => {
    test('validates correct iOS-only credentials', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
        entitlementId: 'premium',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validates credentials with Android key', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
        apiKeyAndroid: 'goog_1234567890abcdef',
        entitlementId: 'premium',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validates credentials with secret key', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
        entitlementId: 'premium',
        secretKey: 'sk_1234567890abcdef',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('rejects missing iOS API key', async () => {
      const result = await connector.validateCredentials({
        entitlementId: 'premium',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects invalid iOS API key format', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'invalid_key',
        entitlementId: 'premium',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'apiKey')).toBe(true);
    });

    test('rejects invalid Android API key format', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
        apiKeyAndroid: 'invalid_android_key',
        entitlementId: 'premium',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'apiKeyAndroid')).toBe(true);
    });

    test('rejects missing entitlement ID', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('rejects invalid entitlement ID', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
        entitlementId: 'invalid@entitlement',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'entitlementId')).toBe(true);
    });

    test('rejects invalid secret key format', async () => {
      const result = await connector.validateCredentials({
        apiKey: 'appl_1234567890abcdef',
        entitlementId: 'premium',
        secretKey: 'invalid_secret',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'secretKey')).toBe(true);
    });
  });

  describe('testConnection', () => {
    test('returns metadata on successful test', async () => {
      // Mock successful fetch
      global.fetch = jest.fn().mockResolvedValue({
        status: 404, // 404 is expected for test connection
      });

      const result = await connector.testConnection({
        apiKey: 'appl_1234567890abcdef',
        entitlementId: 'premium',
      });

      expect(result.success).toBe(true);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.platform).toBe('ios');
      expect(result.metadata?.entitlementId).toBe('premium');
    });

    test('includes Android key status in metadata', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 404,
      });

      const result = await connector.testConnection({
        apiKey: 'appl_1234567890abcdef',
        apiKeyAndroid: 'goog_1234567890abcdef',
        entitlementId: 'premium',
      });

      expect(result.success).toBe(true);
      expect(result.metadata?.hasAndroidKey).toBe(true);
    });

    test('fails on 401 unauthorized', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 401,
      });

      const result = await connector.testConnection({
        apiKey: 'appl_invalid',
        entitlementId: 'premium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('authentication failed');
    });

    test('fails on Android key 401', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ status: 404 }) // iOS key OK
        .mockResolvedValueOnce({ status: 401 }); // Android key fails

      const result = await connector.testConnection({
        apiKey: 'appl_1234567890abcdef',
        apiKeyAndroid: 'goog_invalid',
        entitlementId: 'premium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Android API key');
    });

    test('handles network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await connector.testConnection({
        apiKey: 'appl_1234567890abcdef',
        entitlementId: 'premium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
