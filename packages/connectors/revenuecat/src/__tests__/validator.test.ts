/**
 * Tests for RevenueCat API key validator
 */

import { validateApiKey, validateEntitlementId, validateSecretKey } from '../validator';

describe('validateApiKey', () => {
  describe('iOS API keys', () => {
    test('accepts valid iOS API key', () => {
      const result = validateApiKey('appl_1234567890abcdef');
      expect(result.valid).toBe(true);
      expect(result.platform).toBe('ios');
    });

    test('accepts iOS API key with uppercase', () => {
      const result = validateApiKey('appl_ABCDEF1234567890');
      expect(result.valid).toBe(true);
      expect(result.platform).toBe('ios');
    });
  });

  describe('Android API keys', () => {
    test('accepts valid Android API key', () => {
      const result = validateApiKey('goog_1234567890abcdef');
      expect(result.valid).toBe(true);
      expect(result.platform).toBe('android');
    });

    test('accepts Android API key with uppercase', () => {
      const result = validateApiKey('goog_ABCDEF1234567890');
      expect(result.valid).toBe(true);
      expect(result.platform).toBe('android');
    });
  });

  describe('Legacy API keys', () => {
    test('accepts legacy uppercase format', () => {
      const result = validateApiKey('ABCDEFGHIJKLMNOP1234567890');
      expect(result.valid).toBe(true);
    });

    test('accepts legacy with underscores', () => {
      const result = validateApiKey('ABC_DEF_123_456');
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid API keys', () => {
    test('rejects empty string', () => {
      const result = validateApiKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects whitespace only', () => {
      const result = validateApiKey('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects invalid prefix', () => {
      const result = validateApiKey('invalid_1234567890');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects special characters', () => {
      const result = validateApiKey('appl_abc!@#$%^&*()');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects null', () => {
      const result = validateApiKey(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('rejects undefined', () => {
      const result = validateApiKey(undefined as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('validateEntitlementId', () => {
  test('accepts valid entitlement ID', () => {
    const result = validateEntitlementId('premium');
    expect(result.valid).toBe(true);
  });

  test('accepts entitlement ID with underscores', () => {
    const result = validateEntitlementId('premium_access');
    expect(result.valid).toBe(true);
  });

  test('accepts entitlement ID with hyphens', () => {
    const result = validateEntitlementId('premium-access');
    expect(result.valid).toBe(true);
  });

  test('accepts entitlement ID with numbers', () => {
    const result = validateEntitlementId('premium123');
    expect(result.valid).toBe(true);
  });

  test('accepts mixed case', () => {
    const result = validateEntitlementId('PremiumAccess');
    expect(result.valid).toBe(true);
  });

  test('rejects empty string', () => {
    const result = validateEntitlementId('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects whitespace only', () => {
    const result = validateEntitlementId('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects special characters', () => {
    const result = validateEntitlementId('premium@access');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects spaces', () => {
    const result = validateEntitlementId('premium access');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects null', () => {
    const result = validateEntitlementId(null as any);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('validateSecretKey', () => {
  test('accepts valid secret key', () => {
    const result = validateSecretKey('sk_1234567890abcdef');
    expect(result.valid).toBe(true);
  });

  test('accepts empty string (optional)', () => {
    const result = validateSecretKey('');
    expect(result.valid).toBe(true);
  });

  test('accepts undefined (optional)', () => {
    const result = validateSecretKey(undefined as any);
    expect(result.valid).toBe(true);
  });

  test('accepts whitespace (optional)', () => {
    const result = validateSecretKey('   ');
    expect(result.valid).toBe(true);
  });

  test('rejects invalid prefix', () => {
    const result = validateSecretKey('invalid_1234567890');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects key without sk_ prefix', () => {
    const result = validateSecretKey('1234567890abcdef');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
