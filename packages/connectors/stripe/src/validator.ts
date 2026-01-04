/**
 * Stripe Connector Validator
 *
 * Provides validation utilities for testing Stripe connections.
 */

import Stripe from 'stripe';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
}

/**
 * Validate publishable key format
 */
export function validatePublishableKey(key: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!key) {
    errors.push({
      field: 'publishableKey',
      message: 'Publishable key is required',
    });
    return { valid: false, errors };
  }

  if (!key.startsWith('pk_')) {
    errors.push({
      field: 'publishableKey',
      message: 'Publishable key must start with "pk_"',
      code: 'INVALID_PREFIX',
    });
  }

  // Check for test vs live key
  const isTestKey = key.startsWith('pk_test_');
  const isLiveKey = key.startsWith('pk_live_');

  if (!isTestKey && !isLiveKey) {
    errors.push({
      field: 'publishableKey',
      message: 'Publishable key must be either a test key (pk_test_) or live key (pk_live_)',
      code: 'INVALID_KEY_TYPE',
    });
  }

  // Warn about live keys
  const warnings: ValidationError[] = [];
  if (isLiveKey) {
    warnings.push({
      field: 'publishableKey',
      message: 'You are using a live publishable key. Make sure this is intentional.',
      code: 'LIVE_KEY_WARNING',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate secret key format
 */
export function validateSecretKey(key: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!key) {
    errors.push({
      field: 'secretKey',
      message: 'Secret key is required',
    });
    return { valid: false, errors };
  }

  if (!key.startsWith('sk_')) {
    errors.push({
      field: 'secretKey',
      message: 'Secret key must start with "sk_"',
      code: 'INVALID_PREFIX',
    });
  }

  // Check for test vs live key
  const isTestKey = key.startsWith('sk_test_');
  const isLiveKey = key.startsWith('sk_live_');

  if (!isTestKey && !isLiveKey) {
    errors.push({
      field: 'secretKey',
      message: 'Secret key must be either a test key (sk_test_) or live key (sk_live_)',
      code: 'INVALID_KEY_TYPE',
    });
  }

  // Warn about live keys
  const warnings: ValidationError[] = [];
  if (isLiveKey) {
    warnings.push({
      field: 'secretKey',
      message: 'You are using a live secret key. Ensure proper security measures are in place.',
      code: 'LIVE_KEY_WARNING',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate webhook secret format
 */
export function validateWebhookSecret(secret: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Webhook secret is optional
  if (!secret) {
    return { valid: true };
  }

  if (!secret.startsWith('whsec_')) {
    errors.push({
      field: 'webhookSecret',
      message: 'Webhook secret must start with "whsec_"',
      code: 'INVALID_PREFIX',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate that publishable and secret keys match modes
 */
export function validateKeyModeMatch(
  publishableKey: string,
  secretKey: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const pkMode = publishableKey.startsWith('pk_test_') ? 'test' : 'live';
  const skMode = secretKey.startsWith('sk_test_') ? 'test' : 'live';

  if (pkMode !== skMode) {
    errors.push({
      field: 'publishableKey',
      message: \`Your publishable key (\${pkMode}) and secret key (\${skMode}) are from different modes\`,
      code: 'MODE_MISMATCH',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Test Stripe API connection
 *
 * Makes a minimal API call to verify credentials work.
 */
export async function testStripeConnection(
  secretKey: string
): Promise<{
  success: boolean;
  error?: string;
  errorCode?: string;
  mode?: 'test' | 'live';
  metadata?: Record<string, any>;
}> {
  try {
    // Initialize Stripe client
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });

    // Make a lightweight API call to test the connection
    // List payment methods is a safe, minimal call
    const result = await stripe.paymentMethods.list({ limit: 1 });

    const mode = secretKey.startsWith('sk_test_') ? 'test' : 'live';

    return {
      success: true,
      mode,
      metadata: {
        hasMore: result.has_more,
        objectType: result.object,
      },
    };
  } catch (error: any) {
    // Parse Stripe error
    let errorMessage = 'Connection test failed';
    let errorCode: string | undefined;

    if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Invalid API key. Please check your secret key.';
      errorCode = 'AUTHENTICATION_ERROR';
    } else if (error.type === 'StripeConnectionError') {
      errorMessage = 'Could not connect to Stripe. Check your internet connection.';
      errorCode = 'CONNECTION_ERROR';
    } else if (error.type === 'StripeAPIError') {
      errorMessage = 'Stripe API error occurred.';
      errorCode = 'API_ERROR';
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = error.code;
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

/**
 * Retrieve account information (for additional validation)
 */
export async function getAccountInfo(
  secretKey: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    email?: string;
    businessName?: string;
    country?: string;
    defaultCurrency?: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  };
  error?: string;
}> {
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });

    const account = await stripe.accounts.retrieve();

    return {
      success: true,
      data: {
        id: account.id,
        email: account.email || undefined,
        businessName: account.business_profile?.name || undefined,
        country: account.country || undefined,
        defaultCurrency: account.default_currency || undefined,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to retrieve account information',
    };
  }
}

/**
 * Comprehensive credential validation
 */
export async function validateCredentials(credentials: {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
}): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate publishable key
  const pkResult = validatePublishableKey(credentials.publishableKey);
  if (pkResult.errors) errors.push(...pkResult.errors);
  if (pkResult.warnings) warnings.push(...pkResult.warnings);

  // Validate secret key
  const skResult = validateSecretKey(credentials.secretKey);
  if (skResult.errors) errors.push(...skResult.errors);
  if (skResult.warnings) warnings.push(...skResult.warnings);

  // Validate webhook secret if provided
  if (credentials.webhookSecret) {
    const whResult = validateWebhookSecret(credentials.webhookSecret);
    if (whResult.errors) errors.push(...whResult.errors);
    if (whResult.warnings) warnings.push(...whResult.warnings);
  }

  // Validate mode match
  if (credentials.publishableKey && credentials.secretKey) {
    const modeResult = validateKeyModeMatch(
      credentials.publishableKey,
      credentials.secretKey
    );
    if (modeResult.errors) errors.push(...modeResult.errors);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
