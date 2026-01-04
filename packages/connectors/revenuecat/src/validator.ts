/**
 * RevenueCat API key validator
 *
 * Validates RevenueCat API key formats for iOS and Android
 */

export interface ApiKeyValidation {
  valid: boolean;
  platform?: 'ios' | 'android';
  environment?: 'production' | 'sandbox';
  error?: string;
}

/**
 * Validate RevenueCat API key format
 *
 * RevenueCat keys typically follow these patterns:
 * - iOS: appl_... (Apple prefix)
 * - Android: goog_... (Google prefix)
 * - Legacy: starts with uppercase letters
 */
export function validateApiKey(apiKey: string): ApiKeyValidation {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = apiKey.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  // Check for iOS key (Apple)
  if (trimmed.startsWith('appl_')) {
    return {
      valid: true,
      platform: 'ios',
      environment: detectEnvironment(trimmed),
    };
  }

  // Check for Android key (Google)
  if (trimmed.startsWith('goog_')) {
    return {
      valid: true,
      platform: 'android',
      environment: detectEnvironment(trimmed),
    };
  }

  // Legacy format (uppercase letters, numbers, underscores)
  if (/^[A-Z0-9_]+$/.test(trimmed)) {
    return {
      valid: true,
      environment: detectEnvironment(trimmed),
    };
  }

  return {
    valid: false,
    error: 'Invalid API key format. Expected format: appl_... (iOS) or goog_... (Android)',
  };
}

/**
 * Detect environment from API key
 * RevenueCat doesn't have explicit test/live prefixes,
 * but we can provide guidance based on the dashboard
 */
function detectEnvironment(apiKey: string): 'production' | 'sandbox' {
  // RevenueCat uses the same keys for both environments
  // The environment is determined by the build configuration
  // We'll default to sandbox for safety
  return 'sandbox';
}

/**
 * Validate entitlement ID format
 */
export function validateEntitlementId(entitlementId: string): { valid: boolean; error?: string } {
  if (!entitlementId || typeof entitlementId !== 'string') {
    return { valid: false, error: 'Entitlement ID is required' };
  }

  const trimmed = entitlementId.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Entitlement ID cannot be empty' };
  }

  // Entitlement IDs should be alphanumeric with underscores and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Entitlement ID can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { valid: true };
}

/**
 * Validate secret API key format (for server-side operations)
 */
export function validateSecretKey(secretKey: string): { valid: boolean; error?: string } {
  if (!secretKey || typeof secretKey !== 'string') {
    return { valid: true }; // Secret key is optional
  }

  const trimmed = secretKey.trim();

  if (trimmed.length === 0) {
    return { valid: true }; // Empty is okay (optional)
  }

  // Secret keys typically start with 'sk_'
  if (!trimmed.startsWith('sk_')) {
    return {
      valid: false,
      error: 'Secret key should start with sk_',
    };
  }

  return { valid: true };
}
